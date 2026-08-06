import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BRAND } from "@/lib/brand";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {BRAND.name}
      </Link>

      <h1 className="mt-8 text-title text-foreground sm:text-display">Terms of Service</h1>
      <p className="mt-2 text-caption text-muted-foreground">Last updated {new Date().getFullYear()}</p>

      <div className="mt-10 space-y-8 text-small leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-heading text-foreground">The service</h2>
          <p className="mt-2">
            {BRAND.name} provides skill-gap analysis, roadmap generation, and CV/profile feedback for
            individual career planning. Outputs are advisory — {BRAND.name} does not guarantee any
            employment outcome.
          </p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">Your account</h2>
          <p className="mt-2">
            You&apos;re responsible for the accuracy of the information you provide. One active goal is
            tracked at a time; previous goals are retained, not deleted, when you change it.
          </p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">Subscription &amp; billing</h2>
          <p className="mt-2">
            A free tier and a paid tier are available. You can cancel your subscription at any time
            directly from Settings, without contacting support. Cancellation retains your data and does
            not delete your account.
          </p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">Acceptable use</h2>
          <p className="mt-2">
            Submit only your own information and documents. Don&apos;t attempt to access another user&apos;s
            data or use the service to generate content unrelated to your own career development.
          </p>
        </section>

        <section>
          <h2 className="text-heading text-foreground">Changes</h2>
          <p className="mt-2">
            These terms may be updated as the product evolves. Continued use after a change constitutes
            acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
