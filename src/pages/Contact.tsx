import { Mail, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Contact = () => (
  <>
    <SEOHead
      title="Contact Us | Xcrow"
      description="Get in touch with the Xcrow team. Book a demo or reach out via email."
      path="/contact"
    />
    <Navbar />
    <main className="min-h-[70vh] bg-background">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Get in Touch</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have questions about Xcrow? Want a walkthrough? We'd love to hear from you.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Book a call */}
          <a
            href="https://calendly.com/jacksonlam"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
          >
            <Calendar className="h-8 w-8 text-primary mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Book a Demo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule a 15-minute walkthrough with our team.
            </p>
            <span className="text-sm font-medium text-primary group-hover:underline">
              Open Calendly →
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:jackson@xcrow.ai"
            className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
          >
            <Mail className="h-8 w-8 text-primary mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Email Us</h2>
            <p className="text-sm text-muted-foreground mb-4">
              For support, partnerships, or general inquiries.
            </p>
            <span className="text-sm font-medium text-primary group-hover:underline">
              jackson@xcrow.ai
            </span>
          </a>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default Contact;
