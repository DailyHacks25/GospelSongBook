"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MAX } from "@/lib/validation/auth";

export interface SignInFormProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  signingInLabel: string;
  invalidCredentialsLabel: string;
  genericErrorLabel: string;
  emailPlaceholder: string;
  callbackUrl: string;
}

export function SignInForm({
  emailLabel,
  passwordLabel,
  submitLabel,
  signingInLabel,
  invalidCredentialsLabel,
  genericErrorLabel,
  emailPlaceholder,
  callbackUrl,
}: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      // NextAuth returns error="CredentialsSignin" for bad credentials.
      const code = (result as { error?: string } | undefined)?.error;
      setError(code && code !== "CredentialsSignin" ? genericErrorLabel : invalidCredentialsLabel);
    } catch {
      setError(genericErrorLabel);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="signin-email">{emailLabel}</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          placeholder={emailPlaceholder}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="signin-password">{passwordLabel}</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? signingInLabel : submitLabel}
      </Button>
    </form>
  );
}
