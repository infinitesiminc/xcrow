import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/blog-posts";
import { ArrowRight } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, delay },
});

export default function BlogIndex() {
  return (
    <>
      <SEOHead
        title="Blog"
        description="Outbound sales tips, ICP targeting guides, cold email strategies, and lead generation insights from the Xcrow team."
        path="/blog"
      />
      <Navbar />

      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
            <motion.p {...fade()} className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">Blog</motion.p>
            <motion.h1 {...fade(0.1)} className="text-[2.5rem] sm:text-[3.5rem] font-extrabold text-foreground leading-[1.05] tracking-[-0.02em] uppercase mb-6">
              Outbound <span className="text-primary">Playbook</span>
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Strategies, tactics, and tools for modern B2B lead generation.
            </motion.p>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
            {BLOG_POSTS.map((post, i) => (
              <motion.div key={post.slug} {...fade(i * 0.05)}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="block bg-card border border-border rounded-2xl p-6 sm:p-8 hover:border-primary/30 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                    <span className="text-xs text-muted-foreground">· {post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.description}</p>
                  <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read article <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
