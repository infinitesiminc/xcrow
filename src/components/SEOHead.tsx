import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
}

const defaults = {
  title: "Xcrow.ai — 183 Skills. 1 Game. AI-Era Careers.",
  description: "The career game for the AI age. Assess 183 new skills, conquer territory-based quests, and build a skill profile employers value.",
  ogImage: "https://xcrow.ai/og-image.png",
};

export default function SEOHead({
  title,
  description,
  path = "/",
  ogImage,
}: SEOHeadProps) {
  const t = title ? `${title} | Xcrow.ai` : defaults.title;
  const d = description || defaults.description;
  const url = `https://xcrow.ai${path}`;
  const img = ogImage || defaults.ogImage;

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
