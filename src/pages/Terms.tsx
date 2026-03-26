import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Terms() {
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

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 26, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the maroa.ai platform and services ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of a business, you represent that you have authority to bind that business to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">
              maroa.ai is an AI-powered digital marketing automation platform for small businesses. The Service includes, but is not limited to: AI-generated social media content, automated ad campaign management, competitor analysis, content scheduling, performance analytics, and marketing strategy recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account Registration</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>You must be at least 18 years old to use the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Subscription and Payments</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>The Service offers free and paid subscription plans. Features and limits vary by plan.</li>
              <li>Paid subscriptions are billed monthly or annually in advance through our payment processor (Stripe).</li>
              <li>Prices are subject to change with 30 days' prior notice.</li>
              <li>Refunds are handled on a case-by-case basis. Contact us at <a href="mailto:hello@maroa.ai" className="text-primary hover:underline">hello@maroa.ai</a> for refund requests.</li>
              <li>Ad budgets set within the platform are charged separately through the respective advertising platforms (e.g., Meta, Google).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
              <li>Upload content that is defamatory, obscene, fraudulent, or infringes on intellectual property rights.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or related systems.</li>
              <li>Use the Service to send spam, unsolicited messages, or deceptive advertising.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use automated tools (bots, scrapers) to access the Service without our written consent.</li>
              <li>Resell or redistribute the Service without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Our Property:</strong> The Service, including its design, code, algorithms, branding, and documentation, is owned by maroa.ai and protected by intellectual property laws.</li>
              <li><strong>Your Content:</strong> You retain ownership of content you upload (photos, text, business information). By uploading content, you grant us a non-exclusive, worldwide license to use it solely for providing the Service.</li>
              <li><strong>AI-Generated Content:</strong> Content generated by our AI tools on your behalf is licensed to you for your business use. You are responsible for reviewing and approving all generated content before publication.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Third-Party Integrations</h2>
            <p className="mt-2">
              The Service integrates with third-party platforms (Facebook, Instagram, Google Ads, etc.). Your use of these integrations is subject to the respective platform's terms of service and policies. We are not responsible for the actions, content, or policies of third-party platforms. Authorization to connect accounts can be revoked by you at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Disclaimers</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>The Service is provided "as is" and "as available" without warranties of any kind, express or implied.</li>
              <li>We do not guarantee specific marketing results, follower growth, revenue increases, or advertising performance.</li>
              <li>AI-generated content may contain errors. You are solely responsible for reviewing, approving, and publishing content.</li>
              <li>We do not guarantee uninterrupted or error-free operation of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, maroa.ai and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising out of or in connection with your use of the Service. Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Indemnification</h2>
            <p className="mt-2">
              You agree to indemnify and hold harmless maroa.ai from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Termination</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You may cancel your account at any time through the dashboard settings or by contacting us.</li>
              <li>We may suspend or terminate your account if you violate these Terms or engage in conduct harmful to the Service or other users.</li>
              <li>Upon termination, your right to use the Service ceases immediately. We may delete your data in accordance with our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Changes to Terms</h2>
            <p className="mt-2">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Governing Law</h2>
            <p className="mt-2">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Contact Us</h2>
            <p className="mt-2">
              For questions about these Terms, contact us at:<br />
              <a href="mailto:hello@maroa.ai" className="text-primary hover:underline">hello@maroa.ai</a>
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