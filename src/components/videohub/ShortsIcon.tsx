interface ShortsIconProps {
  className?: string;
  active?: boolean;
}

export function ShortsIcon({ className = "h-5 w-5", active = false }: ShortsIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? "0" : "1.8"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Outer rounded phone / vertical reel shape */}
      <rect x="5" y="2.5" width="14" height="19" rx="3.5" ry="3.5" />
      {/* Center play triangle / S glyph */}
      <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" strokeWidth="0" />
      {/* Top and bottom subtle notch/accent */}
      <line
        x1="10"
        y1="4.5"
        x2="14"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
