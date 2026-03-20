import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 19, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          When you use Crowy.ai, we may collect the following types of information:
        </p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, and profile details you provide during registration.</li>
          <li><strong>Usage Data:</strong> Pages visited, features used, simulation results, and interaction patterns.</li>
          <li><strong>Device Data:</strong> Browser type, operating system, IP address, and device identifiers.</li>
          <li><strong>Educational Data:</strong> Job titles, skills, career stage, and school affiliation you provide.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Personalize your experience, including AI simulations and skill recommendations.</li>
          <li>Communicate with you about updates, features, and promotional offers.</li>
          <li>Analyze usage patterns to improve our platform.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share information with:
        </p>
        <ul>
          <li><strong>Service Providers:</strong> Third parties that help us operate our platform (hosting, analytics, email).</li>
          <li><strong>Institutional Partners:</strong> If you access Crowy.ai through a school or employer, aggregated (non-identifiable) performance data may be shared with your institution's administrators.</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
        </ul>

        <h2>4. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us.
        </p>

        <h2>5. Security</h2>
        <p>
          We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits.
        </p>

        <h2>6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access, correct, or delete your personal data.</li>
          <li>Object to or restrict processing of your data.</li>
          <li>Export your data in a portable format.</li>
          <li>Withdraw consent at any time.</li>
        </ul>

        <h2>7. Children's Privacy</h2>
        <p>
          Crowy.ai is not intended for users under the age of 16. We do not knowingly collect personal information from children.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of material changes via email or through the platform.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@crowy.ai" className="text-primary hover:underline">privacy@crowy.ai</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
