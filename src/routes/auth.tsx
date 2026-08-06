import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteConfig } from "@/lib/site-config";
import {
  normalizeEmail,
  friendlyAuthError,
  validateNewPassword,
} from "@/lib/password";
import logo from "@/assets/izems-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/site/PasswordField";
import { PasswordStrength } from "@/components/site/PasswordStrength";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign In | ${siteConfig.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/admin" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = normalizeEmail(email);
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/admin",
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Account created. Check your email to confirm, then sign in.");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = normalizeEmail(forgotEmail);
    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("If that email has an account, a reset link is on its way.");
    setForgotOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <img src={logo} alt={siteConfig.name} className="size-12 rounded-md bg-white p-1" />
        <div className="text-left">
          <p className="font-bold leading-tight text-primary">IZEMS</p>
          <p className="text-xs text-muted-foreground">Global Resources Ltd</p>
        </div>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {forgotOpen ? (
          <>
            <h1 className="text-center text-xl font-bold text-primary">
              Reset your password
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Enter your email and we'll send you a secure reset link.
            </p>
            <form onSubmit={handleForgot} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-cta hover:bg-brand-cta-hover"
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-center text-sm text-accent hover:underline"
              >
                ← Back to sign in
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-center text-xl font-bold text-primary">Account Access</h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Sign in to manage your IZEMS dashboard.
            </p>

            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input
                      id="si-email"
                      type="email"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="si-pass">Password</Label>
                    <PasswordField
                      id="si-pass"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotOpen(true);
                      }}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-cta hover:bg-brand-cta-hover"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="su-name">Full Name</Label>
                    <Input
                      id="su-name"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="su-pass">Password</Label>
                    <PasswordField
                      id="su-pass"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                    <PasswordStrength password={password} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="su-confirm">Confirm Password</Label>
                    <PasswordField
                      id="su-confirm"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-cta hover:bg-brand-cta-hover"
                  >
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="text-accent hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
