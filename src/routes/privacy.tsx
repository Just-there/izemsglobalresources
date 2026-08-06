import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy | ${siteConfig.name}` },
      {
        name: "description",
        content:
          "How IZEMS Global Resources Ltd collects, uses and protects your personal information.",
      },
      { property: "og:title", content: `Privacy Policy | ${siteConfig.name}` },
      {
        property: "og:description",
        content: "How IZEMS Global Resources Ltd handles your personal data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 2026">
      <p className="text-sm leading-relaxed">
        This Privacy Policy explains how {siteConfig.name} ("we", "us", "our")
        collects, uses and safeguards the information you provide when you use our
        website or contact us for products and quotes.
      </p>

      <LegalSection heading="1. Information We Collect">
        <p>
          When you submit an inquiry, subscribe to our newsletter or contact us, we
          may collect your name, email address, phone number and the details of your
          request. We also collect basic technical information such as your browser
          type for security and analytics purposes.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Respond to your inquiries and provide quotes;</li>
          <li>Process and fulfil orders for steel and building materials;</li>
          <li>Send updates about your requests and, if you opt in, our newsletter;</li>
          <li>Improve our website, products and customer service.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Sharing of Information">
        <p>
          We do not sell your personal information. We only share it with trusted
          service providers who help us operate our website and deliver our services,
          and where required by law.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data Security">
        <p>
          We apply reasonable technical and organisational measures to protect your
          information. However, no method of transmission over the internet is
          completely secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your Rights">
        <p>
          You may request access to, correction of, or deletion of your personal
          information, and you may unsubscribe from our newsletter at any time using
          the link in our emails or by contacting us.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact Us">
        <p>
          For any privacy questions, contact us at{" "}
          <a className="text-accent underline" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>{" "}
          or {siteConfig.phone}. Our office is located at {siteConfig.address}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}