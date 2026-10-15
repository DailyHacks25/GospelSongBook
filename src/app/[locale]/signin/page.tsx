import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getPageContext } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { callbackUrl } = await searchParams;
  const { locale, dict, user } = await getPageContext(localeParam);

  if (user) redirect(`/${locale}`);

  // Only allow same-site relative callback URLs (no open redirects).
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : `/${locale}`;

  return (
    <div className="container flex flex-col items-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl">{dict.auth.signInTitle}</CardTitle>
          <CardDescription>{dict.auth.signInSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignInForm
            emailLabel={dict.auth.email}
            passwordLabel={dict.auth.password}
            submitLabel={dict.auth.signInAction}
            signingInLabel={dict.auth.signingIn}
            invalidCredentialsLabel={dict.auth.invalidCredentials}
            genericErrorLabel={dict.errors.generic}
            emailPlaceholder="admin@example.com"
            callbackUrl={safeCallback}
          />
          <p className="text-center text-xs text-muted-foreground">{dict.auth.securityNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
