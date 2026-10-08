import type { GlobalRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: GlobalRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: GlobalRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: GlobalRole;
  }
}
