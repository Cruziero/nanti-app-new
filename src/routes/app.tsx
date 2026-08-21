import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/nanti/app-shell";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export const Route = createFileRoute("/app")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      {/* Nested workspace routes render here. */}
      <Outlet />
    </AppShell>
  );
}
