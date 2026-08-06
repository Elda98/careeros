import { SignIn } from "@clerk/nextjs";

// Redirects to /dashboard, which itself redirects to /onboarding if the
// user hasn't completed it yet (FR-ONBOARD-1) — one place decides that,
// not duplicated across sign-in and sign-up.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
