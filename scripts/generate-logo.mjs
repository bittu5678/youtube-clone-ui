import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Outer 3D Button Sphere Gradient -->
    <radialGradient id="sphereGrad" cx="35%" cy="30%" r="68%">
      <stop offset="0%" stop-color="#ff3b2e" />
      <stop offset="35%" stop-color="#f40600" />
      <stop offset="70%" stop-color="#db0000" />
      <stop offset="90%" stop-color="#b00000" />
      <stop offset="100%" stop-color="#800000" />
    </radialGradient>

    <!-- Top glossy highlight / specular reflection -->
    <radialGradient id="specularGlow" cx="40%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.48" />
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="80%" stop-color="#ffffff" stop-opacity="0.0" />
    </radialGradient>

    <!-- Outer rim highlight -->
    <linearGradient id="rimStroke" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ff7b70" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#ff2617" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#4a0000" stop-opacity="0.8" />
    </linearGradient>

    <!-- Drop shadow for the white filmstrip -->
    <filter id="filmDropShadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#4a0000" flood-opacity="0.4" />
    </filter>

    <!-- Red fill for perforations and play button matching button hue -->
    <linearGradient id="innerRed" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eb0900" />
      <stop offset="100%" stop-color="#cf0000" />
    </linearGradient>
  </defs>

  <!-- Base red 3D circular sphere -->
  <circle cx="256" cy="256" r="246" fill="url(#sphereGrad)" />

  <!-- 3D rim stroke -->
  <circle cx="256" cy="256" r="245" fill="none" stroke="url(#rimStroke)" stroke-width="3" />

  <!-- Glossy top specular reflection -->
  <ellipse cx="256" cy="150" rx="200" ry="110" fill="url(#specularGlow)" />

  <!-- White Film Strip Body with subtle shadow -->
  <g filter="url(#filmDropShadow)">
    <rect x="116" y="154" width="280" height="196" rx="38" ry="38" fill="#FFFFFF" />

    <!-- Top Film Perforations (4 holes) -->
    <rect x="143" y="166" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="205" y="166" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="267" y="166" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="329" y="166" width="35" height="23" rx="4" fill="url(#innerRed)" />

    <!-- Bottom Film Perforations (4 holes) -->
    <rect x="143" y="315" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="205" y="315" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="267" y="315" width="35" height="23" rx="4" fill="url(#innerRed)" />
    <rect x="329" y="315" width="35" height="23" rx="4" fill="url(#innerRed)" />

    <!-- Center Play Triangle -->
    <path d="M 223 207 C 223 201 229.5 197.2 234.8 200.4 L 295.6 245.4 C 300.6 248.4 300.6 255.6 295.6 258.6 L 234.8 303.6 C 229.5 306.8 223 303 223 297 Z" fill="url(#innerRed)" />
  </g>
</svg>`;

// Write SVG to public and src
fs.writeFileSync(path.join(process.cwd(), "public/logo.svg"), logoSvg, "utf8");
fs.writeFileSync(path.join(process.cwd(), "public/favicon.svg"), logoSvg, "utf8");

// Render PNG
const resvg = new Resvg(logoSvg, {
  fitTo: { mode: "width", value: 512 },
});
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

fs.writeFileSync(path.join(process.cwd(), "public/logo.png"), pngBuffer);
fs.writeFileSync(path.join(process.cwd(), "public/favicon.png"), pngBuffer);

console.log("Successfully generated all logo formats!");
