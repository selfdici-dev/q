// Poses des bonshommes animés, une entrée par exercice (nom sans parenthèses).
// Format et conventions : voir js/figures.js. Vue de profil, tête à droite.
export const POSES = {
  Pompes: {
    dur: 2.4,
    frames: [
      { anchor: 'footN', at: [20, 70], torso: -27, legN: [153, 153], legF: [153, 153], armN: { to: [65.5, 70] }, armF: { to: [65.5, 70] } },
      { anchor: 'footN', at: [20, 70], torso: -9, legN: [171, 171], legF: [171, 171], armN: { to: [65.5, 70] }, armF: { to: [65.5, 70] } },
    ],
  },
  'Dead bug': {
    dur: 4,
    loop: 'cycle',
    frames: [
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-90, -90], legN: [-90, 180], legF: [-90, 180] },
      { at: [45, 68.5], torso: 0, armN: [-12, -8], armF: [-90, -90], legN: [-90, 180], legF: [186, 184] },
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-90, -90], legN: [-90, 180], legF: [-90, 180] },
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-12, -8], legN: [186, 184], legF: [-90, 180] },
    ],
  },
};
