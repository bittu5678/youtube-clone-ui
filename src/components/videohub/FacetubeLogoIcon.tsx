export function FacetubeLogoIcon({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ft_sphere" cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#ff3b2e" />
          <stop offset="35%" stopColor="#f40600" />
          <stop offset="70%" stopColor="#db0000" />
          <stop offset="90%" stopColor="#b00000" />
          <stop offset="100%" stopColor="#800000" />
        </radialGradient>

        <radialGradient id="ft_specular" cx="40%" cy="20%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ft_rim" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ff7b70" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#ff2617" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4a0000" stopOpacity="0.8" />
        </linearGradient>

        <filter id="ft_drop" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#4a0000" floodOpacity="0.4" />
        </filter>

        <linearGradient id="ft_innerRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eb0900" />
          <stop offset="100%" stopColor="#cf0000" />
        </linearGradient>
      </defs>

      {/* Base red 3D sphere */}
      <circle cx="256" cy="256" r="246" fill="url(#ft_sphere)" />
      <circle cx="256" cy="256" r="245" fill="none" stroke="url(#ft_rim)" strokeWidth="3" />
      <ellipse cx="256" cy="150" rx="200" ry="110" fill="url(#ft_specular)" />

      {/* White Film Strip Body */}
      <g filter="url(#ft_drop)">
        <rect x="116" y="154" width="280" height="196" rx="38" ry="38" fill="#FFFFFF" />

        {/* Top Film Perforations (4 holes) */}
        <rect x="143" y="166" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="205" y="166" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="267" y="166" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="329" y="166" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />

        {/* Bottom Film Perforations (4 holes) */}
        <rect x="143" y="315" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="205" y="315" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="267" y="315" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />
        <rect x="329" y="315" width="35" height="23" rx="4" fill="url(#ft_innerRed)" />

        {/* Center Play Triangle */}
        <path
          d="M 223 207 C 223 201 229.5 197.2 234.8 200.4 L 295.6 245.4 C 300.6 248.4 300.6 255.6 295.6 258.6 L 234.8 303.6 C 229.5 306.8 223 303 223 297 Z"
          fill="url(#ft_innerRed)"
        />
      </g>
    </svg>
  );
}
