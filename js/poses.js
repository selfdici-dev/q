// Poses des bonshommes animés, une entrée par exercice (nom sans parenthèses).
// Format et conventions : voir js/figures.js. Vue de profil, tête à droite,
// sol à y = 70. Dessinées puis vérifiées une à une (rendu + contrôle auto).
export const POSES = {
  // Exemples de référence
  Pompes: {
    dur: 2.4,
    frames: [
      { anchor: 'footN', at: [20, 70], torso: -27, armN: { to: [65.5, 70] }, armF: { to: [65.5, 70] }, legN: [153, 153], legF: [153, 153] },
      { anchor: 'footN', at: [20, 70], torso: -9, armN: { to: [65.5, 70] }, armF: { to: [65.5, 70] }, legN: [171, 171], legF: [171, 171] },
    ],
  },
  'Dead bug': {
    dur: 4, loop: 'cycle',
    frames: [
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-90, -90], legN: [-90, 180], legF: [-90, 180] },
      { at: [45, 68.5], torso: 0, armN: [-12, -8], armF: [-90, -90], legN: [-90, 180], legF: [186, 184] },
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-90, -90], legN: [-90, 180], legF: [-90, 180] },
      { at: [45, 68.5], torso: 0, armN: [-90, -90], armF: [-12, -8], legN: [186, 184], legF: [-90, 180] },
    ],
  },

  // Sur le dos et sur le côté
  'Crunch inversé': {
    dur: 6,
    frames: [
      { anchor: 'shoulder', at: [76, 68.5], torso: 0, neck: 0, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: [-130, 140], legF: [-134, 136] },
      { anchor: 'shoulder', at: [76, 68.5], torso: 10, neck: 0, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: [-50, -140], legF: [-54, -144] },
    ],
  },
  'Hollow hold genoux pliés': {
    dur: 3.5, hold: 0.3,
    frames: [
      { at: [52, 68.5], torso: -16, neck: -24, armN: [192, 192], armF: [188, 188], legN: [-128, 172], legF: [-132, 168] },
      { at: [52, 68.5], torso: -17.5, neck: -26, armN: [193, 193], armF: [189, 189], legN: [-129, 171], legF: [-133, 167] },
    ],
  },
  'Renforcement du cou': {
    dur: 6, loop: 'cycle',
    frames: [
      { at: [54, 68.5], torso: 0, neck: 0, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
      { at: [54, 68.5], torso: 0, neck: -24, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
      { at: [54, 68.5], torso: 0, neck: -25, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
      { at: [54, 68.5], torso: 0, neck: -1, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
    ],
  },
  'Respiration 4-6': {
    dur: 6, loop: 'cycle', hold: 0.05,
    frames: [
      { at: [54, 68.5], torso: 0, neck: 0, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
      { at: [54, 68.5], torso: -2.5, neck: -1.5, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
      { at: [54, 68.5], torso: -1.25, neck: -0.75, armN: { to: [53, 70], bend: 1 }, armF: { to: [53.5, 70], bend: 1 }, legN: { to: [33, 70], bend: 1 }, legF: { to: [35.5, 70], bend: 1 } },
    ],
  },
  'Livre ouvert': {
    dur: 6, hold: 0.2,
    frames: [
      { at: [42, 64.5], torso: -8, neck: 25, armN: [21, 21], armF: { to: [84.5, 70], bend: 1 }, legN: [20, 180], legF: [15, 176] },
      { at: [42, 64.5], torso: -7, neck: 5, armN: [-90, -90], armF: { to: [84.5, 70], bend: 1 }, legN: [20, 180], legF: [15, 176] },
      { at: [42, 64.5], torso: -5, neck: -10, armN: [200, 200], armF: { to: [84.5, 70], bend: 1 }, legN: [20, 180], legF: [15, 176] },
    ],
  },

  // Planches et pompes
  'Roue abdominale à genoux': {
    dur: 3.2, wheel: true,
    frames: [
      { anchor: 'kneeN', at: [24, 69], torso: -29, neck: 6, armN: { to: [48.2, 66.5] }, armF: { to: [49.7, 66.5] }, legN: [90, 180], legF: [92, 182] },
      { anchor: 'kneeN', at: [24, 69], torso: -18, neck: -4, armN: { to: [76.15, 66.5] }, armF: { to: [77.65, 66.5] }, legN: [140, 180], legF: [142, 182] },
    ],
  },
  'Planche sur avant-bras': {
    dur: 3.5, hold: 0.3,
    frames: [
      { anchor: 'footN', at: [16, 70], torso: -15.4, neck: -10, armN: { to: [76.5, 68.5] }, armF: { to: [78.5, 68.5] }, legN: [164.6, 164.6], legF: [167, 167] },
      { anchor: 'footN', at: [16, 70], torso: -16, neck: -13, armN: { to: [76.5, 68.5] }, armF: { to: [78.5, 68.5] }, legN: [164, 164], legF: [166.4, 166.4] },
    ],
  },
  'Planche latérale': {
    dur: 3.5, hold: 0.3, front: true,
    frames: [
      { anchor: 'footN', at: [16, 70], torso: -15.4, armN: { to: [76.5, 68.5] }, armF: [-90, -90], legN: [164.6, 164.6], legF: [167.4, 167.4] },
      { anchor: 'footN', at: [16, 70], torso: -16, armN: { to: [76.5, 68.5] }, armF: [-92, -93], legN: [164, 164], legF: [166.8, 166.8] },
    ],
  },
  'Pompes pike': {
    dur: 2.8,
    frames: [
      { anchor: 'footN', at: [44, 70], torso: 17.31, neck: 55, armN: { to: [80, 70] }, armF: { to: [81.5, 70] }, legN: [104, 104], legF: [106.5, 106.5] },
      { anchor: 'footN', at: [44, 70], torso: 24, neck: 45, armN: { to: [80, 70] }, armF: { to: [81.5, 70] }, legN: [123, 123], legF: [125.5, 125.5] },
    ],
  },
  'Pompes serrées': {
    dur: 2.6,
    frames: [
      { anchor: 'footN', at: [18, 70], torso: -26.8, armN: { to: [62.5, 70] }, armF: { to: [64, 70] }, legN: [153.2, 153.2], legF: [155.6, 155.6] },
      { anchor: 'footN', at: [18, 70], torso: -9, armN: { to: [62.5, 70] }, armF: { to: [64, 70] }, legN: [171, 171], legF: [173.4, 173.4] },
    ],
  },
  'Pompes sur les genoux': {
    dur: 2.4,
    frames: [
      { anchor: 'kneeN', at: [32, 69], torso: -36.4, armN: { to: [61.5, 70] }, armF: { to: [63.2, 70] }, legN: [143.6, 200], legF: [143.6, 207] },
      { anchor: 'kneeN', at: [32, 69], torso: -9, armN: { to: [61.5, 70] }, armF: { to: [63.2, 70] }, legN: [171, 200], legF: [171, 207] },
    ],
  },
  'Mountain climbers lents': {
    dur: 4.8, loop: 'cycle', hold: 0.08,
    frames: [
      { at: [43.71, 56.62], torso: -25.93, neck: -13.93, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [18, 70], bend: -1 }, legF: { to: [16.8, 70], bend: -1 } },
      { at: [42.52, 53.62], torso: -17.5, neck: -5.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [21.86, 61.82], bend: -1 }, legF: { to: [16.8, 70], bend: -1 } },
      { at: [42.41, 53.25], torso: -16.5, neck: -4.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [41.26, 63.15], bend: -1 }, legF: { to: [16.8, 70], bend: -1 } },
      { at: [42.52, 53.62], torso: -17.5, neck: -5.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [21.86, 61.82], bend: -1 }, legF: { to: [16.8, 70], bend: -1 } },
      { at: [43.71, 56.62], torso: -25.93, neck: -13.93, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [18, 70], bend: -1 }, legF: { to: [16.8, 70], bend: -1 } },
      { at: [42.52, 53.62], torso: -17.5, neck: -5.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [18, 70], bend: -1 }, legF: { to: [21.64, 61.68], bend: -1 } },
      { at: [42.41, 53.25], torso: -16.5, neck: -4.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [18, 70], bend: -1 }, legF: { to: [41.12, 63.37], bend: -1 } },
      { at: [42.52, 53.62], torso: -17.5, neck: -5.5, armN: { to: [63.4, 70] }, armF: { to: [64.9, 70] }, legN: { to: [18, 70], bend: -1 }, legF: { to: [21.64, 61.68], bend: -1 } },
    ],
  },

  // Sur le ventre, à quatre pattes, à genoux
  'Tirage superman': {
    dur: 4.2, loop: 'cycle', hold: 0.15,
    frames: [
      { at: [49, 68.5], torso: -10, neck: -6, armN: { to: [93.3, 59.9], bend: -1 }, armF: { to: [93.6, 61.5], bend: -1 }, legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10.5, neck: -6.5, armN: { to: [69.3, 58.6], bend: -1 }, armF: { to: [69.3, 60.2], bend: -1 }, legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -11, neck: -7, armN: { to: [69.2, 58], bend: -1 }, armF: { to: [69.3, 59.6], bend: -1 }, legN: [179, 179], legF: [181, 180.5] },
    ],
  },
  'Superman Y': {
    dur: 6, loop: 'cycle', hold: 0.2,
    frames: [
      { at: [49, 68.5], torso: 0, neck: 0, armN: [4, 4], armF: [2, 2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10, neck: -6, armN: [-13, -13], armF: [-9, -9], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10.5, neck: -6.5, armN: [-13.5, -13.5], armF: [-9.5, -9.5], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -0.5, neck: 0, armN: [4, 4], armF: [2, 2], legN: [179, 179], legF: [181, 180.5] },
    ],
  },
  'Superman W': {
    dur: 6, loop: 'cycle', hold: 0.2,
    frames: [
      { at: [49, 68.5], torso: 0, neck: 0, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10, neck: -6, armN: [192, -22], armF: [188, -18], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10.5, neck: -6.5, armN: [194, -23], armF: [190, -19], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -0.5, neck: 0, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
    ],
  },
  'Chat-vache': {
    dur: 6, hold: 0.25,
    frames: [
      { anchor: 'kneeN', at: [50, 68.5], torso: -17.2, neck: 97, armN: { to: [71, 70], bend: 1 }, armF: { to: [72.2, 70], bend: 1 }, legN: [90, 178], legF: [93, 177] },
      { anchor: 'kneeN', at: [50, 68.5], torso: -17.2, neck: -38, armN: { to: [71, 70], bend: 1 }, armF: { to: [72.2, 70], bend: 1 }, legN: [90, 178], legF: [93, 177] },
    ],
  },
  'Vacuum abdominal': {
    dur: 4, hold: 0.3,
    frames: [
      { anchor: 'kneeN', at: [50, 68.5], torso: -17.2, neck: 10, armN: { to: [71, 70], bend: 1 }, armF: { to: [72.2, 70], bend: 1 }, legN: [90, 178], legF: [93, 177] },
      { anchor: 'kneeN', at: [50, 68.5], torso: -17.2, neck: 13, armN: { to: [71, 70], bend: 1 }, armF: { to: [72.2, 70], bend: 1 }, legN: [90, 178], legF: [93, 177] },
    ],
  },
  'Posture de l’enfant': {
    dur: 6, hold: 0.4,
    frames: [
      { at: [38, 61], torso: -90, neck: -90, armN: [84, 75], armF: [88, 78], legN: [30, 178], legF: [32, 177] },
      { at: [38, 61], torso: 14.5, neck: 14.5, armN: [8.75, 8.75], armF: [7, 7], legN: [30, 178], legF: [32, 177] },
    ],
  },
  'Fente basse': {
    dur: 4, hold: 0.3,
    frames: [
      { anchor: 'kneeF', at: [55, 68.5], torso: -90, neck: -90, armN: [112, 58], armF: [116, 60], legN: { to: [78.3, 70], bend: -1 }, legF: [123.6, 179] },
      { anchor: 'kneeF', at: [55, 68.5], torso: -90, neck: -90, armN: [112, 58], armF: [116, 60], legN: { to: [78.3, 70], bend: -1 }, legF: [138, 179] },
    ],
  },

  // Debout
  'Shadow boxing': {
    dur: 2, loop: 'cycle', hold: 0.12,
    frames: [
      { anchor: 'footN', at: [66, 70], torso: -84, neck: -78, armN: { to: [69.5, 18], bend: 1 }, armF: { to: [67.5, 18.5], bend: 1 }, legN: [65, 88], legF: { to: [52, 70], bend: -1 } },
      { anchor: 'footN', at: [66, 70], torso: -81, neck: -78, armN: { to: [84.5, 19.5], bend: 1 }, armF: { to: [68.5, 18.5], bend: 1 }, legN: [65, 88], legF: { to: [52, 70], bend: -1 } },
      { anchor: 'footN', at: [66, 70], torso: -84, neck: -78, armN: { to: [69.5, 18], bend: 1 }, armF: { to: [67.5, 18.5], bend: 1 }, legN: [65, 88], legF: { to: [52, 70], bend: -1 } },
      { anchor: 'footN', at: [66, 70], torso: -78, neck: -78, armN: { to: [70.5, 18.5], bend: 1 }, armF: { to: [85, 20.5], bend: 1 }, legN: [62, 86], legF: { to: [52, 70], bend: -1 } },
    ],
  },
  'Shadow boxing rapide': {
    dur: 1.2, loop: 'cycle', hold: 0.08,
    frames: [
      { anchor: 'footN', at: [66, 70], torso: -84, neck: -78, armN: { to: [69.5, 18], bend: 1 }, armF: { to: [67.5, 18.5], bend: 1 }, legN: [67, 89], legF: { to: [52, 70], bend: -1 } },
      { anchor: 'footN', at: [66, 70], torso: -82, neck: -78, armN: { to: [80, 19.5], bend: 1 }, armF: { to: [68.5, 18.5], bend: 1 }, legN: [65, 88], legF: { to: [52, 70], bend: -1 } },
      { anchor: 'footN', at: [66, 70], torso: -80, neck: -78, armN: { to: [70.5, 18.5], bend: 1 }, armF: { to: [80.5, 20.5], bend: 1 }, legN: [62, 86], legF: { to: [52, 70], bend: -1 } },
    ],
  },
  'Montées de genoux sur place': {
    dur: 1.4, loop: 'cycle', hold: 0.05,
    frames: [
      { at: [60, 41], torso: -89, neck: -88, armN: [128, 60], armF: [45, -45], legN: [-2, 100], legF: [90, 90] },
      { at: [60, 41], torso: -89, neck: -88, armN: [88, 8], armF: [92, 12], legN: [90, 90], legF: [88, 92] },
      { at: [60, 41], torso: -89, neck: -88, armN: [45, -45], armF: [128, 60], legN: [90, 90], legF: [-6, 100] },
      { at: [60, 41], torso: -89, neck: -88, armN: [92, 12], armF: [88, 8], legN: [90, 90], legF: [88, 92] },
    ],
  },
  'Montées de genoux lentes': {
    dur: 3.2, loop: 'cycle', hold: 0.12,
    frames: [
      { at: [60, 41], torso: -89, neck: -88, armN: [118, 70], armF: [55, -25], legN: [8, 100], legF: [90, 90] },
      { at: [60, 41], torso: -89, neck: -88, armN: [88, 20], armF: [92, 24], legN: [90, 90], legF: [88, 92] },
      { at: [60, 41], torso: -89, neck: -88, armN: [55, -25], armF: [118, 70], legN: [90, 90], legF: [4, 100] },
      { at: [60, 41], torso: -89, neck: -88, armN: [92, 24], armF: [88, 20], legN: [90, 90], legF: [88, 92] },
    ],
  },
  'Jumping jacks sans saut': {
    dur: 2.4, loop: 'cycle', front: true, hold: 0.04,
    frames: [
      { at: [60, 41.2], torso: -90, neck: -90, armN: [78, 86], armF: [102, 94], legN: { to: [62.5, 70], bend: -1 }, legF: { to: [57.5, 70], bend: 1 } },
      { at: [59, 41.1], torso: -90, neck: -90, armN: [-2, -4], armF: [-178, -176], legN: { to: [66.5, 68], bend: -1 }, legF: { to: [57.5, 70], bend: 1 } },
      { at: [64.25, 41.9], torso: -90, neck: -90, armN: [-40, -56], armF: [-140, -124], legN: { to: [71, 70], bend: -1 }, legF: { to: [57.5, 70], bend: 1 } },
      { at: [59, 41.1], torso: -90, neck: -90, armN: [-2, -4], armF: [-178, -176], legN: { to: [66.5, 68], bend: -1 }, legF: { to: [57.5, 70], bend: 1 } },
      { at: [60, 41.2], torso: -90, neck: -90, armN: [78, 86], armF: [102, 94], legN: { to: [62.5, 70], bend: -1 }, legF: { to: [57.5, 70], bend: 1 } },
      { at: [61, 41.1], torso: -90, neck: -90, armN: [-2, -4], armF: [-178, -176], legN: { to: [62.5, 70], bend: -1 }, legF: { to: [53.5, 68], bend: 1 } },
      { at: [55.75, 41.9], torso: -90, neck: -90, armN: [-40, -56], armF: [-140, -124], legN: { to: [62.5, 70], bend: -1 }, legF: { to: [49, 70], bend: 1 } },
      { at: [61, 41.1], torso: -90, neck: -90, armN: [-2, -4], armF: [-178, -176], legN: { to: [62.5, 70], bend: -1 }, legF: { to: [53.5, 68], bend: 1 } },
    ],
  },
  'Rotations des épaules et des bras': {
    dur: 4.4, loop: 'cycle', hold: 0,
    frames: [
      { at: [56, 53.5], torso: -90, neck: -90, armN: [-45, -45], armF: [-53, -53], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [45, 45], armF: [37, 37], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [135, 135], armF: [127, 127], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [225, 225], armF: [217, 217], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [315, 315], armF: [307, 307], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [225, 225], armF: [217, 217], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [135, 135], armF: [127, 127], legN: [90, 180], legF: [92, 180.5] },
      { at: [56, 53.5], torso: -90, neck: -90, armN: [45, 45], armF: [37, 37], legN: [90, 180], legF: [92, 180.5] },
    ],
  },
  'Chin tucks': {
    dur: 6, loop: 'cycle', hold: 0.2,
    frames: [
      { at: [50, 68.5], torso: -90, neck: -69, armN: [78, 32], armF: [82, 34], legN: [-15, 168], legF: [-19, 164] },
      { at: [50, 68.5], torso: -90, neck: -96, armN: [78, 32], armF: [82, 34], legN: [-15, 168], legF: [-19, 164] },
      { at: [50, 68.5], torso: -90, neck: -96.5, armN: [78, 32], armF: [82, 34], legN: [-15, 168], legF: [-19, 164] },
      { at: [50, 68.5], torso: -90, neck: -96, armN: [78, 32], armF: [82, 34], legN: [-15, 168], legF: [-19, 164] },
      { at: [50, 68.5], torso: -90, neck: -70, armN: [78, 32], armF: [82, 34], legN: [-15, 168], legF: [-19, 164] },
    ],
  },
  'Langue au palais': {
    dur: 4, hold: 0.3,
    frames: [
      { anchor: 'footN', at: [60, 70], torso: -90, neck: -90, armN: [93, 86], armF: [90, 85], legN: [90, 90], legF: [88, 92] },
      { anchor: 'footN', at: [60, 70], torso: -90.5, neck: -90, armN: [94, 86], armF: [91, 85], legN: [90, 90], legF: [88, 92] },
    ],
  },

  // Ronde 4 : crunch et Russian twist (A), planche inversée et touchers d’épaules (B)
  Crunch: {
    dur: 3, loop: 'cycle', hold: 0.1,
    frames: [
      { at: [52, 68.5], torso: 0, neck: -2, armN: [201, -12], armF: [197, -8], legN: { to: [31, 70], bend: 1 }, legF: { to: [33.5, 70], bend: 1 } },
      { at: [52, 68.5], torso: -22, neck: -30, armN: [179, -34], armF: [175, -30], legN: { to: [31, 70], bend: 1 }, legF: { to: [33.5, 70], bend: 1 } },
      { at: [52, 68.5], torso: -23, neck: -31, armN: [178, -35], armF: [174, -31], legN: { to: [31, 70], bend: 1 }, legF: { to: [33.5, 70], bend: 1 } },
    ],
  },
  'Russian twist': {
    dur: 3, loop: 'cycle', hold: 0.1,
    frames: [
      { at: [58, 68.5], torso: -48, neck: -55, armN: { to: [50.6, 53], bend: 1 }, armF: { to: [52.1, 53], bend: -1 }, legN: { to: [38, 70], bend: 1 }, legF: { to: [40.5, 70], bend: 1 } },
      { at: [58, 68.5], torso: -46, neck: -58, armN: { to: [53, 62.5], bend: 1 }, armF: { to: [54.5, 62.5], bend: -1 }, legN: { to: [38, 70], bend: 1 }, legF: { to: [40.5, 70], bend: 1 } },
      { at: [58, 68.5], torso: -48, neck: -55, armN: { to: [50.6, 53], bend: 1 }, armF: { to: [52.1, 53], bend: -1 }, legN: { to: [38, 70], bend: 1 }, legF: { to: [40.5, 70], bend: 1 } },
      { at: [58, 68.5], torso: -46, neck: -52, armN: { to: [59, 67.5], bend: 1 }, armF: { to: [65.5, 68], bend: -1 }, legN: { to: [38, 70], bend: 1 }, legF: { to: [40.5, 70], bend: 1 } },
    ],
  },
  'Planche inversée': {
    dur: 3.5, hold: 0.3,
    frames: [
      { anchor: 'handN', at: [90, 70], torso: -61.83, neck: -74, armN: [65.29, 65.29], armF: { to: [91.5, 70] }, legN: { to: [51.7, 70], bend: 1 }, legF: { to: [53.7, 70], bend: 1 } },
      { anchor: 'handN', at: [90, 70], torso: -13.88, neck: -18, armN: [84, 84], armF: { to: [91.5, 70] }, legN: { to: [51.7, 70], bend: 1 }, legF: { to: [53.7, 70], bend: 1 } },
    ],
  },
  'Toucher d’épaules en planche': {
    dur: 3, loop: 'cycle', hold: 0.2,
    frames: [
      { anchor: 'footN', at: [20, 70], torso: -26.81, neck: -17, armN: [90, 90], armF: [86.3, 86.3], legN: [153.19, 153.19], legF: [154.5, 154.5] },
      { anchor: 'footN', at: [20, 70], torso: -26.81, neck: -17, armN: [132, -36], armF: [86.3, 86.3], legN: [153.19, 153.19], legF: [154.5, 154.5] },
      { anchor: 'footN', at: [20, 70], torso: -26.81, neck: -17, armN: [90, 90], armF: [86.3, 86.3], legN: [153.19, 153.19], legF: [154.5, 154.5] },
      { anchor: 'footN', at: [20, 70], torso: -26.81, neck: -17, armN: [90, 90], armF: [115, -54], legN: [153.19, 153.19], legF: [154.5, 154.5] },
    ],
  },

  // Ronde 5 : crunch vélo (A), pont fessier, superman, extension du cou (M)
  'Crunch vélo': {
    dur: 3, loop: 'cycle', hold: 0.05,
    frames: [
      { at: [52, 68.5], torso: -24, neck: -32, armN: { to: [78.5, 55], bend: -1 }, armF: { to: [79.5, 56], bend: -1 }, legN: [-118, 168], legF: [186, 184] },
      { at: [52, 68.5], torso: -24, neck: -32, armN: { to: [78.5, 55], bend: -1 }, armF: { to: [79.5, 56], bend: -1 }, legN: [186, 184], legF: [-118, 168] },
    ],
  },
  'Pont fessier': {
    dur: 4, hold: 0.25,
    frames: [
      { anchor: 'shoulder', at: [76, 68.5], torso: 0, neck: 0, armN: { to: [58, 70], bend: 1 }, armF: { to: [58.5, 70], bend: 1 }, legN: { to: [40, 70], bend: 1 }, legF: { to: [42, 70], bend: 1 } },
      { anchor: 'shoulder', at: [76, 68.5], torso: 27, neck: 0, armN: { to: [58, 70], bend: 1 }, armF: { to: [58.5, 70], bend: 1 }, legN: { to: [40, 70], bend: 1 }, legF: { to: [42, 70], bend: 1 } },
    ],
  },
  Superman: {
    dur: 5, loop: 'cycle', hold: 0.2,
    frames: [
      { at: [49, 68.5], torso: 0, neck: 0, armN: [4, 4], armF: [2, 2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: -10, neck: -6, armN: [-13, -13], armF: [-9, -9], legN: [190, 190], legF: [188, 188] },
      { at: [49, 68.5], torso: -10.5, neck: -6.5, armN: [-13.5, -13.5], armF: [-9.5, -9.5], legN: [190.5, 190.5], legF: [188.5, 188.5] },
      { at: [49, 68.5], torso: -0.5, neck: 0, armN: [4, 4], armF: [2, 2], legN: [179, 179], legF: [181, 180.5] },
    ],
  },
  'Extension du cou': {
    dur: 5, loop: 'cycle', hold: 0.25,
    frames: [
      { at: [49, 68.5], torso: 0, neck: 10, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: 0, neck: -24, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: 0, neck: -25, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
      { at: [49, 68.5], torso: 0, neck: 9, armN: [176, -3], armF: [178, -2], legN: [179, 179], legF: [181, 180.5] },
    ],
  },

  // Ronde 6 : cardio sans saut (C)
  'Genou-coude croisé debout': {
    dur: 1.6, loop: 'cycle', hold: 0.05,
    frames: [
      { at: [60, 41], torso: -90, neck: -90, armN: [-40, 200], armF: [-44, 204], legN: [90, 90], legF: [88, 92] },
      { at: [60, 41], torso: -76, neck: -70, armN: [-40, 200], armF: [72, -118], legN: [-14, 96], legF: [90, 90] },
      { at: [60, 41], torso: -90, neck: -90, armN: [-40, 200], armF: [-44, 204], legN: [90, 90], legF: [88, 92] },
      { at: [60, 41], torso: -76, neck: -70, armN: [72, -118], armF: [-44, 204], legN: [90, 90], legF: [-14, 96] },
    ],
  },
  // Ronde 7 : anges au sol et étirement des pectoraux (M), burpees sans saut (C)
  'Anges au sol': {
    dur: 5, hold: 0.25,
    frames: [
      { anchor: 'shoulder', at: [76, 68.5], torso: 0, neck: 0, armN: [178, -2], armF: [180, -1], legN: { to: [40, 70], bend: 1 }, legF: { to: [42, 70], bend: 1 } },
      { anchor: 'shoulder', at: [76, 68.5], torso: 0, neck: 0, armN: [-6, -6], armF: [-4, -4], legN: { to: [40, 70], bend: 1 }, legF: { to: [42, 70], bend: 1 } },
    ],
  },
  'Étirement des pectoraux au sol': {
    dur: 6, hold: 0.3,
    frames: [
      { at: [49, 68.5], torso: 0, neck: 0, armN: { to: [64, 70], bend: 1 }, armF: [8, -8], legN: { to: [20.1, 69.8], bend: 1 }, legF: [181, 180.5] },
      { at: [49, 68.5], torso: -8, neck: -20, armN: { to: [66, 70], bend: 1 }, armF: [8, -8], legN: { to: [36, 70], bend: 1 }, legF: [181, 180.5] },
    ],
  },
  // Debout → accroupi, mains au sol → pieds en arrière (bassin haut) → planche,
  // puis retour par le même chemin (genou toujours plié du bon côté).
  'Burpees sans saut': {
    dur: 4, loop: 'cycle', hold: 0.1,
    frames: [
      { at: [60, 41], torso: -90, neck: -88, armN: [-25, -25], armF: [-28, -28], legN: { to: [60, 70], bend: -1 }, legF: { to: [61.5, 70], bend: -1 } },
      { at: [52, 59], torso: -32, neck: -40, armN: [84.3, 102.6], armF: [79.9, 99.4], legN: { to: [60, 70], bend: -1 }, legF: { to: [61.5, 70], bend: -1 } },
      { at: [48, 44], torso: -50, neck: -58, armN: [81.9, 84.3], armF: [80, 82.2], legN: { to: [32, 70], bend: -1 }, legF: { to: [33.5, 70], bend: -1 } },
      { at: [45.84, 56.83], torso: -27, neck: -17, armN: [88.1, 91.6], armF: [84.3, 87.9], legN: { to: [20, 70], bend: 1 }, legF: { to: [21.5, 70], bend: 1 } },
      { at: [48, 44], torso: -50, neck: -58, armN: [81.9, 84.3], armF: [80, 82.2], legN: { to: [32, 70], bend: -1 }, legF: { to: [33.5, 70], bend: -1 } },
      { at: [52, 59], torso: -32, neck: -40, armN: [84.3, 102.6], armF: [79.9, 99.4], legN: { to: [60, 70], bend: -1 }, legF: { to: [61.5, 70], bend: -1 } },
    ],
  },
};
