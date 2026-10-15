import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Local (SQLite) user id. */
    userId?: string;
    role?: Role;
  }
}
