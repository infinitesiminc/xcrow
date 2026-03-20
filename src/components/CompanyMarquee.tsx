import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';
import { brandfetchFromName } from '@/lib/logo';

type CompanyMarqueeProps = {
  rows: string[][];
  onCompanyClick?: (name: string) => void;
};

function CompanyChip({ name, onClick, active }: {
  name: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const logoUrl = useMemo(() => brandfetchFromName(name), [name]);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full border shrink-0 transition-colors cursor-pointer ${
        active
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-background/80 hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-muted">
        {showLogo ? (
          <img src={logoUrl!} alt={name} className="w-5 h-5 object-contain grayscale opacity-70" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{name}</span>
    </button>
  );
}

export default function CompanyMarquee({ rows, onCompanyClick }: CompanyMarqueeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeCompany, setActiveCompany] = useState<string | null>(null);

  const handleClick = useCallback((name: string) => {
    setActiveCompany(prev => prev === name ? null : name);
    onCompanyClick?.(name);
  }, [onCompanyClick]);

  if (prefersReducedMotion) {
    return (
      <div className="relative flex flex-wrap gap-2 justify-center">
        {rows.flat().map((name, i) => (
          <CompanyChip key={`${name}-${i}`} name={name} onClick={() => handleClick(name)} active={activeCompany === name} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      {rows.map((row, rowIndex) => {
        const duplicated = [...row, ...row];
        return (
          <div key={rowIndex} className="flex mb-3 last:mb-0">
            <motion.div
              className="flex gap-3"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: { repeat: Infinity, repeatType: 'loop', duration: 25 + rowIndex * 5, ease: 'linear' },
              }}
            >
              {duplicated.map((name, index) => (
                <CompanyChip
                  key={`${name}-${index}`}
                  name={name}
                  onClick={() => handleClick(name)}
                  active={activeCompany === name}
                />
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
