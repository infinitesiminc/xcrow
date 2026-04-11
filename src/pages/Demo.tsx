import { useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Demo() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Book a Demo"
        description="See Xcrow in action. Book a free 15-minute demo with our founder and see how AI-powered lead hunting works for your business."
        path="/demo"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 flex flex-col justify-center"
            >
              <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-4">Demo</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight tracking-tight uppercase mb-5">
                See Xcrow <span className="text-primary">in Action</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Book a free 15-minute call with Jackson, our founder. He'll walk you through how Xcrow turns one URL into a scored lead pipeline — and answer any questions.
              </p>
              <div className="space-y-3 mb-8">
                {["Live URL → leads walkthrough", "Custom use-case analysis", "Pricing & plan guidance", "No pressure, no pitch deck"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Prefer to try it yourself?{" "}
                <button onClick={() => navigate("/leadgen")} className="text-primary font-semibold hover:underline">
                  Jump straight in →
                </button>
              </p>
            </motion.div>

            {/* Right — Calendly embed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-3"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/40">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-bold text-foreground text-sm">Book a Call with Jackson</p>
                    <p className="text-xs text-muted-foreground">15 min · free · no pressure</p>
                  </div>
                </div>
                <iframe
                  src="https://calendly.com/jacksonlam?hide_gdpr_banner=1&background_color=ffffff&text_color=1a1a2e&primary_color=7c3aed"
                  className="w-full border-0"
                  style={{ minHeight: 600 }}
                  title="Book a demo with Jackson"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
