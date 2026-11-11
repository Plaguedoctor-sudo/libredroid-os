// SPDX-License-Identifier: GPL-3.0-or-later
// Sovereign, offline, zero-network SVG assets for LibreDroid OS
// Completely avoids remote CDN calls (Unsplash, Google Fonts, etc.)

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const SOVEREIGN_WALLPAPERS = [
  {
    id: 'material-waves',
    name: 'Cosmic Emerald Waves',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#021b14"/>
            <stop offset="40%" stop-color="#064e3b"/>
            <stop offset="80%" stop-color="#022c22"/>
            <stop offset="100%" stop-color="#01140e"/>
          </linearGradient>
          <linearGradient id="wave1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#065f46" stop-opacity="0.1"/>
          </linearGradient>
          <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#047857" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#bg)"/>
        <path d="M0,600 C400,450 800,850 1200,650 C1600,450 1800,750 1920,600 L1920,1080 L0,1080 Z" fill="url(#wave1)"/>
        <path d="M0,750 C500,900 900,550 1400,800 C1700,950 1850,850 1920,800 L1920,1080 L0,1080 Z" fill="url(#wave2)"/>
      </svg>
    `),
    themeColor: '#10b981',
  },
  {
    id: 'aurora-borealis',
    name: 'Nordic Aurora',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <linearGradient id="ab-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#030712"/>
            <stop offset="60%" stop-color="#0a192f"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <linearGradient id="ab-aurora" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#00bfa5" stop-opacity="0.6"/>
            <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#ab-bg)"/>
        <path d="M0,350 Q450,150 960,400 T1920,300 L1920,700 Q1450,900 960,650 T0,750 Z" fill="url(#ab-aurora)" filter="blur(30px)"/>
      </svg>
    `),
    themeColor: '#00bfa5',
  },
  {
    id: 'cyber-dusk',
    name: 'Dusk Mountain Peaks',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <linearGradient id="dusk-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="45%" stop-color="#4c1d95"/>
            <stop offset="75%" stop-color="#c2410c"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#dusk-sky)"/>
        <polygon points="0,1080 300,680 650,950 1100,580 1550,900 1920,620 1920,1080" fill="#090514"/>
        <polygon points="120,1080 480,780 820,990 1350,720 1750,960 1920,840 1920,1080" fill="#180e29" opacity="0.85"/>
      </svg>
    `),
    themeColor: '#ff6d00',
  },
  {
    id: 'deep-space',
    name: 'Deep Nebula',
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <radialGradient id="nebula1" cx="35%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#4338ca" stop-opacity="0.7"/>
            <stop offset="60%" stop-color="#312e81" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="nebula2" cx="70%" cy="65%" r="45%">
            <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.6"/>
            <stop offset="70%" stop-color="#1e1b4b" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="#020617"/>
        <circle cx="650" cy="450" r="600" fill="url(#nebula1)"/>
        <circle cx="1300" cy="700" r="550" fill="url(#nebula2)"/>
        <circle cx="400" cy="200" r="2" fill="#ffffff" opacity="0.8"/>
        <circle cx="850" cy="180" r="1.5" fill="#ffffff" opacity="0.9"/>
        <circle cx="1400" cy="320" r="2.5" fill="#67e8f9" opacity="0.7"/>
        <circle cx="1650" cy="750" r="2" fill="#ffffff" opacity="0.85"/>
        <circle cx="220" cy="820" r="1.5" fill="#f472b6" opacity="0.6"/>
      </svg>
    `),
    themeColor: '#3d5afe',
  },
];

export const SOVEREIGN_AVATAR = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669"/>
        <stop offset="100%" stop-color="#10b981"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="96" fill="url(#avatar-grad)"/>
    <circle cx="100" cy="78" r="34" fill="#ffffff" opacity="0.95"/>
    <path d="M42,168 C42,130 68,124 100,124 C132,124 158,130 158,168 Z" fill="#ffffff" opacity="0.95"/>
  </svg>
