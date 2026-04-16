export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 15, 2026</p>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
        <p>maroa.ai is an AI-powered marketing automation platform for small businesses. Operated by IBG Boost, Gjilan, Kosovo. Contact: idealbekteshi06@gmail.com</p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Business information (name, industry, location)</li>
          <li>Social media account tokens (Facebook, Instagram, LinkedIn, TikTok)</li>
          <li>Marketing content and campaign data</li>
          <li>Usage analytics and performance metrics</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Facebook and Instagram Data</h2>
        <p>We access your Facebook Pages and Instagram Business accounts through the Meta Graph API to publish posts and read insights. We do not sell your Meta data. You can revoke access via Facebook Settings → Apps and Websites.</p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Data Deletion</h2>
        <p>You may request deletion at any time via our <a href="/data-deletion" className="text-blue-600 underline">Data Deletion page</a> or by emailing idealbekteshi06@gmail.com</p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Contact</h2>
        <p>idealbekteshi06@gmail.com</p>
      </section>
    </div>
  );
}
