import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const SETTINGS_KEY = "nanti.settings.v1";

function isOnboarded(): boolean {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const settings = JSON.parse(raw);
      return settings.onboarded === true;
    }
  } catch { /* ignore */ }
  return false;
}

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          if (isOnboarded()) {
            navigate({ to: "/app/today" });
          } else {
            navigate({ to: "/welcome" });
          }
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          if (isOnboarded()) {
            navigate({ to: "/app/today" });
          } else {
            navigate({ to: "/welcome" });
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden w-1/2 bg-[#1a1a1a] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="max-w-md px-8 text-center">
          <Link to="/" className="mb-8 inline-block">
            <span className="text-4xl font-bold text-white">NANTI</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-white">
            Jangan pernah kehilangan komitmen di WhatsApp lagi.
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Forward atau paste percakapan WhatsApp Anda, dan AI akan mengekstrak tugas, deadline,
            dan follow-up secara otomatis.
          </p>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="text-2xl font-bold text-foreground">
              NANTI
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
