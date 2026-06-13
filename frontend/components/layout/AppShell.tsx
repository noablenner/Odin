"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * Wraps every authenticated tab: enforces auth, renders sidebar + header.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      apiGet("/api/auth/me")
        .then((me) => setIsSuperadmin(!!me.is_superadmin))
        .catch(() => {});
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isSuperadmin={isSuperadmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          email={user.email}
          onSignOut={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
