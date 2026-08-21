import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error("Gagal mengirim email reset password.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Cek email Anda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kami telah mengirim link reset password ke <span className="font-medium">{email}</span>.
            Silakan cek inbox atau spam folder Anda.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link to="/auth/login">Kembali ke masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Lupa password?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Mengirim..." : "Kirim link reset"}
        </Button>
      </form>

      <Button variant="ghost" className="w-full" asChild>
        <Link to="/auth/login">Kembali ke masuk</Link>
      </Button>
    </div>
  );
}
