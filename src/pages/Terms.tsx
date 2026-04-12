import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Terms() {
  return (
    <>
      <SEOHead title="Terms & Conditions" description="Xcrow terms of service for our AI-powered B2B lead generation platform." path="/terms" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: April 12, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Xcrow.ai ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Platform.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Xcrow.ai provides an AI-powered B2B lead generation platform that helps businesses discover qualified prospects, find decision-maker contact information, and generate personalized outreach. Features may vary by plan and are subject to change.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any unlawful purpose, including sending unsolicited bulk email in violation of CAN-SPAM, GDPR, or other applicable regulations.</li>
          <li>Attempt to reverse-engineer, scrape, or extract data from the Platform beyond your authorized use.</li>
          <li>Interfere with or disrupt the Platform's infrastructure.</li>
          <li>Share your account credentials with others.</li>
          <li>Misrepresent your identity or affiliation.</li>
          <li>Use lead data obtained through Xcrow to build competing databases or services.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          All content, features, and functionality on the Platform — including text, graphics, logos, AI models, and generated outputs — are owned by Xcrow.ai or its licensors and are protected by intellectual property laws.
        </p>

        <h2>6. Lead Data & Compliance</h2>
        <p>
          Xcrow provides publicly available business contact information to aid your outreach efforts. You are solely responsible for ensuring your use of this data complies with all applicable laws and regulations, including CAN-SPAM, GDPR, CCPA, and any other relevant data protection legislation.
        </p>

        <h2>7. Subscriptions & Payments</h2>
        <p>
          Paid plans are billed in advance on a recurring basis. You may cancel at any time, and your access will continue until the end of your current billing period. Refunds are provided at our discretion. Credit top-ups are non-refundable once purchased.
        </p>

        <h2>8. Disclaimer of Warranties</h2>
        <p>
          The Platform is provided "as is" without warranties of any kind. We do not guarantee that AI-generated leads, contact information, or outreach drafts are error-free, complete, or suitable for any particular purpose.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Xcrow.ai shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to lost revenue, data loss, or business interruption.
        </p>

        <h2>10. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Xcrow.ai operates, without regard to conflict of law principles.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these terms? Contact us at{" "}
          <a href="mailto:legal@xcrow.ai" className="text-primary hover:underline">legal@xcrow.ai</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
