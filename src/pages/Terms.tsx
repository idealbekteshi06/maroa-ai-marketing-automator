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

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 19, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">By accessing or using maroa.ai (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">maroa.ai is an AI-powered marketing automation platform that helps small businesses generate content, schedule social media posts, manage advertising campaigns, and analyze marketing performance. The Service may integrate with third-party platforms including Meta (Facebook and Instagram), Google, and others.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Eligibility</h2>
            <p className="mt-2">You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use the Service. By using the Service, you represent that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Account Registration</h2>
            <p className="mt-2">You must create an account to use the Service. You agree to provide accurate, current, and complete information and to update it as needed. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Subscription Plans and Payment</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>The Service offers subscription plans with recurring monthly or annual billing, processed through Stripe.</li>
              <li>All fees are in the currency displayed at checkout and are non-refundable except as required by law or explicitly stated in these Terms.</li>
              <li>Subscriptions renew automatically until canceled. You may cancel at any time from your account settings.</li>
              <li>We reserve the right to modify pricing with 30 days' notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Acceptable Use</h2>
            <p className="mt-2">You agree not to use the Service to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Violate any applicable law or regulation.</li>
              <li>Violate the Community Standards, Platform Terms, or policies of any integrated platform (including Meta Community Standards, Instagram Community Guidelines, Google Ads Policies).</li>
              <li>Publish, distribute, or promote content that is unlawful, fraudulent, defamatory, hateful, discriminatory, harassing, violent, sexually explicit, or infringes intellectual property rights.</li>
              <li>Engage in spam, deceptive marketing, fake engagement, or manipulation of platform metrics.</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or related systems.</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from the Service.</li>
              <li>Use the Service to build a competing product.</li>
              <li>Use automated scripts or bots to interact with the Service in ways not authorized by us.</li>
            </ul>
            <p className="mt-2">Violation of this section may result in immediate termination of your account without refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Content You Provide</h2>
            <p className="mt-2">You retain ownership of content you upload to the Service (text, images, business information). By uploading content, you grant maroa.ai a worldwide, non-exclusive, royalty-free license to use, process, modify, and display that content solely to provide the Service to you.</p>
            <p className="mt-2">You are responsible for ensuring you have all necessary rights to content you upload and publish, including rights in images, videos, and trademarks.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. AI-Generated Content</h2>
            <p className="mt-2">The Service uses artificial intelligence to generate marketing content (text, images, suggestions). You acknowledge that:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>AI-generated content may contain errors, inaccuracies, or unexpected outputs.</li>
              <li>You are responsible for reviewing and approving all AI-generated content before publishing.</li>
              <li>You are responsible for the final published content and for ensuring it complies with applicable laws and platform policies.</li>
              <li>maroa.ai provides AI outputs "as is" without warranty of accuracy, originality, or fitness for any particular purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Third-Party Platforms</h2>
            <p className="mt-2">The Service integrates with third-party platforms (Meta, Google, and others). Your use of these platforms through the Service is subject to their own terms and policies. maroa.ai is not responsible for the acts, omissions, policies, or availability of third-party platforms. You authorize maroa.ai to act on your behalf within the scope of permissions you grant.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Intellectual Property</h2>
            <p className="mt-2">The Service, including its software, design, branding, and documentation, is the property of maroa.ai and its licensors and is protected by intellectual property laws. These Terms do not grant you any rights to our trademarks, logos, or proprietary materials.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Termination</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>You may terminate your account at any time by contacting info@maroa.ai or through your account settings.</li>
              <li>We may suspend or terminate your account at any time for violation of these Terms, non-payment, fraud, abuse, or as required by law.</li>
              <li>Upon termination, your access to the Service ends immediately. We will delete your data in accordance with our Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Disclaimer of Warranties</h2>
            <p className="mt-2 uppercase text-xs tracking-wide">
              The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or achieve any specific marketing results.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Limitation of Liability</h2>
            <p className="mt-2 uppercase text-xs tracking-wide">
              To the maximum extent permitted by law, maroa.ai and its affiliates, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill, arising out of or in connection with your use of the Service.
            </p>
            <p className="mt-2 uppercase text-xs tracking-wide">
              Our total liability for any claim arising out of or relating to these Terms or the Service is limited to the amount you paid us in the 12 months preceding the claim, or 100 Euro, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Indemnification</h2>
            <p className="mt-2">You agree to indemnify and hold maroa.ai harmless from any claim, demand, loss, or damages, including reasonable attorneys' fees, arising out of your use of the Service, your content, or your violation of these Terms or any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">15. Changes to Terms</h2>
            <p className="mt-2">We may update these Terms from time to time. Material changes will be communicated via email or by posting a notice on the Service. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">16. Governing Law and Disputes</h2>
            <p className="mt-2">These Terms are governed by the laws of the Republic of Kosovo, without regard to conflict-of-laws principles. Any dispute arising out of or relating to these Terms or the Service will be resolved in the courts of Gjilan, Kosovo, unless required otherwise by applicable consumer protection law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">17. Contact</h2>
            <p className="mt-2">
              For questions about these Terms, contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a><br />
              <strong>Company:</strong> maroa.ai<br />
              <strong>Location:</strong> Gjilan, Kosovo
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} maroa.ai &mdash; <Link to="/terms" className="hover:underline">Terms</Link> &middot; <Link to="/privacy" className="hover:underline">Privacy</Link> &middot; <Link to="/data-deletion" className="hover:underline">Data Deletion</Link>
      </footer>
    </div>
  );
}
