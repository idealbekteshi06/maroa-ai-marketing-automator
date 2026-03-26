import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Trash2, Mail, Clock, ShieldCheck } from "lucide-react";

export default function DeleteData() {
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
        <h1 className="text-3xl font-bold text-foreground">Data Deletion Request</h1>
        <p className="mt-2 text-sm text-muted-foreground">How to request deletion of your personal data from maroa.ai</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <p>
              At maroa.ai, we respect your right to control your personal data. If you would like to delete your account and all associated data, you can submit a data deletion request by following the instructions below.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">How to Request Data Deletion</h2>
            <div className="mt-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Step 1 — Send an email</h3>
                  <p className="mt-1">
                    Send an email to <a href="mailto:hello@maroa.ai" className="text-primary font-medium hover:underline">hello@maroa.ai</a> with the subject line <strong>"Data Deletion Request"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Step 2 — Verify your identity</h3>
                  <p className="mt-1">
                    Include the email address associated with your maroa.ai account in the body of the email. We may ask you to verify your identity before processing the request.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Step 3 — We process your request</h3>
                  <p className="mt-1">
                    We will process your request within <strong>30 days</strong> and send you a confirmation email once your data has been deleted.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Trash2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Step 4 — Data is permanently removed</h3>
                  <p className="mt-1">
                    All personal data, business profiles, generated content, uploaded photos, analytics data, and connected account tokens will be permanently deleted from our systems.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">What Data Will Be Deleted</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your account and authentication credentials</li>
              <li>Business profile information (name, industry, location, audience, goals)</li>
              <li>All AI-generated content (social media posts, ads, emails)</li>
              <li>Uploaded photos and media files</li>
              <li>Connected social media account tokens and permissions</li>
              <li>Ad campaign data and performance analytics</li>
              <li>Competitor analysis data</li>
              <li>Usage logs and activity history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">What We May Retain</h2>
            <p className="mt-2">
              In certain cases, we may retain limited information as required by law, including:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Transaction and billing records required for tax and accounting purposes</li>
              <li>Data necessary to resolve ongoing disputes or enforce our agreements</li>
              <li>Anonymized and aggregated data that cannot be used to identify you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Facebook & Instagram Data</h2>
            <p className="mt-2">
              If you connected your Facebook or Instagram account to maroa.ai, we will also delete all data received from Meta's APIs, including page insights, ad performance metrics, and access tokens. You can also revoke maroa.ai's access directly from your <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Business Integrations settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Questions?</h2>
            <p className="mt-2">
              If you have any questions about data deletion, please contact us at <a href="mailto:hello@maroa.ai" className="text-primary font-medium hover:underline">hello@maroa.ai</a>. For more information about how we handle your data, see our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
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