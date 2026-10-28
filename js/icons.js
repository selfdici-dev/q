// Icônes au trait dessinées pour Cap : grille 24 × 24, trait 1,8, bouts
// arrondis, couleur du texte (currentColor). Elles remplacent les emojis
// des titres, des sections, du plan du jour et des messages du jour ; les
// emojis des contenus (habitudes, aliments, messages) restent.
// Logique pure (des chaînes SVG), testée par tests/icons.test.js.

const P = (d, more = '') => `<path d="${d}"${more}/>`;
const C = (cx, cy, r, more = '') => `<circle cx="${cx}" cy="${cy}" r="${r}"${more}/>`;
const R = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const DOT = ' stroke-width="2.6"';
// une ligne de vagues de x = 3 à 21, à la hauteur y
const wave = (y) => `M3 ${y}c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0`;
const SPEAKER = P('M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z');

export const ICONS = {
  // sport et journée
  dumbbell: R(5, 7, 3, 10, 1) + R(16, 7, 3, 10, 1) + P('M8 12h8M3 10v4M21 10v4'),
  flame: P('M12 21.5C8.4 21.5 5.5 18.8 5.5 15.1 5.5 12.3 7.1 10.5 8.5 8.9 8.9 10.4 9.7 11.4 10.9 12 10.6 8.5 12.2 5.4 15 3 15.2 6.1 16.6 7.9 17.6 9.4 18.6 10.9 18.5 12.9 18.5 15.1 18.5 18.8 15.6 21.5 12 21.5z'),
  flag: P('M5.5 21V3.8M5.5 4.5h12l-2.5 4.25 2.5 4.25h-12'),
  trophy: P('M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0z') + P('M7.5 5.5H5.3v1.2a3 3 0 0 0 2.6 3M16.5 5.5h2.2v1.2a3 3 0 0 1-2.6 3M12 13v3.5M8.5 20h7M9.5 20c0-2 1-3.5 2.5-3.5s2.5 1.5 2.5 3.5'),
  target: C(12, 12, 9) + C(12, 12, 5.5) + C(12, 12, 2),
  gauge: P('M5.1 17.5A8 8 0 1 1 18.9 17.5M12 13.5l3.5-3.5') + C(12, 13.5, 1.3),
  shield: P('M12 3l7 2.8v5.4c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V5.8z') + P('M9 12l2.2 2.2L15.5 10'),
  check: P('M5 12.5l4.5 4.5L19 7.5'),
  'check-circle': C(12, 12, 9) + P('M8.2 12.3l2.6 2.6 5-5.2'),
  sparkles: P('M11 3.5l1.6 4.4 4.4 1.6-4.4 1.6L11 15.5l-1.6-4.4L5 9.5l4.4-1.6z') + P('M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z'),
  // sommeil, temps, téléphone
  moon: P('M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z'),
  sun: C(12, 12, 4) + P('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  auto: C(12, 12, 8.5) + P('M12 3.5a8.5 8.5 0 0 1 0 17z', ' fill="currentColor"'),
  alarm: C(12, 13, 7.5) + P('M12 9.5V13l2.4 1.6M4.8 6.2l2.6-2.4M19.2 6.2l-2.6-2.4'),
  clock: C(12, 12, 9) + P('M12 7v5l3.2 2'),
  calendar: R(3.5, 5, 17, 15.5, 2.5) + P('M3.5 10h17M8 3v4M16 3v4'),
  'phone-off': P('M8.5 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z') + P('M3.5 3.5l17 17'),
  'battery-low': R(2.5, 7, 16.5, 10, 2.2) + P('M21.5 10.5v3M6 10.5v3'),
  sprout: P('M12 21v-7.5') + P('M12 13.5C12 9.9 9.6 7.5 5.5 7.5c0 3.6 2.4 6 6.5 6z') + P('M12 11c0-3 2.2-5.5 6.5-5.5 0 3-2.2 5.5-6.5 5.5z'),
  refresh: P('M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5M20 20v-4.5h-4.5'),
  alert: P('M10.3 4.3a2 2 0 0 1 3.4 0l7.8 13.4a2 2 0 0 1-1.7 3H4.2a2 2 0 0 1-1.7-3z') + P('M12 9.5v4.5') + P('M12 17.3h.01', DOT),
  ban: C(12, 12, 9) + P('M5.7 5.7l12.6 12.6'),
  lock: R(5, 10.5, 14, 10, 2.5) + P('M8 10.5V7.5a4 4 0 0 1 8 0v3'),
  // manger
  utensils: P('M6.5 3v6.5a2 2 0 0 0 4 0V3M8.5 3v4.5M8.5 11.5V21') + P('M17.5 21V3c-2.2 1.2-3.5 3.8-3.5 7v4h3.5'),
  traffic: R(8, 2.5, 8, 19, 3) + C(12, 7, 1.7) + C(12, 12, 1.7) + C(12, 17, 1.7),
  apple: P('M12 8C10.2 6.6 6.9 6.6 5.6 9 4.2 11.6 5.2 16 7.6 18.7 9 20.3 10.4 20.8 12 19.9 13.6 20.8 15 20.3 16.4 18.7 18.8 16 19.8 11.6 18.4 9 17.1 6.6 13.8 6.6 12 8zM12 8c0-2 .6-3.6 2-4.6'),
  cup: P('M4.5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM15.5 11h1.8a2.3 2.3 0 0 1 0 4.6h-2.1M8 3.5c-.9 1 .9 2.2 0 3.3M12 3.5c-.9 1 .9 2.2 0 3.3'),
  pan: C(10, 14, 6.2) + C(10, 14, 2) + P('M14.5 9.6l6-6'),
  // lire, apprendre, noter
  school: P('M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11M21.5 9v5'),
  'book-open': P('M12 7.5v13M12 7.5C10.2 5.8 7.6 5 3.5 5v13c4.1 0 6.7.8 8.5 2.5M12 7.5c1.8-1.7 4.4-2.5 8.5-2.5v13c-4.1 0-6.7.8-8.5 2.5'),
  books: R(4, 4.5, 4, 15.5, 1) + R(9.5, 4.5, 4, 15.5, 1) + P('M15.4 5.6l3.6-.9 3 14.4-3.6.9z'),
  cards: P('M7.5 6.5V5A2 2 0 0 1 9.5 3h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H17') + R(3.5, 6.5, 13.5, 14.5, 2),
  list: P('M9 6.5h11M9 12h11M9 17.5h11') + P('M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01', DOT),
  copy: R(8.5, 8.5, 12, 12, 2.5) + P('M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5'),
  download: P('M12 3.5V15M7.5 10.5l4.5 4.5 4.5-4.5M4.5 17v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V17'),
  message: P('M6.5 3.5h11A2.5 2.5 0 0 1 20 6v8a2.5 2.5 0 0 1-2.5 2.5h-8l-4 3.5v-3.5A2.5 2.5 0 0 1 4 14V6a2.5 2.5 0 0 1 2.5-2.5z'),
  compass: C(12, 12, 9) + P('M15.6 8.4l-2.2 5-5 2.2 2.2-5z'),
  grid: R(3.5, 3.5, 6.5, 6.5, 1.8) + R(14, 3.5, 6.5, 6.5, 1.8) + R(3.5, 14, 6.5, 6.5, 1.8) + R(14, 14, 6.5, 6.5, 1.8),
  lightbulb: P('M9.2 17.5h5.6M10 20.5h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.6v.1h5.6v-.1c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z'),
  pin: P('M9 3.5h6M10 3.5v5l-2.5 3v1.5h9v-1.5L14 8.5v-5M12 13v7.5'),
  pencil: P('M14.8 5.2l4 4L8.6 19.4l-4.6.6.6-4.6zM12.8 7.2l4 4'),
  volume: SPEAKER + P('M15 9.2a4 4 0 0 1 0 5.6M17.8 6.6a7.6 7.6 0 0 1 0 10.8'),
  'volume-x': SPEAKER + P('M15.5 9.5l5 5M20.5 9.5l-5 5'),
  // argent
  briefcase: R(3, 7.5, 18, 12.5, 2.5) + P('M8.5 7.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18'),
  map: P('M3.5 6.3L9 4l6 2.3L20.5 4v13.7L15 20l-6-2.3-5.5 2.3zM9 4v13.7M15 6.3V20'),
  candles: R(5, 6.5, 4, 9, 1) + R(15, 9.5, 4, 8, 1) + P('M7 3.5v3M7 15.5v4M17 5v4.5M17 17.5V20'),
  waves: P(`${wave(7)}${wave(12)}${wave(17)}`),
  'trending-up': P('M3.5 16.5l5.5-5.5 4 4 7.5-7.5M15 7.5h5.5V13'),
  search: C(10.5, 10.5, 6.5) + P('M15.5 15.5l5 5'),
  flask: P('M9.5 3.5h5M10.5 3.5v5.2L5 18.5a1.5 1.5 0 0 0 1.3 2.2h11.4a1.5 1.5 0 0 0 1.3-2.2L13.5 8.7V3.5M7.5 14.5h9'),
  coin: C(12, 12, 9) + P('M15.2 8.6a4.2 4.2 0 1 0 0 6.8M7.5 10.8h5.5M7.5 13.2h5.5'),
  newspaper: P('M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5V19a1.5 1.5 0 0 0 1.5 1.5H6a2 2 0 0 1-2-2zM17 9h2.5a1 1 0 0 1 1 1v9a1.5 1.5 0 0 1-3 0M7.5 8h6M7.5 11.5h6M7.5 15h4'),
};

// L'icône en SVG en ligne, cachée aux lecteurs d'écran (le texte à côté
// dit déjà tout). Nom inconnu : rien.
export function icon(name, cls = '') {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg class="ico${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
