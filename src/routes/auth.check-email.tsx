import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/check-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email } = Route.useSearch();
  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });
      if (error) {
        toast.error(
          /rate|too many/i.test(error.message)
            ? "Tunggu sebentar sebelum meminta email lagi."
            : "Email konfirmasi belum berhasil dikirim ulang.",
        );
        return;
      }
      toast.success("Email konfirmasi dikirim ulang.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="size-5" />
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Cek email kamu</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {email
            ? <>Kami mengirim link untuk menyelesaikan pendaftaran ke <span className="font-medium text-foreground">{email}</span>.</>
            : "Kami mengirim link untuk menyelesaikan pendaftaran akun NANTI."}
        </p>
      </div>

      <p className="text-[12.5px] leading-5 text-muted-foreground">
        Setelah email dikonfirmasi, kamu akan kembali ke NANTI dan melanjutkan onboarding.
      </p>

      {email ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resending}
          onClick={() => void resend()}
        >
          {resending ? (
            <RefreshCw className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Kirim ulang email
        </Button>
      ) : null}

      <Link
        to="/auth/login"
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        Kembali ke halaman masuk
      </Link>
    </div>
  );
}
