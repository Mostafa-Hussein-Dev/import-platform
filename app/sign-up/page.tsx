"use client";

import { useState } from "react";
import { signUpAction, type SignUpFormData } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data: SignUpFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = await signUpAction(data);

    if (result?.success === false) {
      setIsSubmitting(false);
      const error = result.error;
      if ("form" in error && typeof error.form === "string") {
        setError(error.form);
      } else if ("name" in error && Array.isArray(error.name)) {
        setError(error.name[0]);
      } else if ("email" in error && Array.isArray(error.email)) {
        setError(error.email[0]);
      } else if ("password" in error && Array.isArray(error.password)) {
        setError(error.password[0]);
      } else if ("confirmPassword" in error && Array.isArray(error.confirmPassword)) {
        setError(error.confirmPassword[0]);
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bcfi-gradient-bg bcfi-wave-pattern">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-[#212861] flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#212861]">
            Import Platform
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Create a new account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              required
              disabled={isSubmitting}
            />
          </div>

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
              minLength={8}
              disabled={isSubmitting}
            />
            <p className="text-xs text-[#9CA3AF]">
              Must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7280]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-[#3A9FE1] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
