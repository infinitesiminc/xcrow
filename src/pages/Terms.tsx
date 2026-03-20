import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 19, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Crowy.ai ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Platform.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Crowy.ai provides AI-powered career readiness tools including role analysis, skill mapping, AI simulations, and workforce analytics. Features may vary by plan and are subject to change.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any unlawful purpose.</li>
          <li>Attempt to reverse-engineer, scrape, or extract data from the Platform beyond your authorized use.</li>
          <li>Interfere with or disrupt the Platform's infrastructure.</li>
          <li>Share your account credentials with others.</li>
          <li>Misrepresent your identity or affiliation.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          All content, features, and functionality on the Platform — including text, graphics, logos, simulations, and AI-generated outputs — are owned by Crowy.ai or its licensors and are protected by intellectual property laws.
        </p>

        <h2>6. Subscriptions & Payments</h2>
        <p>
          Paid plans are billed in advance on a recurring basis. You may cancel at any time, and your access will continue until the end of your current billing period. Refunds are provided at our discretion.
        </p>

        <h2>7. Institutional Accounts</h2>
        <p>
          Schools and employers that purchase seats on behalf of users agree to these terms on behalf of their end users. Institutional administrators are responsible for managing user access within their organization.
        </p>

        <h2>8. Disclaimer of Warranties</h2>
        <p>
          The Platform is provided "as is" without warranties of any kind. We do not guarantee that AI-generated insights, scores, or recommendations are error-free or suitable for any particular career decision.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, crowy.ai shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
        </p>

        <h2>10. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which crowy.ai operates, without regard to conflict of law principles.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these terms? Contact us at{" "}
          <a href="mailto:legal@crowy.ai" className="text-primary hover:underline">legal@crowy.ai</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
