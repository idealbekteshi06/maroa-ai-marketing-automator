import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiPost } from "@/lib/apiClient";

export default function DataDeletion() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [metaAccount, setMetaAccount] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Honeypot
  const [hp, setHp] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = name.trim() && emailValid && confirmed && !submitting && !hp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/webhook/data-deletion-request", {
        name: name.trim(),
        email: email.trim(),
        meta_account: metaAccount.trim() || undefined,
        reason: reason.trim() || undefined,
        requested_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch {
      // Fallback: open mailto
      const subject = encodeURIComponent(`Data Deletion Request from ${name.trim()}`);
      const body = encodeURIComponent(`Name: ${name.trim()}\nEmail: ${email.trim()}\nMeta Account: ${metaAccount.trim() || "N/A"}\nReason: ${reason.trim() || "N/A"}\n\nPlease delete all my data from maroa.ai.`);
      window.open(`mailto:info@maroa.ai?subject=${subject}&body=${body}`, "_self");
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-foreground">Data Deletion Request</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          At maroa.ai, we respect your right to control your personal data. You can request deletion of your account and all associated data at any time using the form below.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">What Gets Deleted</h2>
            <p className="mt-2">When you submit a deletion request, we will permanently delete within 30 days:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your account information (name, email, business profile, preferences).</li>
              <li>All content you created or uploaded in maroa.ai (posts, images, campaigns, notes).</li>
              <li>All data obtained from connected Meta accounts (Facebook Pages and Instagram Business accounts), including access tokens, page information, post history, and engagement metrics.</li>
              <li>Data obtained from other connected third-party platforms (Google Ads, etc.).</li>
              <li>Usage logs and analytics tied to your account.</li>
            </ul>
            <p className="mt-2">We may retain limited data where required by law (for example, payment records for tax purposes) or for fraud prevention. Any retained data is kept only as long as legally necessary.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How to Submit a Request</h2>

            <h3 className="mt-4 font-medium text-foreground">Option 1: Fill out the form below</h3>

            {submitted ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
                <h3 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">Request received</h3>
                <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                  Your request has been received. We will process your deletion request within 30 days and confirm via email when complete.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Honeypot — hidden from users */}
                <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Full name <span className="text-destructive">*</span></label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="Your full name" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Email address <span className="text-destructive">*</span></label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="The email associated with your maroa.ai account" />
                  {email && !emailValid && <p className="mt-1 text-xs text-destructive">Please enter a valid email address</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Connected Meta account / Facebook Page name <span className="text-muted-foreground">(optional)</span></label>
                  <input type="text" value={metaAccount} onChange={(e) => setMetaAccount(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="Helps us find the data faster" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Reason for deletion <span className="text-muted-foreground">(optional)</span></label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="Let us know why you're leaving (optional)" />
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="confirm-delete" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary" />
                  <label htmlFor="confirm-delete" className="text-[13px] text-foreground">
                    I confirm I want to permanently delete my data from maroa.ai <span className="text-destructive">*</span>
                  </label>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button type="submit" disabled={!canSubmit} className="rounded-xl bg-destructive px-6 py-3 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? "Submitting..." : "Submit Deletion Request"}
                </button>
              </form>
            )}

            <h3 className="mt-8 font-medium text-foreground">Option 2: Email us directly</h3>
            <p className="mt-2">
              Send an email to <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a> with the subject line "Data Deletion Request" and include:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your full name</li>
              <li>The email address associated with your maroa.ai account</li>
              <li>Any Facebook Pages or Instagram accounts you connected (optional, helps us locate the data faster)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How to Revoke Meta Access Without Deleting Your Account</h2>
            <p className="mt-2">If you want to disconnect your Meta account from maroa.ai without deleting your entire account, you can do so at any time:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li><strong>Within maroa.ai:</strong> Go to Settings &rarr; Integrations &rarr; Disconnect.</li>
              <li><strong>From Facebook:</strong> Visit <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">facebook.com/settings?tab=business_tools</a> and remove maroa.ai from the list of connected apps.</li>
            </ul>
            <p className="mt-2">When you disconnect a Meta account, we will delete all data obtained from that account within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Processing Time</h2>
            <p className="mt-2">We process deletion requests within 30 days. You will receive a confirmation email at the address you provide once deletion is complete.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Questions</h2>
            <p className="mt-2">If you have questions about the deletion process, contact us at <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} maroa.ai &mdash; <Link to="/terms" className="hover:underline">Terms</Link> &middot; <Link to="/privacy" className="hover:underline">Privacy</Link> &middot; <Link to="/data-deletion" className="hover:underline">Data Deletion</Link>
      </footer>
    </div>
  );
}
