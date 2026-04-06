import { useParams, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/blog-posts";
import { ArrowLeft } from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <SEOHead title={post.title} description={post.description} path={`/blog/${post.slug}`} />
      <Navbar />

      <div className="min-h-screen bg-background">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground">{post.date}</span>
              <span className="text-xs text-muted-foreground">· {post.readTime}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 border-b border-border pb-10">
              {post.description}
            </p>

            <div className="prose prose-sm max-w-none
              prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground
              prose-a:text-primary
              prose-li:text-muted-foreground
              prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground
              prose-th:text-foreground prose-td:text-muted-foreground
            ">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </motion.div>
        </article>

        <Footer />
      </div>
    </>
  );
}
