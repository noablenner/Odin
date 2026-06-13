"""Stripe billing — checkout, customer portal, webhook, subscription sync."""
from __future__ import annotations

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.api.deps import get_current_user
from app.config import settings
from app.db import queries
from app.models.schemas import AuthUser, CheckoutIn, CheckoutOut, OkResponse
from app.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])

stripe.api_key = settings.stripe_secret_key


def _price_for_plan(plan: str) -> str:
    return {
        "pro": settings.stripe_price_id_pro,
        "business": settings.stripe_price_id_business,
    }.get(plan, settings.stripe_price_id_pro)


def _ensure_customer(user: AuthUser) -> str:
    row = queries.get_user(user.id) or {}
    customer_id = row.get("stripe_customer_id")
    if customer_id:
        return customer_id
    customer = stripe.Customer.create(email=user.email, metadata={"user_id": user.id})
    queries.update_user(user.id, {"stripe_customer_id": customer.id})
    return customer.id


@router.post("/checkout", response_model=CheckoutOut)
async def create_checkout(body: CheckoutIn, user: AuthUser = Depends(get_current_user)):
    customer_id = _ensure_customer(user)
    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": _price_for_plan(body.plan), "quantity": 1}],
        success_url=f"{settings.frontend_url}/settings?checkout=success",
        cancel_url=f"{settings.frontend_url}/settings?checkout=cancel",
        metadata={"user_id": user.id, "plan": body.plan},
    )
    return CheckoutOut(url=session.url)


@router.post("/portal", response_model=CheckoutOut)
async def customer_portal(user: AuthUser = Depends(get_current_user)):
    customer_id = _ensure_customer(user)
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.frontend_url}/settings",
    )
    return CheckoutOut(url=session.url)


@router.get("/history")
async def billing_history(user: AuthUser = Depends(get_current_user)):
    row = queries.get_user(user.id) or {}
    customer_id = row.get("stripe_customer_id")
    if not customer_id:
        return {"invoices": []}
    invoices = stripe.Invoice.list(customer=customer_id, limit=12)
    return {
        "invoices": [
            {
                "id": inv.id,
                "amount_paid": inv.amount_paid,
                "currency": inv.currency,
                "status": inv.status,
                "created": inv.created,
                "pdf": inv.invoice_pdf,
            }
            for inv in invoices.auto_paging_iter()
        ]
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request, stripe_signature: str = Header(default="")
):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(400, f"Invalid Stripe signature: {exc}")

    etype = event["type"]
    obj = event["data"]["object"]
    log.info("Stripe event: %s", etype)

    if etype == "checkout.session.completed":
        user_id = (obj.get("metadata") or {}).get("user_id")
        plan = (obj.get("metadata") or {}).get("plan", "pro")
        if user_id:
            queries.update_user(
                user_id,
                {
                    "plan": plan,
                    "subscription_status": "active",
                    "stripe_subscription_id": obj.get("subscription"),
                    "stripe_customer_id": obj.get("customer"),
                },
            )

    elif etype in ("customer.subscription.updated", "customer.subscription.created"):
        _sync_subscription(obj)

    elif etype == "customer.subscription.deleted":
        _sync_subscription(obj, canceled=True)

    return OkResponse()


def _sync_subscription(sub: dict, canceled: bool = False) -> None:
    from app.db.supabase import db

    customer_id = sub.get("customer")
    found = (
        db().table("users").select("id").eq("stripe_customer_id", customer_id).limit(1).execute()
    )
    if not found.data:
        return
    user_id = found.data[0]["id"]
    patch: dict = {
        "subscription_status": "canceled" if canceled else sub.get("status", "active"),
        "stripe_subscription_id": sub.get("id"),
    }
    if canceled:
        patch["plan"] = "free"
    queries.update_user(user_id, patch)
