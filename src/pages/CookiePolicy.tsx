import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookiePolicy() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20 prose prose-invert prose-sm">
        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: March 19, 2026</p>

        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help us provide a better experience by remembering your preferences, keeping you signed in, and understanding how you use our platform.
        </p>

        <h2>2. Cookies We Use</h2>

        <h3>Essential Cookies</h3>
        <p>
          Required for the Platform to function. These handle authentication, security, and basic functionality. They cannot be disabled.
        </p>
        <ul>
          <li><strong>Session cookies:</strong> Keep you logged in during your visit.</li>
          <li><strong>Security cookies:</strong> Protect against cross-site request forgery and other threats.</li>
        </ul>

        <h3>Analytics Cookies</h3>
        <p>
          Help us understand how visitors interact with the Platform so we can improve it. These collect anonymous usage data.
        </p>
        <ul>
          <li><strong>Page views and navigation paths</strong></li>
          <li><strong>Feature usage frequency</strong></li>
          <li><strong>Error and performance metrics</strong></li>
        </ul>

        <h3>Functional Cookies</h3>
        <p>
          Remember your preferences such as theme settings, language, and recently viewed roles.
        </p>

        <h2>3. Third-Party Cookies</h2>
        <p>
          We may use third-party services that set their own cookies, including:
        </p>
        <ul>
          <li><strong>Analytics providers</strong> (e.g., to measure platform usage).</li>
          <li><strong>Payment processors</strong> (e.g., for subscription management).</li>
          <li><strong>Authentication services</strong> (e.g., for social login).</li>
        </ul>

        <h2>4. Managing Cookies</h2>
        <p>
          You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies may prevent the Platform from functioning properly.
        </p>
        <p>Common browser cookie settings:</p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>

        <h2>5. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
        </p>

        <h2>6. Contact</h2>
        <p>
          If you have questions about our use of cookies, contact us at{" "}
          <a href="mailto:privacy@crowy.ai" className="text-primary hover:underline">privacy@crowy.ai</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}
