"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction, type SignInFormData } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function SignInContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.get("error") === "invalid_session") {
      setError("Your session expired or is invalid. Please sign in again.");
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data: SignInFormData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const result = await signInAction(data);

    if (result?.success === false) {
      setIsSubmitting(false);
      const error = result.error;
      if ("form" in error && typeof error.form === "string") {
        setError(error.form);
      } else if ("email" in error && Array.isArray(error.email)) {
        setError(error.email[0]);
      } else if ("password" in error && Array.isArray(error.password)) {
        setError(error.password[0]);
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bcfi-gradient-bg bcfi-wave-pattern">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/white.png"
              alt="Stock Pilot"
              width={200}
              height={48}
              priority
            />
          </div>
          <p className="mt-2 text-sm text-[#6B7280]">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7280]">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-medium text-[#3A9FE1] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bcfi-gradient-bg">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/images/white.png"
                alt="Stock Pilot"
                width={200}
                height={48}
              />
            </div>
            <p className="mt-2 text-sm text-[#6B7280]">Sign in to your account</p>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
