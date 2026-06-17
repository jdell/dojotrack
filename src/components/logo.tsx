import { cn } from "@/lib/utils";

interface LogoProps {
  /** Size of the square mark in pixels. */
  size?: number;
  /** Show the "EntrenaDojo" wordmark next to the mark. */
  showWordmark?: boolean;
  /** Render the wordmark in white, for use on dark/coloured backgrounds. */
  inverted?: boolean;
  className?: string;
}

/** EntrenaDojo logo — a teal belt-knot mark with an optional wordmark. */
export function Logo({
  size = 32,
  showWordmark = true,
  inverted = false,
  className,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="#0d9488" />
        {/* Belt band */}
        <rect x="3.5" y="18" width="25" height="5" rx="2.5" fill="#ffffff" />
        {/* Belt tails */}
        <rect x="11" y="22" width="3.5" height="6.5" rx="1.5" fill="#ffffff" />
        <rect
          x="17.5"
          y="22"
          width="3.5"
          height="6.5"
          rx="1.5"
          fill="#ffffff"
        />
        {/* Knot */}
        <rect x="13" y="16" width="6" height="9" rx="2" fill="#1e3a5f" />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            inverted ? "text-white" : "text-brand-navy",
          )}
        >
          Entrena
          <span className={inverted ? "text-brand-gold" : "text-brand-teal"}>
            Dojo
          </span>
        </span>
      )}
    </span>
  );
}
