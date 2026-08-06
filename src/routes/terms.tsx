import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions | ${siteConfig.name}` },
      {
        name: "description",
        content:
          "The terms and conditions governing the use of the IZEMS Global Resources Ltd website and services.",
      },
      { property: "og:title", content: `Terms & Conditions | ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Terms governing the use of IZEMS Global Resources Ltd services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="July 2026">
      <p className="text-sm leading-relaxed">
        These Terms &amp; Conditions govern your use of the {siteConfig.name} website
        and the purchase of products and services from us. By using our website or
        placing an inquiry, you agree to these terms.
      </p>

      <LegalSection heading="1. Products & Quotes">
        <p>
          All product listings are invitations to inquire, not binding offers. Prices,
          availability and specifications are confirmed at the time we issue a formal
          quote and may change without notice.
        </p>
      </LegalSection>

      <LegalSection heading="2. Orders & Payment">
        <p>
          Orders are confirmed once a quote is accepted and payment terms are agreed.
          We reserve the right to decline or cancel any order at our discretion,
          including where product information is incorrect.
        </p>
      </LegalSection>

      <LegalSection heading="3. Delivery">
        <p>
          We aim to deliver within agreed timeframes across Nigeria. Delivery dates
          are estimates and we are not liable for delays caused by circumstances
          beyond our reasonable control.
        </p>
      </LegalSection>

      <LegalSection heading="4. Returns & Warranty">
        <p>
          Products are supplied in line with the specifications confirmed in your
          quote. Claims for damaged or incorrect goods must be raised within a
          reasonable time of delivery. Please contact us to arrange inspection.
        </p>
      </LegalSection>

      <LegalSection heading="5. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {siteConfig.name} is not liable for
          any indirect or consequential loss arising from the use of our website or
          products.
        </p>
      </LegalSection>

      <LegalSection heading="6. Governing Law">
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p>
          Questions about these terms? Contact us at{" "}
          <a className="text-accent underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>{" "}
          or {siteConfig.phone}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}