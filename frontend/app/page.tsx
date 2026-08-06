import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AiAgentsSection } from "@/components/marketing/ai-agents-section";
import { CareerJourneySection } from "@/components/marketing/career-journey";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { ProductPreviewSection } from "@/components/marketing/product-preview";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";

/**
 * The public marketing site — everything a visitor sees before signing in.
 * A signed-in visitor is sent straight to the product (/dashboard, which
 * itself decides whether they still need onboarding) rather than seeing
 * marketing chrome again — the two experiences (§ "NEW PRODUCT DIRECTION")
 * are kept strictly separate at this one entry point.
 */
export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <AiAgentsSection />
        <CareerJourneySection />
        <ProductPreviewSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
