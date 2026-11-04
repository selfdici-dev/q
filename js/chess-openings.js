// Les ouvertures : quatre débuts de partie à apprendre coup par coup, deux
// avec les blancs, deux avec les noirs. Tu joues tes coups, Cap joue ceux de
// l'adversaire ; chacun de tes coups a sa raison, dite simplement.
// line : la suite des coups (notation française) ; why : la raison de chacun
// de tes coups, dans l'ordre. Logique pure (sans DOM), testée par
// tests/chess-openings.test.js (chaque suite est jouable jusqu'au bout).
export const OPENINGS = [
  {
    id: 'italienne', name: 'Partie italienne', color: 'w',
    intro: 'La plus classique : le centre, des pièces qui sortent vite, le fou qui vise f7 (le point faible des noirs), puis le roque.',
    line: ['e4', 'e5', 'Cf3', 'Cc6', 'Fc4', 'Fc5', 'c3', 'Cf6', 'd3', 'd6', 'O-O'],
    why: [
      'Un pion au centre : il ouvre la route à ta dame et à ton fou.',
      'Le cavalier sort vers le centre et attaque le pion e5.',
      'Le fou vise f7, que seul le roi noir protège.',
      'Tu prépares d4, pour prendre tout le centre plus tard.',
      'Solide : d3 protège e4 et libère ton autre fou.',
      'Le roi à l’abri, et ta tour vient vers le centre.',
    ],
  },
  {
    id: 'londres', name: 'Système de Londres', color: 'w',
    intro: 'Toujours les mêmes coups, quoi que fassent les noirs : facile à retenir et très solide.',
    line: ['d4', 'd5', 'Ff4', 'Cf6', 'e3', 'e6', 'Cf3', 'c5', 'c3', 'Cc6', 'Cbd2', 'Fd6', 'Fg3', 'O-O', 'Fd3'],
    why: [
      'Un pion au centre, déjà protégé par ta dame.',
      'Le fou sort avant e3 (sinon il resterait enfermé derrière tes pions) : c’est l’idée du Londres.',
      'Solide : e3 soutient d4 et ouvre la route à ton autre fou.',
      'Le cavalier vers le centre, il surveille e5.',
      'Une chaîne de pions solide : d4 ne tombera pas.',
      'L’autre cavalier sort, sans boucher ton pion c.',
      'Le fou recule plutôt que de se laisser échanger.',
      'Ton dernier fou sort : tu es prêt à roquer.',
    ],
  },
  {
    id: 'scandinave', name: 'Défense scandinave', color: 'b',
    intro: 'Contre 1.e4 : tu attaques le centre dès le premier coup, et ta dame sort tôt mais au bon endroit.',
    line: ['e4', 'd5', 'exd5', 'Dxd5', 'Cc3', 'Da5', 'd4', 'Cf6', 'Cf3', 'Ff5', 'Fc4', 'e6'],
    why: [
      'Tu attaques tout de suite le pion e4 : c’est la Scandinave.',
      'Tu reprends le pion avec ta dame.',
      'Attaquée par le cavalier, ta dame file en a5 : à l’abri, et elle vise le cavalier c3.',
      'Un cavalier vers le centre, qui protège aussi ton roi.',
      'Le fou sort avant e6, pour ne pas rester enfermé.',
      'Solide : e6 ouvre la route à ton autre fou et prépare le roque.',
    ],
  },
  {
    id: 'gambit-dame', name: 'Gambit dame refusé', color: 'b',
    intro: 'Contre 1.d4 : les blancs t’offrent un pion (c4), tu le refuses et tu construis un centre solide.',
    line: ['d4', 'd5', 'c4', 'e6', 'Cc3', 'Cf6', 'Fg5', 'Fe7', 'e3', 'O-O', 'Cf3', 'Cbd7'],
    why: [
      'Un pion au centre, face à d4.',
      'Tu refuses le pion offert : e6 soutient d5, ton centre tient.',
      'Un cavalier vers le centre, il surveille e4.',
      'Le fou s’interpose : ton cavalier n’est plus cloué devant ta dame.',
      'Ton roi à l’abri, ta tour vers le centre.',
      'L’autre cavalier sort, sans gêner ton pion c.',
    ],
  },
];

// À qui de jouer au demi-coup k (0 : le premier coup, celui des blancs).
export const sideAt = (k) => (k % 2 ? 'b' : 'w');
// Le numéro de ton coup (dans why) au demi-coup k, ou -1 si c'est un coup de Cap.
export function whyIndex(op, k) {
  if (sideAt(k) !== op.color) return -1;
  return op.color === 'w' ? k / 2 : (k - 1) / 2;
}
