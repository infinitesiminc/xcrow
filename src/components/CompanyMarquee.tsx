import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { brandfetchFromName } from '@/lib/logo';

type CompanyMarqueeProps = { rows: string[][] };

function CompanyChip({ name }: { name: string }) {
  const logoUrl = useMemo(() => brandfetchFromName(name), [name]);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/80 shrink-0">
      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-muted">
        {showLogo ? (
          <img src={logoUrl!} alt={name} className="w-5 h-5 object-contain" onError={() => setLogoFailed(true)} />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{name}</span>
    </div>
  );
}

export default function CompanyMarquee({ rows }: CompanyMarqueeProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {rows.flat().map((name) => <CompanyChip key={name} name={name} />)}
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
                <CompanyChip key={`${name}-${index}`} name={name} />
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
