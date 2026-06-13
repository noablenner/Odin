"use client";

import { apiPost } from "./api";

export async function startCheckout(plan: "pro" | "business") {
  const { url } = await apiPost<{ url: string }>("/api/billing/checkout", { plan });
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await apiPost<{ url: string }>("/api/billing/portal");
  window.location.href = url;
}
