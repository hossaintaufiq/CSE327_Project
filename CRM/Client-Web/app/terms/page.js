"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold mb-3">Terms & Conditions</h1>
          <p className="text-zinc-400">
            Last updated: November 2025
          </p>
        </header>

        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p className="text-zinc-300 leading-relaxed">
            Welcome to our AI-Powered CRM platform. By accessing or using our
            services, you agree to the terms outlined below. If you do not agree,
            please stop using the platform immediately.
          </p>
        </section>

        {/* User Accounts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. User Accounts & Responsibilities</h2>
          <p className="text-zinc-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your
            account credentials. You agree to provide accurate and complete
            information during registration and to update such information when
            necessary.
          </p>
          <ul className="list-disc pl-6 text-zinc-300 space-y-2">
            <li>You must be at least 18 years old to create an account.</li>
            <li>Only one account per individual is allowed.</li>
            <li>You are responsible for all actions performed under your account.</li>
          </ul>
        </section>

        {/* Permitted Use */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Permitted Usage</h2>
          <p className="text-zinc-300 leading-relaxed">
            You may use our CRM services only for legal business or personal purposes.
            You agree not to:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 space-y-2">
            <li>Violate any law, regulation, or third-party rights.</li>
            <li>Upload harmful or malicious content, including viruses or malware.</li>
            <li>Attempt to reverse engineer or exploit system vulnerabilities.</li>
          </ul>
        </section>

        {/* Data & Privacy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Data Collection & Privacy</h2>
          <p className="text-zinc-300 leading-relaxed">
            We collect and store necessary data to provide our services efficiently.
            This includes user details, CRM data, and interaction logs. We do not sell
            personal information to third parties. For full details, refer to our
            Privacy Policy.
          </p>
        </section>

        {/* Payments */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Payment Terms</h2>
          <p className="text-zinc-300 leading-relaxed">
            Some features may require a paid subscription. All fees are billed on a
            recurring basis and are non-refundable except as required by law.
          </p>
        </section>

        {/* AI Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. AI-Driven Features Disclaimer</h2>
          <p className="text-zinc-300 leading-relaxed">
            Our CRM offers AI-assisted suggestions and analytics. While we aim for
            high accuracy, we do not guarantee outcomes of AI-generated decisions.
            Users are solely responsible for business decisions based on insights
            provided by the platform.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Termination of Service</h2>
          <p className="text-zinc-300 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these
            terms or pose security risks. In such cases, access to your stored data
            may also be restricted.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
          <p className="text-zinc-300 leading-relaxed">
            We are not liable for any indirect, special, or consequential damages,
            including loss of profits, data, or business interruptions arising from
            the use or inability to use our service.
          </p>
        </section>

        {/* Modifications */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Updates to These Terms</h2>
          <p className="text-zinc-300 leading-relaxed">
            We may update these terms from time to time. Continued use of the
            platform after changes means you accept the revised terms.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-4 pb-10">
          <h2 className="text-2xl font-semibold">10. Contact Information</h2>
          <p className="text-zinc-300 leading-relaxed">
            If you have any questions regarding these Terms & Conditions, feel free to contact us:
          </p>
          <p className="text-zinc-300 leading-relaxed font-medium">
            📧 Email: support@ai-crm.com
          </p>
        </section>

      </div>
    </div>
  );
}