`);

export const SOVEREIGN_SAMPLE_PHOTOS = [
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#0f172a"/>
      <circle cx="400" cy="260" r="140" fill="#0284c7" opacity="0.4"/>
      <path d="M0,600 L250,380 L420,500 L620,320 L800,520 L800,600 Z" fill="#1e293b"/>
      <text x="40" y="550" fill="#38bdf8" font-family="sans-serif" font-size="22" font-weight="bold">Encrypted Vault Asset 01</text>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#064e3b"/>
      <polygon points="400,100 700,520 100,520" fill="#047857" opacity="0.6"/>
      <polygon points="280,220 540,540 80,540" fill="#10b981" opacity="0.4"/>
      <text x="40" y="550" fill="#a7f3d0" font-family="sans-serif" font-size="22" font-weight="bold">Zero-Knowledge Hardware Key</text>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#311042"/>
      <circle cx="550" cy="220" r="100" fill="#db2777" opacity="0.5"/>
      <path d="M0,600 L180,450 L360,520 L580,390 L800,540 L800,600 Z" fill="#1f112e"/>
      <text x="40" y="550" fill="#f472b6" font-family="sans-serif" font-size="22" font-weight="bold">Tor Sovereign Node</text>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#1e293b"/>
      <grid width="100%" height="100%"/>
      <circle cx="400" cy="300" r="160" fill="#6366f1" opacity="0.3"/>
      <circle cx="400" cy="300" r="100" fill="#818cf8" opacity="0.4"/>
      <circle cx="400" cy="300" r="40" fill="#a5b4fc" opacity="0.6"/>
      <text x="40" y="550" fill="#c7d2fe" font-family="sans-serif" font-size="22" font-weight="bold">Reproducible FreeStack Core</text>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#0f291e"/>
      <path d="M0,450 Q200,320 400,420 T800,380 L800,600 L0,600 Z" fill="#059669" opacity="0.4"/>
      <text x="40" y="550" fill="#6ee7b7" font-family="sans-serif" font-size="22" font-weight="bold">MNT Reform & X200 Verified</text>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#18181b"/>
      <circle cx="400" cy="300" r="180" stroke="#22c55e" stroke-width="4" fill="none" opacity="0.4"/>
      <circle cx="400" cy="300" r="120" stroke="#10b981" stroke-width="2" fill="none" opacity="0.6"/>
      <circle cx="400" cy="300" r="60" fill="#10b981" opacity="0.3"/>
      <text x="40" y="550" fill="#86efac" font-family="sans-serif" font-size="22" font-weight="bold">A1-A14 Certified Pipeline</text>
    </svg>
  `),
];

export const SOVEREIGN_MAP_TEXTURE = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
    <rect width="1200" height="800" fill="#18181b"/>
    <defs>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#27272a" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="800" fill="url(#grid)"/>
    <path d="M100,200 C300,100 500,300 800,200 C1000,150 1100,350 1200,250" fill="none" stroke="#3f3f46" stroke-width="3"/>
    <path d="M0,500 C200,450 450,650 750,550 C950,480 1100,600 1200,550" fill="none" stroke="#3f3f46" stroke-width="3"/>
    <circle cx="600" cy="400" r="8" fill="#10b981"/>
    <circle cx="600" cy="400" r="28" fill="none" stroke="#10b981" stroke-width="2" opacity="0.5"/>
  </svg>
`);

export const SOVEREIGN_VIDEO_POSTER = svgToDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="100%" height="100%">
    <rect width="1200" height="700" fill="#09090b"/>
    <circle cx="600" cy="350" r="70" fill="#f97316" opacity="0.8"/>
    <polygon points="585,320 625,350 585,380" fill="#ffffff"/>
    <text x="600" y="460" text-anchor="middle" fill="#a1a1aa" font-family="sans-serif" font-size="20">Libre Media Engine (Offline Playback)</text>
  </svg>
`);
