import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

export const authOptions: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

/**
 * Get the current server session.
 * This is an alias for auth to avoid confusion with Next.js middleware auth.
 */
export const getServerSession = auth;

/**
 * Verifies that the current session user exists in the database.
 * Returns null if user exists, or throws/redirects if invalid.
 * Use this in server actions to ensure session validity.
 */
export async function requireValidUser(
  session: Session | null
): Promise<{ id: string; email: string; name: string | null } | null> {
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    // User from session doesn't exist in database
    // This can happen if database was reset or user was deleted
    return null;
  }

  return user;
}

/**
 * Middleware helper that checks user existence and redirects if invalid.
 * Use this in server components/actions where you want automatic redirect.
 */
export async function requireUserOrRedirect() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    // Session exists but user doesn't - redirect to sign in with a message
    redirect("/sign-in?error=invalid_session");
  }

  return user;
}

/**
 * Checks if a user session is valid (user exists in database).
 * Returns true if valid, false otherwise.
 * Use this for conditional checks without throwing.
 */
export async function isValidUserSession(
  session: Session | null
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  return !!user;
}
