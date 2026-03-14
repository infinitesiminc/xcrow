import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ALL_COMPANIES = [
  "Anthropic", "OpenAI", "Anduril", "Databricks", "Ramp",
  "Cohere", "AbbVie", "Gong", "Helion Energy", "Ajax",
];

const VISIBLE_COUNT = 6;
const ROTATE_INTERVAL = 3000;

interface Props {
  visible: boolean;
  onSelect: (company: string) => void;
}

export function CompanyPills({ visible, onSelect }: Props) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % ALL_COMPANIES.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const visibleCompanies = Array.from({ length: VISIBLE_COUNT }, (_, i) =>
    ALL_COMPANIES[(offset + i) % ALL_COMPANIES.length]
  );

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 justify-center min-h-[28px]">
      <AnimatePresence mode="popLayout">
        {visibleCompanies.map((company) => (
          <motion.button
            key={company}
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(company)}
            className="px-2.5 py-1 text-xs font-medium rounded-full border border-border bg-secondary/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {company}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
