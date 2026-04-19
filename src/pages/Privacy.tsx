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
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 19, 2026</p>

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

            <h3 className="mt-3 font-medium text-foreground">2.3 Information from Meta Platforms (Facebook and Instagram)</h3>
            <p className="mt-2">When you connect your Meta accounts (Facebook Pages and Instagram Business or Creator accounts) to maroa.ai through Facebook Login, we request the following permissions and receive the following data:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>pages_show_list, pages_read_engagement, pages_manage_posts:</strong> Access to your Facebook Pages, engagement metrics, and permission to publish posts you create or approve within maroa.ai.</li>
              <li><strong>instagram_basic:</strong> Basic profile information about your connected Instagram Business account (username, profile picture, account ID).</li>
              <li><strong>instagram_content_publish:</strong> Permission to publish images, videos, and captions you create or approve to your Instagram Business account.</li>
              <li><strong>instagram_manage_insights:</strong> Engagement metrics (reach, impressions, likes, comments, saves) on posts published through maroa.ai, used to show you performance analytics.</li>
              <li><strong>business_management</strong> (where applicable): Access to manage business assets you authorize.</li>
            </ul>
            <p className="mt-2">We only use this data to deliver maroa.ai's services to you. We do <strong>not</strong> use Meta platform data to build advertising profiles, retarget users, sell to third parties, or train machine learning models.</p>

            <h3 className="mt-3 font-medium text-foreground">2.4 Information from Other Third Parties</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>OAuth Providers:</strong> If you sign in with Google or Apple, we receive your name and email address from the identity provider.</li>
              <li><strong>Other Advertising Platforms:</strong> When you connect Google Ads or similar platforms, we receive access tokens and platform-specific metrics as authorized by you.</li>
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
            <p className="mt-2">We do <strong>not</strong> sell your personal information. We may share information with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our Service, including Supabase (database hosting), Railway (backend hosting), Vercel (frontend hosting), Resend (email delivery), and Stripe (payment processing).</li>
              <li><strong>Social Media Platforms:</strong> When you authorize us to post content or manage ads on your behalf via their APIs (Meta, Google, and others you connect).</li>
              <li><strong>AI Providers:</strong> We use Anthropic (Claude) for content generation and marketing strategy, and Replicate (Flux 1.1 Pro) for image generation. Data shared with these providers is used solely for service delivery. Under our agreements with these providers, your content and platform data are not used to train their models. We do not share data from Meta APIs with AI providers beyond what is necessary to generate the content you request and approve.</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as a business asset.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Meta Platform Data Handling</h2>
            <p className="mt-2">maroa.ai complies with Meta's Platform Terms and Developer Policies. Specifically:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Access tokens received from Meta are stored encrypted at rest and used solely for the purposes you authorized.</li>
              <li>You can revoke maroa.ai's access at any time through your Facebook settings at <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">facebook.com/settings?tab=business_tools</a> or by disconnecting your account within maroa.ai.</li>
              <li>When you disconnect a Meta account or delete your maroa.ai account, we delete all data obtained from Meta's APIs within 30 days, except where retention is legally required.</li>
              <li>Users may request deletion of specific Meta-sourced data at any time by emailing info@maroa.ai or visiting our <Link to="/data-deletion" className="text-primary hover:underline">Data Deletion page</Link>.</li>
              <li>We do not use Meta platform data for advertising targeting, profile building outside the Service, reselling insights, or any purpose other than delivering the Service you signed up for.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p className="mt-2">
              We retain your personal information for as long as your account is active or as needed to provide the Service. If you request account deletion, we will delete or anonymize your data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, resolving disputes). Data obtained from Meta APIs is deleted within 30 days of account disconnection or deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Data Security</h2>
            <p className="mt-2">
              We implement industry-standard security measures including encryption in transit (TLS/SSL), encryption at rest, access controls, and regular security audits. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Your Rights</h2>
            <p className="mt-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data. See our <Link to="/data-deletion" className="text-primary hover:underline">Data Deletion page</Link>.</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing of your data for certain purposes.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Legal Basis for Processing (GDPR)</h2>
            <p className="mt-2">For users in the European Economic Area, United Kingdom, or other jurisdictions applying similar frameworks, we process your personal data under the following legal bases:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Contract:</strong> To provide the Service you signed up for (account management, content generation, publishing on your behalf).</li>
              <li><strong>Consent:</strong> For optional features such as analytics cookies and marketing communications. You can withdraw consent at any time.</li>
              <li><strong>Legitimate Interest:</strong> To secure our Service, prevent fraud, and improve product features.</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and respond to lawful requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management, and optional analytics cookies to understand how the Service is used. You can control cookie preferences through your browser settings. Disabling essential cookies may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. International Data Transfers</h2>
            <p className="mt-2">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including standard contractual clauses where required by applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Children's Privacy</h2>
            <p className="mt-2">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected data from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Contact Us</h2>
            <p className="mt-2">
              For general privacy questions or to exercise your rights, contact us at:
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
