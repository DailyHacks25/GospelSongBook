"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { LogOut, Music4, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/types";

export interface UserMenuProps {
  user: SessionUser | null;
  locale: Locale;
  dict: Dictionary;
}

export function UserMenu({ user, locale, dict }: UserMenuProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  if (!user) {
    return (
      <Button
        size="sm"
        onClick={() => {
          setBusy(true);
          void signIn("google", { callbackUrl: `/${locale}` }).finally(() => setBusy(false));
        }}
        disabled={busy}
      >
        <UserIcon className="h-4 w-4" />
        {busy ? dict.auth.signingIn : dict.nav.signIn}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[12rem] gap-2">
          <UserIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{user.name || user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-xs font-normal text-muted-foreground">{dict.auth.signedInAs}</span>
          <span className="truncate text-sm font-medium">{user.email}</span>
          {user.role === "admin" ? (
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3 w-3" />
              {dict.nav.admin}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/submit`}>
            <Music4 className="h-4 w-4" />
            {dict.nav.submit}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/my-songs`}>
            <UserIcon className="h-4 w-4" />
            {dict.nav.mySongs}
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin`}>
              <ShieldCheck className="h-4 w-4" />
              {dict.nav.admin}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            setBusy(true);
            void signOut({ callbackUrl: `/${locale}` }).finally(() => setBusy(false));
            router.refresh();
          }}
        >
          <LogOut className="h-4 w-4" />
          {dict.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
