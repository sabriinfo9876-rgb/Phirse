/**
 * Generates high-resolution, zero-latency studio SVG data URIs for product listings
 * and multi-angle inspection galleries so every item has 3 distinct, zoomable photos
 * with zero broken external links.
 */

export interface StudioShotConfig {
  title: string;
  subtitle: string;
  angleLabel: string;
  accentHex: string;
  bgTone: string;
  illustrationType:
    | 'smartphone'
    | 'laptop'
    | 'console'
    | 'camera'
    | 'tv'
    | 'desk'
    | 'chair'
    | 'bicycle'
    | 'lens'
    | 'appliance'
    | 'watch'
    | 'headphones'
    | 'books'
    | 'dumbbells'
    | 'guitar'
    | 'generic';
  angleIndex: 0 | 1 | 2;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getObjectSvg(type: StudioShotConfig['illustrationType'], accent: string, angle: 0 | 1 | 2): string {
  const rot = angle === 1 ? 'transform="rotate(-4 400 285) scale(1.04)"' : angle === 2 ? 'transform="translate(0, -6) scale(0.96)"' : '';

  switch (type) {
    case 'smartphone':
      return `<g ${rot}>
        <!-- Box in background for angle 2 -->
        ${angle === 2 ? `<rect x="245" y="135" width="145" height="275" rx="10" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="2" />
        <text x="317" y="265" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9CA3AF" font-weight="600">ORIGINAL BOX</text>` : ''}
        <!-- Smartphone body -->
        <rect x="${angle === 2 ? 360 : 315}" y="115" width="170" height="330" rx="26" fill="#1E293B" stroke="#475569" stroke-width="4"/>
        <rect x="${angle === 2 ? 370 : 325}" y="127" width="150" height="306" rx="18" fill="${accent}" opacity="0.22"/>
        <!-- Camera module or screen details -->
        ${angle === 1
          ? `<rect x="335" y="135" width="66" height="66" rx="16" fill="#0F172A" stroke="#334155" stroke-width="2"/>
             <circle cx="354" cy="154" r="12" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
             <circle cx="382" cy="182" r="12" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
             <circle cx="382" cy="152" r="5" fill="#FDE68A"/>`
          : `<rect x="${angle === 2 ? 418 : 373}" y="135" width="54" height="14" rx="7" fill="#0F172A"/>
             <circle cx="${angle === 2 ? 445 : 400}" cy="265" r="46" fill="${accent}" opacity="0.35"/>
             <path d="M${angle === 2 ? 415 : 370} 365 H${angle === 2 ? 475 : 430}" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>`
        }
      </g>`;

    case 'laptop':
      return `<g ${rot}>
        <!-- Screen lid -->
        <rect x="230" y="135" width="340" height="215" rx="12" fill="#1F2937" stroke="#374151" stroke-width="4"/>
        <rect x="244" y="149" width="312" height="185" rx="4" fill="#0F172A"/>
        <rect x="265" y="170" width="180" height="12" rx="4" fill="${accent}" opacity="0.65"/>
        <rect x="265" y="194" width="240" height="8" rx="4" fill="#334155"/>
        <rect x="265" y="212" width="200" height="8" rx="4" fill="#334155"/>
        <rect x="265" y="240" width="120" height="65" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
        <!-- Base deck -->
        <path d="M190 350 L610 350 L640 385 C640 392 632 396 620 396 L180 396 C168 396 160 392 160 385 Z" fill="#374151" stroke="#4B5563" stroke-width="2"/>
        <rect x="365" y="362" width="70" height="22" rx="4" fill="#1F2937"/>
      </g>`;

    case 'console':
      return `<g ${rot}>
        <!-- Console tower -->
        <rect x="285" y="110" width="95" height="310" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/>
        <rect x="303" y="115" width="59" height="300" rx="8" fill="#0F172A"/>
        <path d="M303 135 L303 240" stroke="#38BDF8" stroke-width="2.5"/>
        <!-- Controller -->
        <rect x="415" y="295" width="135" height="92" rx="36" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/>
        <circle cx="452" cy="338" r="14" fill="#1E293B"/>
        <circle cx="512" cy="338" r="14" fill="#1E293B"/>
        <rect x="468" y="305" width="30" height="16" rx="4" fill="#0F172A"/>
      </g>`;

    case 'camera':
    case 'lens':
      return `<g ${rot}>
        <!-- Camera body / lens barrel -->
        <rect x="245" y="185" width="310" height="205" rx="24" fill="#1E293B" stroke="#334155" stroke-width="4"/>
        <path d="M330 185 L355 145 L445 145 L470 185 Z" fill="#1E293B" stroke="#334155" stroke-width="3"/>
        <rect x="265" y="168" width="42" height="17" rx="4" fill="#475569"/>
        <!-- Lens rings -->
        <circle cx="400" cy="288" r="78" fill="#0F172A" stroke="#64748B" stroke-width="5"/>
        <circle cx="400" cy="288" r="56" fill="#1E293B" stroke="${accent}" stroke-width="3"/>
        <circle cx="400" cy="288" r="28" fill="#090D16"/>
        <circle cx="388" cy="276" r="9" fill="#38BDF8" opacity="0.55"/>
      </g>`;

    case 'tv':
      return `<g ${rot}>
        <rect x="185" y="130" width="430" height="250" rx="8" fill="#0F172A" stroke="#334155" stroke-width="5"/>
        <rect x="197" y="142" width="406" height="226" rx="4" fill="#1E293B"/>
        <circle cx="340" cy="245" r="75" fill="${accent}" opacity="0.35"/>
        <circle cx="445" cy="265" r="55" fill="#F59E0B" opacity="0.25"/>
        <!-- Stand legs -->
        <path d="M265 380 L235 418 M535 380 L565 418" stroke="#475569" stroke-width="7" stroke-linecap="round"/>
      </g>`;

    case 'desk':
      return `<g ${rot}>
        <!-- Tabletop -->
        <rect x="175" y="210" width="450" height="26" rx="6" fill="#78350F" stroke="#451A03" stroke-width="2"/>
        <!-- Drawer apron -->
        <rect x="205" y="236" width="390" height="44" fill="#92400E" stroke="#451A03" stroke-width="2"/>
        <rect x="230" y="246" width="155" height="24" rx="3" fill="#78350F"/>
        <rect x="415" y="246" width="155" height="24" rx="3" fill="#78350F"/>
        <circle cx="307" cy="258" r="4" fill="#FDE68A"/>
        <circle cx="492" cy="258" r="4" fill="#FDE68A"/>
        <!-- Solid legs -->
        <rect x="205" y="280" width="22" height="140" rx="3" fill="#451A03"/>
        <rect x="573" y="280" width="22" height="140" rx="3" fill="#451A03"/>
        <!-- Lamp on desk -->
        <path d="M510 210 L510 145 L475 160" stroke="#1E293B" stroke-width="5" stroke-linecap="round" fill="none"/>
        <rect x="490" y="204" width="40" height="6" rx="3" fill="#1E293B"/>
      </g>`;

    case 'chair':
      return `<g ${rot}>
        <!-- Backrest -->
        <rect x="335" y="110" width="130" height="185" rx="28" fill="#1E293B" stroke="#475569" stroke-width="4"/>
        <rect x="355" y="130" width="90" height="145" rx="16" fill="#334155"/>
        <!-- Seat cushion -->
        <rect x="310" y="290" width="180" height="32" rx="14" fill="#0F172A" stroke="${accent}" stroke-width="2"/>
        <!-- Armrests -->
        <path d="M310 245 L310 300 M490 245 L490 300" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
        <!-- Hydraulic cylinder & base -->
        <rect x="392" y="322" width="16" height="65" fill="#475569"/>
        <path d="M320 405 L400 385 L480 405 M400 385 L400 412" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
        <circle cx="320" cy="414" r="8" fill="#0F172A"/>
        <circle cx="400" cy="418" r="8" fill="#0F172A"/>
        <circle cx="480" cy="414" r="8" fill="#0F172A"/>
      </g>`;

    case 'bicycle':
      return `<g ${rot}>
        <!-- Wheels -->
        <circle cx="265" cy="330" r="68" fill="none" stroke="#1E293B" stroke-width="10"/>
        <circle cx="265" cy="330" r="56" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="8 8"/>
        <circle cx="535" cy="330" r="68" fill="none" stroke="#1E293B" stroke-width="10"/>
        <circle cx="535" cy="330" r="56" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="8 8"/>
        <!-- Frame -->
        <path d="M265 330 L360 225 L495 225 L385 330 Z" fill="none" stroke="${accent}" stroke-width="9" stroke-linejoin="round"/>
        <path d="M360 225 L385 330 M495 225 L535 330" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>
        <!-- Saddle & Handlebars -->
        <path d="M335 205 L380 205" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
        <path d="M480 195 L520 195 L505 225" fill="none" stroke="#0F172A" stroke-width="8" stroke-linecap="round"/>
      </g>`;

    case 'appliance':
      return `<g ${rot}>
        <rect x="225" y="165" width="350" height="220" rx="16" fill="#F8FAFC" stroke="#94A3B8" stroke-width="4"/>
        <rect x="250" y="190" width="220" height="170" rx="10" fill="#0F172A" stroke="#334155" stroke-width="3"/>
        <rect x="275" y="215" width="170" height="120" rx="6" fill="#1E293B"/>
        <!-- Control dial & digital readout -->
        <rect x="492" y="195" width="60" height="28" rx="4" fill="#0F172A"/>
        <text x="522" y="214" text-anchor="middle" font-family="monospace" font-size="13" fill="#34D399">02:30</text>
        <circle cx="522" cy="275" r="22" fill="#E2E8F0" stroke="#64748B" stroke-width="3"/>
        <rect x="495" y="325" width="54" height="22" rx="6" fill="${accent}"/>
      </g>`;

    case 'watch':
      return `<g ${rot}>
        <!-- Watch strap -->
        <rect x="358" y="105" width="84" height="330" rx="14" fill="#451A03"/>
        <!-- Case -->
        <circle cx="400" cy="270" r="82" fill="#E2E8F0" stroke="#94A3B8" stroke-width="6"/>
        <circle cx="400" cy="270" r="66" fill="#0F172A" stroke="${accent}" stroke-width="3"/>
        <!-- Hands -->
        <path d="M400 270 L400 222 M400 270 L438 270" stroke="#F8FAFC" stroke-width="5" stroke-linecap="round"/>
        <circle cx="400" cy="270" r="6" fill="#F59E0B"/>
      </g>`;

    case 'headphones':
      return `<g ${rot}>
        <path d="M285 285 C285 155 515 155 515 285" fill="none" stroke="#1E293B" stroke-width="22" stroke-linecap="round"/>
        <rect x="255" y="255" width="56" height="105" rx="28" fill="#0F172A" stroke="#475569" stroke-width="4"/>
        <rect x="489" y="255" width="56" height="105" rx="28" fill="#0F172A" stroke="#475569" stroke-width="4"/>
      </g>`;

    case 'books':
      return `<g ${rot}>
        <rect x="240" y="285" width="320" height="44" rx="6" fill="#0F5348" stroke="#064E3B" stroke-width="2"/>
        <rect x="250" y="293" width="295" height="28" rx="2" fill="#FEF3C7"/>
        <rect x="255" y="235" width="295" height="48" rx="6" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
        <rect x="265" y="243" width="270" height="32" rx="2" fill="#F8FAFC"/>
        <rect x="275" y="185" width="265" height="48" rx="6" fill="#9A3412" stroke="#7C2D12" stroke-width="2"/>
        <rect x="285" y="193" width="240" height="32" rx="2" fill="#FEF3C7"/>
      </g>`;

    case 'dumbbells':
      return `<g ${rot}>
        <rect x="235" y="260" width="330" height="22" rx="8" fill="#64748B"/>
        <rect x="255" y="195" width="34" height="152" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
        <rect x="295" y="210" width="28" height="122" rx="6" fill="#1E293B" stroke="#334155" stroke-width="2"/>
        <rect x="511" y="195" width="34" height="152" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
        <rect x="477" y="210" width="28" height="122" rx="6" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      </g>`;

    case 'guitar':
      return `<g ${rot}>
        <circle cx="355" cy="310" r="76" fill="#B45309" stroke="#78350F" stroke-width="5"/>
        <circle cx="415" cy="260" r="56" fill="#B45309" stroke="#78350F" stroke-width="5"/>
        <circle cx="388" cy="285" r="24" fill="#1E293B" stroke="#FDE68A" stroke-width="3"/>
        <path d="M435 235 L555 125" stroke="#451A03" stroke-width="22" stroke-linecap="round"/>
      </g>`;

    default:
      return `<g ${rot}>
        <rect x="275" y="165" width="250" height="210" rx="22" fill="#1E293B" stroke="${accent}" stroke-width="4"/>
        <circle cx="400" cy="270" r="52" fill="${accent}" opacity="0.35"/>
      </g>`;
  }
}

export function createStudioGallerySet(
  config: Omit<StudioShotConfig, 'angleLabel' | 'angleIndex'>,
  primaryPhotoOverride?: string
): string[] {
  const angleLabels = [
    'Studio Front View',
    'Condition & Finish Inspection',
    'Included Accessories & Box',
  ];

  const generatedAngles = ([0, 1, 2] as const).map((idx) => {
    const safeTitle = escapeXml(config.title);
    const safeSub = escapeXml(config.subtitle);
    const safeAngle = escapeXml(angleLabels[idx]);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="bg-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${config.bgTone}" />
          <stop offset="100%" stop-color="#E5E7EB" />
        </linearGradient>
        <radialGradient id="floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0F172A" stop-opacity="0.16" />
          <stop offset="100%" stop-color="#0F172A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg-${idx})" />
      <!-- Subtle studio horizon -->
      <rect x="0" y="420" width="800" height="180" fill="#FFFFFF" opacity="0.45" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#CBD5E1" stroke-width="1.5" />
      <!-- Floor shadow -->
      <ellipse cx="400" cy="430" rx="210" ry="26" fill="url(#floor)" />
      <!-- Top studio angle label -->
      <text x="48" y="54" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" fill="#475569" letter-spacing="0.04em">${safeAngle}</text>
      <text x="752" y="54" text-anchor="end" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" fill="#0F5348">PHIRSE</text>
      <!-- Main studio object -->
      ${getObjectSvg(config.illustrationType, config.accentHex, idx)}
      <!-- Bottom caption -->
      <text x="48" y="522" font-family="Syne, sans-serif" font-size="22" font-weight="700" fill="#0F172A">${safeTitle}</text>
      <text x="48" y="550" font-family="Plus Jakarta Sans, sans-serif" font-size="15" font-weight="500" fill="#475569">${safeSub}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  });

  if (primaryPhotoOverride) {
    return [primaryPhotoOverride, generatedAngles[1], generatedAngles[2]];
  }
  return generatedAngles;
}

export function createAvatarSvg(initials: string, bgHex: string): string {
  const safe = escapeXml(initials.slice(0, 2).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="${bgHex}" />
    <text x="60" y="68" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="42" font-weight="700" fill="#FFFFFF">${safe}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
