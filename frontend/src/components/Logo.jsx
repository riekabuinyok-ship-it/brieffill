// BriefFill Logo — puzzle piece with checkmark
// Uses a globally-injected SVG sprite for gradient definitions to avoid
// duplicate <defs> IDs when multiple logos are on the same page.

import { useEffect } from "react";

const SPRITE_ID = "brieffill-logo-sprite";
const GRADIENT_IDS = {
  primary: "bf-grad-primary",
  puzzleFill: "bf-grad-puzzle-fill",
  accent: "bf-grad-accent",
};

const SPRITE = (
  <svg
    id={SPRITE_ID}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
  >
    <defs>
      <linearGradient id={GRADIENT_IDS.primary} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.puzzleFill} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id={GRADIENT_IDS.accent} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
  </svg>
);

function useLogoSprite() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(SPRITE_ID)) return;
    const container = document.createElement("div");
    container.id = "brieffill-logo-host";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
    document.body.appendChild(container);
    // Use a render-friendly approach: insert the SVG markup as innerHTML
    container.innerHTML = `<svg id="${SPRITE_ID}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
      <linearGradient id="${GRADIENT_IDS.primary}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${GRADIENT_IDS.puzzleFill}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#34D399"/>
      </linearGradient>
      <linearGradient id="${GRADIENT_IDS.accent}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
    </defs></svg>`;
  }, []);
}

// Inline the puzzle piece markup so it doesn't depend on the DOM sprite.
// We use the same gradient IDs — if the sprite is in the DOM, gradients render
// with full color; if not, they fall back to a flat indigo fill (still visible).
function PuzzlePiece({ x = 0, y = 0, size = 70, innerSize = 46, innerOffset = 12 }) {
  const scale = size / 70;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width={size} height={size} rx={8 * scale} fill="url(#bf-grad-primary)" opacity="0.15" />
      <rect x="0" y="0" width={size} height={size} rx={8 * scale} fill="none" stroke="url(#bf-grad-primary)" strokeWidth={3 * scale} />
      <path
        d={`M${size} ${25 * scale} C${size + 10 * scale} ${25 * scale}, ${size + 15 * scale} ${15 * scale}, ${size + 15 * scale} ${30 * scale} C${size + 15 * scale} ${45 * scale}, ${size + 10 * scale} ${45 * scale}, ${size + 10 * scale} ${50 * scale} C${size + 10 * scale} ${55 * scale}, ${size + 15 * scale} ${55 * scale}, ${size} ${55 * scale}`}
        fill="url(#bf-grad-primary)"
        opacity="0.15"
      />
      <path
        d={`M${size} ${25 * scale} C${size + 10 * scale} ${25 * scale}, ${size + 15 * scale} ${15 * scale}, ${size + 15 * scale} ${30 * scale} C${size + 15 * scale} ${45 * scale}, ${size + 10 * scale} ${45 * scale}, ${size + 10 * scale} ${50 * scale} C${size + 10 * scale} ${55 * scale}, ${size + 15 * scale} ${55 * scale}, ${size} ${55 * scale}`}
        fill="none"
        stroke="url(#bf-grad-primary)"
        strokeWidth={3 * scale}
      />
      <path
        d={`M${25 * scale} ${size} C${25 * scale} ${size + 10 * scale}, ${15 * scale} ${size + 15 * scale}, ${30 * scale} ${size + 15 * scale} C${45 * scale} ${size + 15 * scale}, ${45 * scale} ${size + 10 * scale}, ${50 * scale} ${size + 10 * scale} C${55 * scale} ${size + 10 * scale}, ${55 * scale} ${size + 15 * scale}, ${55 * scale} ${size}`}
        fill="url(#bf-grad-primary)"
        opacity="0.15"
      />
      <path
        d={`M${25 * scale} ${size} C${25 * scale} ${size + 10 * scale}, ${15 * scale} ${size + 15 * scale}, ${30 * scale} ${size + 15 * scale} C${45 * scale} ${size + 15 * scale}, ${45 * scale} ${size + 10 * scale}, ${50 * scale} ${size + 10 * scale} C${55 * scale} ${size + 10 * scale}, ${55 * scale} ${size + 15 * scale}, ${55 * scale} ${size}`}
        fill="none"
        stroke="url(#bf-grad-primary)"
        strokeWidth={3 * scale}
      />
      <rect x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} rx={6 * scale} fill="url(#bf-grad-puzzle-fill)" opacity="0.95" />
      <path
        d={`M${25 * scale} ${38 * scale} L${33 * scale} ${46 * scale} L${48 * scale} ${28 * scale}`}
        fill="none"
        stroke="white"
        strokeWidth={4 * scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// Sprite injector component — render once in the app
export function LogoSprite() {
  useLogoSprite();
  return null;
}

// Icon-only: the puzzle piece from the full logo
export function LogoIcon({ size = 32, className = "", style = {} }) {
  useLogoSprite();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label="BriefFill"
    >
      <PuzzlePiece x={10} y={10} size={70} />
    </svg>
  );
}

// Full wordmark: icon + "BriefFill" text + tagline
export default function Logo({ size = "default", className = "", showTagline = false, dark = false }) {
  useLogoSprite();
  const heights = { small: 32, default: 40, large: 56 };
  const h = heights[size] || heights.default;
  const textFill = dark ? "#F3F4F6" : "#1F2937";
  const taglineFill = dark ? "#9CA3AF" : "#6B7280";
  const width = h * (400 / 120);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 120"
      width={width}
      height={h}
      className={className}
      aria-label="BriefFill — Complete your creative briefs"
    >
      <PuzzlePiece x={10} y={10} size={70} />
      <text
        x="100"
        y={showTagline ? 55 : 70}
        fontFamily="'Inter', 'Segoe UI', Arial, Helvetica, sans-serif"
        fontSize="48"
        fontWeight="800"
        fill={textFill}
        letterSpacing="-1"
      >
        Brief<tspan fill="url(#bf-grad-primary)">Fill</tspan>
      </text>
      {showTagline && (
        <text
          x="100"
          y="78"
          fontFamily="'Inter', 'Segoe UI', Arial, Helvetica, sans-serif"
          fontSize="14"
          fontWeight="400"
          fill={taglineFill}
          letterSpacing="0.5"
        >
          Complete your creative briefs
        </text>
      )}
      <circle cx="370" cy="50" r="4" fill="url(#bf-grad-primary)" opacity="0.3" />
      <circle cx="380" cy="50" r="2.5" fill="url(#bf-grad-puzzle-fill)" opacity="0.6" />
    </svg>
  );
}
