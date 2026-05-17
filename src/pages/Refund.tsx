import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/**
 * /refund — Cancellation & Refund Policy
 *
 * Replaces the previous 14-day money-back guarantee page. Per the May
 * 2026 pricing repositioning, Maroa is a premium B2B SaaS with no free
 * trial, no money-back guarantee, and no refund window. The entire
 * risk-reversal mechanism is cancel-anytime monthly billing — the
 * current month is non-refundable, but no future charge is taken.
 *
 * URL stays /refund so existing inbound links (Paddle receipts, support
 * emails, sitemap, search results) don't 404. The footer link reads
 * "Cancellation Policy" so the label matches the new content.
 */
export default function Refund() {
  useDocumentTitle("Cancellation & Refund Policy");
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
        <h1 className="text-3xl font-bold text-foreground">Cancellation &amp; Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 17, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Cancel anytime. No contracts. No lock-in.
            </h2>
            <p>
              Maroa AI (&ldquo;maroa.ai&rdquo;) is a month-to-month subscription. You can
              cancel at any time, from your own dashboard, in two clicks &mdash; no phone
              call, no email back-and-forth, no exit interview. When you cancel, no
              further charges will be made after the end of your current billing cycle.
            </p>
            <p className="mt-2">
              The current billing cycle is the entire risk-reversal: pay for the month
              you&apos;re in, decide if it&apos;s worth it, cancel any day. We never
              auto-rebill after a cancellation, and we never extend the cycle without
              your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">No refunds</h2>
            <p>
              Maroa does not offer refunds on the current billing cycle, free trials,
              or money-back guarantees on any plan (Growth or Agency). Payment for
              the current month is non-refundable.
            </p>
            <p className="mt-2">
              This is a deliberate choice that mirrors how premium B2B SaaS tools
              price themselves: cancel any time you want, but the month you paid for
              is yours to use to the end. It keeps our cost structure clean and our
              subscription predictable for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">How to cancel</h2>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Open the dashboard and go to <strong className="text-foreground">Settings &rarr; Plan &amp; Billing</strong>.</li>
              <li>Click <strong className="text-foreground">&ldquo;Cancel my plan&rdquo;</strong>.</li>
              <li>Confirm. That&apos;s it &mdash; no further charges.</li>
            </ol>
            <p className="mt-2">
              Your access continues through the end of the billing period you already
              paid for. Your data is preserved for 30 days after the period ends, in
              case you want to reactivate, then permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Annual billing</h2>
            <p>
              Annual plans are paid up front for 12 months at the discounted rate.
              Annual subscriptions are also non-refundable &mdash; once paid, the
              subscription runs the full year. You can cancel auto-renewal at any
              time; cancellation takes effect at the end of the paid-up year.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Your content is yours</h2>
            <p>
              Everything Maroa generates &mdash; posts, captions, ads, emails,
              reasoning traces, image and video assets &mdash; is yours forever, even
              after you cancel. Export the full archive as a <code className="text-foreground">.zip</code>{" "}
              from Settings any day, before or after cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Exceptions</h2>
            <p>We may issue a refund, at our sole discretion, in two narrow cases:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong className="text-foreground">Unauthorised charge.</strong> If
                someone subscribed using your card without consent, email{" "}
                <strong className="text-foreground">support@maroa.ai</strong> within 14
                days. We will investigate and refund a confirmed unauthorised charge.
              </li>
              <li>
                <strong className="text-foreground">Sustained service outage.</strong>{" "}
                If our service is unavailable for more than 72 consecutive hours on
                paid infrastructure (excluding scheduled maintenance), we will pro-rate
                a credit toward your next billing period.
              </li>
            </ul>
            <p className="mt-2">
              All other refund requests will be respectfully declined. Filing a
              chargeback without first contacting support will result in account
              termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Payment processor</h2>
            <p>
              Payments are processed by Paddle (our merchant of record). Where Paddle
              is the merchant, refunds &mdash; in the rare cases they are issued
              &mdash; are routed through Paddle&apos;s system and may take 5&ndash;10
              business days to appear on your statement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Questions</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: <strong className="text-foreground">support@maroa.ai</strong></li>
              <li>Response time: within 24 hours on business days</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground/60 pt-4 border-t border-border">
            &copy; {new Date().getFullYear()} Maroa AI. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
