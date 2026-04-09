import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 26, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-2">
              maroa.ai ("we," "our," or "us") operates a digital marketing automation platform that helps small businesses manage their social media, advertising, and content marketing. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service").
            </p>
            <p className="mt-2">
              By accessing or using the Service, you agree to this Privacy Policy. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="mt-3 font-medium text-foreground">2.1 Information You Provide</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Account Information:</strong> Name, email address, password, business name, industry, and location when you create an account.</li>
              <li><strong>Business Profile:</strong> Target audience descriptions, brand tone preferences, marketing goals, competitor information, and business photos you upload.</li>
              <li><strong>Payment Information:</strong> Billing details processed through our third-party payment processor (Stripe). We do not store full credit card numbers on our servers.</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests you send to us.</li>
            </ul>

            <h3 className="mt-3 font-medium text-foreground">2.2 Information Collected Automatically</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform, and interaction patterns.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
              <li><strong>Cookies:</strong> Session cookies for authentication, preference cookies, and analytics cookies.</li>
            </ul>

            <h3 className="mt-3 font-medium text-foreground">2.3 Information from Third Parties</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Social Media Platforms:</strong> When you connect Facebook, Instagram, Google Ads, or other accounts, we receive access tokens and platform-specific metrics (reach, impressions, engagement, followers) as authorized by you.</li>
              <li><strong>OAuth Providers:</strong> If you sign in with Google or Apple, we receive your name and email address from the identity provider.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>To provide, operate, and maintain the Service, including AI-generated content, ad management, and competitor analysis.</li>
              <li>To personalize content and marketing strategies based on your business profile and audience data.</li>
              <li>To process transactions and send related billing information.</li>
              <li>To communicate with you about updates, promotions, and support.</li>
              <li>To monitor and analyze usage patterns to improve the Service.</li>
              <li>To detect, prevent, and address fraud, abuse, and technical issues.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. How We Share Your Information</h2>
            <p className="mt-2">We do not sell your personal information. We may share information with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our Service (hosting, analytics, payment processing, email delivery).</li>
              <li><strong>Social Media Platforms:</strong> When you authorize us to post content or manage ads on your behalf via their APIs.</li>
              <li><strong>AI Providers:</strong> To generate content and marketing recommendations. Data shared with AI providers is used solely for service delivery and is not used to train their models.</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as a business asset.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p className="mt-2">
              We retain your personal information for as long as your account is active or as needed to provide the Service. If you request account deletion, we will delete or anonymize your data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, resolving disputes).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Security</h2>
            <p className="mt-2">
              We implement industry-standard security measures including encryption in transit (TLS/SSL), encryption at rest, access controls, and regular security audits. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p className="mt-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data. See our <Link to="/delete-data" className="text-primary hover:underline">Data Deletion</Link> page.</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:support@maroa.ai" className="text-primary hover:underline">support@maroa.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management, and optional analytics cookies to understand how the Service is used. You can control cookie preferences through your browser settings. Disabling essential cookies may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. International Data Transfers</h2>
            <p className="mt-2">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including standard contractual clauses where required by applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Children's Privacy</h2>
            <p className="mt-2">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Contact Us</h2>
            <p className="mt-2">
              If you have questions about this Privacy Policy, please contact us at:<br />
              <a href="mailto:support@maroa.ai" className="text-primary hover:underline">support@maroa.ai</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} maroa.ai — <Link to="/terms" className="hover:underline">Terms</Link> · <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/delete-data" className="hover:underline">Delete Data</Link>
      </footer>
    </div>
  );
}