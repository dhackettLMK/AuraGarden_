/**
 * Oscar's wardrobe (brief 10.4). Each accessory draws into one slot of the
 * Oscar SVG: head, body, shell or hand.
 */
export type AccessorySlot = "head" | "body" | "shell" | "hand";

export function Accessory({ id, slot }: { id: string | null | undefined; slot: AccessorySlot }) {
  if (!id) return null;
  const draw = ACCESSORIES[id]?.[slot];
  return draw ? <g aria-hidden="true">{draw}</g> : null;
}

const ACCESSORIES: Record<string, Partial<Record<AccessorySlot, React.ReactNode>>> = {
  "sun-hat": {
    head: (
      <g>
        <ellipse cx="44" cy="28" rx="36" ry="8" fill="#EBC98A" />
        <path d="M24 28c0-12 9-20 20-20s20 8 20 20z" fill="#F3D9A0" />
        <path d="M24.5 25c13 3 26 3 39 0v3.5c-13 3-26 3-39 0z" fill="#F2A3B5" />
        <circle cx="58" cy="24" r="3.2" fill="#FFFDF7" />
        <circle cx="58" cy="24" r="1.3" fill="#F4C443" />
      </g>
    ),
  },
  scarf: {
    body: (
      <g>
        <path d="M24 80c12 7 32 7 44 0l1 8c-14 7-32 7-46 0z" fill="#D9575B" />
        <path d="M28 82v7M36 84v7M44 85v7M52 84v7M60 82v7" stroke="#F3D2C4" strokeWidth="1.6" />
        <path d="M58 86l6 18-8 2-4-17z" fill="#C9474C" />
        <path d="M56 104h10" stroke="#F3D2C4" strokeWidth="1.6" strokeDasharray="2 1.6" />
      </g>
    ),
  },
  "black-belt": {
    head: (
      <g>
        <path d="M16 38c18-8 38-8 56 0l-1 7c-18-7-36-7-54 0z" fill="#FFFDF7" />
        <path d="M70 39l9-4 1 6-8 2z" fill="#FFFDF7" />
        <circle cx="44" cy="38" r="3.2" fill="#C23B3B" />
      </g>
    ),
    shell: (
      <g>
        <path d="M35 86h98v6H35z" fill="#1F1D1B" />
        <rect x="76" y="83" width="12" height="12" rx="2.5" fill="#1F1D1B" />
        <path d="M80 95l-4 10 4 1 3-10zM84 95l4 10-4 1-3-10z" fill="#1F1D1B" />
      </g>
    ),
  },
  "grad-cap": {
    head: (
      <g>
        <path d="M30 26h28v8c-8 3-20 3-28 0z" fill="#2E3A45" />
        <path d="M14 22l30-11 30 11-30 11z" fill="#3A4855" />
        <path d="M44 22l20 6v12" stroke="#F4C443" strokeWidth="1.8" fill="none" />
        <circle cx="64" cy="41" r="2.4" fill="#F4C443" />
      </g>
    ),
  },
  "smiley-tee": {
    body: (
      <g>
        <path d="M27 86c8-6 42-6 50 0l3 14c-16 8-40 8-56 0z" fill="#F6C828" />
        <circle cx="45" cy="94" r="5.4" fill="#FFF3B8" />
        <circle cx="43.2" cy="92.6" r=".9" fill="#2E2A26" />
        <circle cx="46.8" cy="92.6" r=".9" fill="#2E2A26" />
        <path d="M42.6 95c1.4 1.4 3.4 1.4 4.8 0" stroke="#2E2A26" strokeWidth=".9" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  "tiny-hurley": {
    hand: (
      <g transform="translate(78 70) rotate(18)">
        <rect x="-2" y="0" width="4.5" height="30" rx="2" fill="#E9C48C" />
        <rect x="-2" y="0" width="4.5" height="7" rx="2" fill="#2F2B27" />
        <path d="M-4 28c2-3 11-3 13 2 1 4-3 7-8 7-5 0-7-4-5-9z" fill="#E9C48C" />
      </g>
    ),
  },
  sunglasses: {
    head: (
      <g>
        <path d="M22 44h20c0 8-4 12-10 12s-10-4-10-12z" fill="#2B2B33" />
        <path d="M46 44h20c0 8-4 12-10 12s-10-4-10-12z" fill="#2B2B33" />
        <path d="M42 46h4M16 44h6M66 44h6" stroke="#2B2B33" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M26 47l5-2M50 47l5-2" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ),
  },
  backpack: {
    shell: (
      <g>
        <rect x="96" y="44" width="30" height="36" rx="9" fill="#C8784A" />
        <rect x="100" y="60" width="22" height="14" rx="5" fill="#B0653B" />
        <path d="M104 44c0-6 14-6 14 0" stroke="#8E5131" strokeWidth="3" fill="none" />
        <circle cx="111" cy="66" r="1.8" fill="#F4C443" />
      </g>
    ),
  },
  "golden-crown": {
    head: (
      <g>
        <path d="M28 26l4-14 8 8 4-12 4 12 8-8 4 14z" fill="#E7B53C" stroke="#C99A2A" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="28" y="24" width="32" height="5" rx="2" fill="#D9A52E" />
        <circle cx="44" cy="17" r="2" fill="#F59FC6" />
        <circle cx="34" cy="21" r="1.4" fill="#9CC9FF" />
        <circle cx="54" cy="21" r="1.4" fill="#B79CF2" />
      </g>
    ),
  },
};

export const ACCESSORY_NAMES: Record<string, string> = {
  "sun-hat": "Sun hat",
  scarf: "Knitted scarf",
  "black-belt": "Headband and black belt",
  "grad-cap": "Graduation cap",
  "smiley-tee": "Smiley tee",
  "tiny-hurley": "Tiny hurley",
  sunglasses: "Sunglasses",
  backpack: "Explorer's backpack",
  "golden-crown": "Golden crown",
};
