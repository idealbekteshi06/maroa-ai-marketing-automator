import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Refund() {
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
        <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 10, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">14-Day Money-Back Guarantee</h2>
            <p>
              Maroa AI ("maroa.ai") offers a 14-day money-back guarantee on all paid plans. If you are not satisfied with our service for any reason within the first 14 days of your initial payment, you may request a full refund — no questions asked.
            </p>
            <p className="mt-2">
              This guarantee applies to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>First-time subscribers on any paid plan (Starter, Growth, or Agency)</li>
              <li>Both monthly and annual billing cycles</li>
              <li>The full amount of your first payment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">How to Request a Refund</h2>
            <p>To request a refund within the 14-day guarantee period:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Send an email to <strong className="text-foreground">support@maroa.ai</strong></li>
              <li>Use the subject line: "Refund Request"</li>
              <li>Include your account email address and the reason for your refund (optional but appreciated)</li>
            </ol>
            <p className="mt-2">
              We process all refund requests within 5 business days. Refunds are issued to the original payment method. Depending on your bank or payment provider, it may take an additional 5-10 business days for the refund to appear on your statement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Cancellations</h2>
            <p>
              You can cancel your subscription at any time from your dashboard under <strong className="text-foreground">Settings → Plan & Billing</strong>. When you cancel:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your access continues until the end of your current billing period</li>
              <li>No further charges will be made after cancellation</li>
              <li>Your data is retained for 30 days after the billing period ends, in case you want to reactivate</li>
              <li>After 30 days, your data may be permanently deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">After the 14-Day Period</h2>
            <p>
              After the 14-day guarantee period has passed:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Monthly plans:</strong> No refunds for partial months. Cancel to prevent future charges.</li>
              <li><strong className="text-foreground">Annual plans:</strong> We may offer a pro-rata refund for unused months at our discretion. Contact support@maroa.ai to discuss.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Pre-Launch Pricing</h2>
            <p>
              If you registered during our pre-launch period with discounted pricing, the 14-day money-back guarantee applies from the date of your first actual charge (not the registration date). Pre-launch registrations with no payment are not eligible for refunds as no charge was made.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Exceptions</h2>
            <p>Refunds will not be issued in cases of:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Violation of our Terms of Service</li>
              <li>Fraudulent or abusive use of the platform</li>
              <li>Chargebacks filed without first contacting our support team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Payment Processor</h2>
            <p>
              Payments are processed by Paddle (our merchant of record). Refunds are handled through Paddle's system. In some cases, Paddle may contact you directly regarding your refund status.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact Us</h2>
            <p>
              For any questions about refunds, cancellations, or billing:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: <strong className="text-foreground">support@maroa.ai</strong></li>
              <li>Response time: within 24 hours on business days</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">
            © 2026 Maroa AI. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
