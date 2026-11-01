// L'école d'échecs de Cap : des leçons pas à pas (le plateau, chaque pièce,
// prendre, l'échec, le mat, le pat, les coups spéciaux, bien commencer, les
// tactiques, le mat avec la dame), chacune avec ses exercices, puis des
// problèmes (mats en un et en deux coups, gains de matériel). Logique pure
// (sans DOM), testée par tests/chess-school.test.js : chaque exercice a sa
// solution, vérifiée par le moteur (chess.js).
import { fromFen, san, make, unmake, legalMoves, status, inCheck, mateIn, typeOf, sqIndex, reach, ROOK, BISHOP, QUEEN, KING, KNIGHT, PAWN } from './chess.js';

// Les exercices :
// - square : touche les cases demandées, dans l'ordre (ask) ;
// - stars : une pièce seule attrape les étoiles (piece : sa sorte, from : sa
//   case, stars : les étoiles, blockers : des cases occupées, best : le moins
//   de coups possible) ;
// - move : un coup dans une position (fen) ; bon si c'est une des réponses
//   (answer, en notation), ou s'il mate (goal 'mate'), ou n'importe quel coup
//   permis (goal 'any') ; goal 'mate2' : mat en deux coups (Cap répond) ;
// - choice : une question, une seule bonne réponse (good), avec sa position (fen) si besoin ;
// - endgame : une finale contre Cap, mate en au plus max coups.
export const LESSONS = [
  {
    id: 'plateau', title: 'Le plateau',
    intro: ['L’échiquier a 64 cases : 8 colonnes, de a à h, et 8 rangées, de 1 à 8.', 'Chaque case a un nom : sa colonne puis sa rangée, comme e4.', 'Les blancs commencent toujours. Ils sont en bas, et la case en bas à droite (h1) est blanche.'],
    steps: [{ type: 'square', text: 'Touche les cases qu’on te demande.', ask: ['e4', 'a1', 'h8', 'd5', 'c7', 'g2'] }],
  },
  {
    id: 'tour', title: 'La tour (5 points)',
    intro: ['La tour avance en ligne droite, aussi loin qu’elle veut : en avant, en arrière, à gauche ou à droite.', 'Elle ne saute jamais par-dessus une pièce.'],
    steps: [
      { type: 'stars', text: 'Attrape les 3 étoiles avec ta tour.', piece: ROOK, from: 'a1', stars: ['a6', 'f6', 'f2'], best: 3 },
      { type: 'stars', text: 'Les pions bloquent le passage : contourne-les.', piece: ROOK, from: 'h8', stars: ['c8', 'c3', 'h3'], blockers: ['e8', 'h5'], best: 5 },
    ],
  },
  {
    id: 'fou', title: 'Le fou (3 points)',
    intro: ['Le fou avance en diagonale, aussi loin qu’il veut.', 'Il reste toute la partie sur la même couleur de case : chaque camp a un fou des cases blanches et un fou des cases noires.'],
    steps: [{ type: 'stars', text: 'Attrape les 3 étoiles avec ton fou (toujours sur des cases noires).', piece: BISHOP, from: 'c1', stars: ['e3', 'f4', 'h6'], best: 3 }],
  },
  {
    id: 'dame', title: 'La dame (9 points)',
    intro: ['La dame, c’est une tour et un fou à la fois : en ligne droite et en diagonale, aussi loin qu’elle veut.', 'C’est la pièce la plus forte. Ne la sors pas trop tôt : l’adversaire gagnerait du temps à la chasser.'],
    steps: [{ type: 'stars', text: 'Attrape les 3 étoiles avec ta dame.', piece: QUEEN, from: 'd1', stars: ['d7', 'h3', 'c8'], best: 3 }],
  },
  {
    id: 'roi', title: 'Le roi',
    intro: ['Le roi avance d’une seule case, dans toutes les directions.', 'C’est la pièce à protéger : s’il est pris au piège, la partie est perdue. Il n’a jamais le droit d’aller sur une case attaquée.'],
    steps: [{ type: 'stars', text: 'Attrape les 3 étoiles avec ton roi, une case à la fois.', piece: KING, from: 'e1', stars: ['e3', 'g4', 'f6'], best: 6 }],
  },
  {
    id: 'cavalier', title: 'Le cavalier (3 points)',
    intro: ['Le cavalier saute en L : deux cases dans un sens, puis une sur le côté.', 'C’est la seule pièce qui saute par-dessus les autres. À chaque saut, il change de couleur de case.'],
    steps: [
      { type: 'stars', text: 'Attrape les 3 étoiles avec ton cavalier.', piece: KNIGHT, from: 'b1', stars: ['c3', 'e4', 'f6'], best: 3 },
      { type: 'stars', text: 'Encore 3 étoiles : saute par-dessus les pions.', piece: KNIGHT, from: 'e4', stars: ['d6', 'b5', 'a7'], blockers: ['d5', 'c5', 'e5'], best: 3 },
    ],
  },
  {
    id: 'pion', title: 'Le pion (1 point)',
    intro: ['Le pion avance tout droit, d’une case (ou de deux, à son tout premier coup). Il ne recule jamais.', 'Mais il prend en diagonale, une case en avant.', 'Arrivé au bout, il se transforme : en dame, presque toujours. C’est la promotion.'],
    steps: [
      { type: 'move', text: 'Ton pion ne peut pas avancer (un pion le bloque). Prends le cavalier.', fen: '6k1/8/8/3np3/4P3/8/8/6K1 w - - 0 1', answer: ['exd5'] },
      { type: 'move', text: 'Avance ton pion jusqu’au bout et choisis la dame.', fen: '7k/1P6/8/8/8/8/8/6K1 w - - 0 1', answer: ['b8=D+'] },
    ],
  },
  {
    id: 'valeurs', title: 'Prendre et défendre',
    intro: ['Chaque pièce a une valeur : pion 1, cavalier 3, fou 3, tour 5, dame 9.', 'Une pièce attaquée et pas défendue est « en prise » : prends-la !', 'Avant de jouer, regarde toujours ce que l’adversaire attaque.'],
    steps: [
      { type: 'choice', text: 'Qu’est-ce qui vaut le plus ?', choices: ['Une tour', 'Un fou et un pion'], good: 0, why: 'La tour vaut 5, le fou et le pion 3 + 1 = 4.' },
      { type: 'move', text: 'Une pièce noire n’est pas défendue. Prends-la sans rien risquer.', fen: '6k1/8/r2p4/4n3/2B5/5N2/8/6K1 w - - 0 1', answer: ['Fxa6'], why: 'Le cavalier e5 est défendu par le pion d6 ; la tour a6, elle, est seule.' },
    ],
  },
  {
    id: 'echec', title: 'L’échec',
    intro: ['Quand une pièce attaque le roi, il est « en échec ». Il faut s’en sortir tout de suite.', 'Trois façons : prendre la pièce qui attaque, mettre une pièce devant, ou bouger le roi.'],
    steps: [
      { type: 'move', text: 'Ton roi est en échec : prends la dame qui l’attaque.', fen: '4k3/8/8/8/4q2R/8/8/4K3 w - - 0 1', answer: ['Txe4'] },
      { type: 'move', text: 'Ton roi ne peut pas bouger : mets une pièce devant.', fen: '6k1/8/8/8/8/8/4BPPP/r6K w - - 0 1', goal: 'any' },
      { type: 'move', text: 'Rien à prendre, rien à mettre devant : bouge ton roi.', fen: '4k3/8/8/8/1b6/8/5PPP/4K3 w - - 0 1', goal: 'any' },
    ],
  },
  {
    id: 'mat', title: 'L’échec et mat',
    intro: ['Échec et mat : le roi est en échec et ne peut plus s’en sortir. La partie est finie, gagnée. C’est le but du jeu !'],
    steps: [
      { type: 'move', text: 'Mat en un coup : le roi noir est enfermé derrière ses pions.', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', goal: 'mate' },
      { type: 'move', text: 'Mat en un coup, avec la dame et le roi.', fen: '7k/Q7/6K1/8/8/8/8/8 w - - 0 1', goal: 'mate' },
      { type: 'move', text: 'Mat en un coup : le cavalier saute, le roi est étouffé par ses propres pièces.', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', goal: 'mate' },
    ],
  },
  {
    id: 'pat', title: 'Le pat',
    intro: ['Attention au pat : si l’adversaire n’est pas en échec mais ne peut plus jouer aucun coup, c’est match nul.', 'Quand tu gagnes, laisse toujours une case à son roi… jusqu’au mat.'],
    steps: [
      { type: 'choice', text: 'C’est aux noirs de jouer. Ils ne sont pas en échec et n’ont plus aucun coup. C’est…', fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', choices: ['Pat : match nul', 'Échec et mat'], good: 0, why: 'Le roi noir n’est pas attaqué : ce n’est pas mat, c’est pat.' },
      { type: 'move', text: 'Mate en un coup, sans faire pat.', fen: '7k/4Q3/6K1/8/8/8/8/8 w - - 0 1', goal: 'mate' },
    ],
  },
  {
    id: 'speciaux', title: 'Les coups spéciaux',
    intro: ['Le roque : une fois par partie, le roi va de deux cases vers une tour, et la tour saute de l’autre côté de lui. Il met le roi à l’abri.', 'On peut roquer si ni le roi ni cette tour n’ont bougé, si les cases entre eux sont vides, et si le roi n’est pas en échec et ne traverse pas une case attaquée.', 'La prise en passant : un pion qui avance de deux cases juste à côté d’un de tes pions peut être pris comme s’il n’avait avancé que d’une case, mais seulement au coup suivant.'],
    steps: [
      { type: 'move', text: 'Fais le petit roque : touche ton roi, puis la case g1.', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', answer: ['O-O'] },
      { type: 'move', text: 'Le pion noir vient d’avancer de deux cases (d7-d5). Prends-le en passant.', fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', answer: ['exd6'] },
    ],
  },
  {
    id: 'ouverture', title: 'Bien commencer une partie',
    intro: ['Trois idées pour bien commencer :', '1. Prends le centre avec tes pions (e4, d4).', '2. Sors tes cavaliers et tes fous, pas ta dame.', '3. Roque tôt, pour mettre ton roi à l’abri. Et ne bouge pas deux fois la même pièce sans raison.'],
    steps: [
      { type: 'choice', text: 'Quel est le meilleur premier coup ?', choices: ['e4 : un pion au centre', 'h4 : un pion sur le bord', 'Dh5 : sortir la dame tout de suite'], good: 0, why: 'Le pion e4 prend le centre et ouvre la route à la dame et au fou.' },
      { type: 'move', text: 'Après 1.e4 e5 : sors une pièce vers le centre.', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', answer: ['Cf3', 'Cc3', 'Fc4', 'Fb5'], why: 'Un cavalier ou un fou qui vise le centre : c’est ça, développer.' },
      { type: 'choice', text: 'Tes cavaliers et tes fous sont sortis, ton roi est encore au milieu. Que fais-tu ?', choices: ['Je roque', 'J’avance les pions devant mon roi', 'Je sors ma dame à l’attaque'], good: 0, why: 'Le roque met le roi à l’abri et amène une tour vers le centre.' },
    ],
  },
  {
    id: 'fourchette', title: 'La fourchette',
    intro: ['Une fourchette : une seule pièce attaque deux pièces adverses en même temps. L’adversaire n’en sauve qu’une.', 'Le cavalier est le roi des fourchettes. Une fourchette avec échec est la plus forte : le roi doit bouger, et l’autre pièce tombe.'],
    steps: [
      { type: 'move', text: 'Fais une fourchette : ton cavalier attaque le roi et la tour.', fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', answer: ['Cc7+'] },
      { type: 'move', text: 'Ta dame aussi peut faire une fourchette : le roi et la tour, d’un seul coup.', fen: 'r5k1/8/8/8/8/8/8/3QK3 w - - 0 1', answer: ['Dd5+'] },
    ],
  },
  {
    id: 'clouage', title: 'Le clouage et l’enfilade',
    intro: ['Le clouage : une pièce ne peut pas bouger, sinon elle découvre une pièce plus précieuse derrière elle. Clouée devant son roi, elle ne peut plus bouger du tout.', 'L’enfilade, c’est l’inverse : tu attaques la grosse pièce devant, elle s’en va, et tu prends celle de derrière.'],
    steps: [
      { type: 'move', text: 'Cloue le cavalier noir contre son roi avec ton fou.', fen: '6k1/5n2/8/8/8/8/8/5BK1 w - - 0 1', answer: ['Fc4'] },
      { type: 'move', text: 'Enfilade : fais échec au roi, et la dame derrière lui tombera.', fen: '8/8/2k2q2/8/8/8/8/R5K1 w - - 0 1', answer: ['Ta6+'] },
    ],
  },
  {
    id: 'finale', title: 'Mater avec la dame',
    intro: ['Avec ta dame et ton roi, tu mates toujours un roi seul.', '1. Ta dame enferme le roi noir, à un saut de cavalier de lui : il recule vers le bord.', '2. Quand il est au bord, ton roi vient aider.', '3. La dame donne le mat, protégée par ton roi. Et surtout : attention au pat !'],
    steps: [{ type: 'endgame', text: 'Mate le roi noir en 20 coups au plus. Cap défend.', fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1', max: 20 }],
  },
];

// Les problèmes : trouve le coup (ou les deux coups) qui gagnent.
export const PUZZLES = [
  { id: 'p1', group: 'Mat en 1', text: 'Le baiser de la dame : mat en un coup.', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', goal: 'mate' },
  { id: 'p2', group: 'Mat en 1', text: 'Le mat du couloir.', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', goal: 'mate' },
  { id: 'p3', group: 'Mat en 1', text: 'L’escalier : deux tours, un mat.', fen: '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1', goal: 'mate' },
  { id: 'p4', group: 'Mat en 1', text: 'Dame et fou contre le petit roque.', fen: '7k/5ppp/8/7Q/8/3B4/5PPP/6K1 w - - 0 1', goal: 'mate' },
  { id: 'p5', group: 'Mat en 1', text: 'Le pion donne le mat.', fen: '7k/5K1p/6P1/8/8/8/8/8 w - - 0 1', goal: 'mate' },
  { id: 'p6', group: 'Mat en 1', text: 'Les noirs jouent et matent.', fen: 'r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', goal: 'mate' },
  { id: 'p7', group: 'Mat en 2', text: 'Deux tours sur la même colonne : mat en deux coups.', fen: '2r3k1/5ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1', goal: 'mate2' },
  { id: 'p8', group: 'Mat en 2', text: 'Sacrifie ta dame, et le cavalier mate.', fen: '4r2k/6pp/7N/3Q4/8/8/8/6K1 w - - 0 1', goal: 'mate2' },
  { id: 'p9', group: 'Mat en 2', text: 'Roi et tour contre roi : un coup d’attente, puis le mat.', fen: '7k/8/5K2/8/8/8/8/R7 w - - 0 1', goal: 'mate2' },
  { id: 'p10', group: 'Gagner du matériel', text: 'Une fourchette qui gagne la dame.', fen: '4k3/8/q7/1N6/8/8/8/4K3 w - - 0 1', answer: ['Cc7+'] },
  { id: 'p11', group: 'Gagner du matériel', text: 'L’enfilade : fais échec avec ton fou, et la tour derrière le roi tombera.', fen: '8/7r/8/8/B3k3/8/8/K7 w - - 0 1', answer: ['Fc2+'] },
  { id: 'p12', group: 'Gagner du matériel', text: 'Prends ce qui est gratuit, et seulement ça : une pièce défendue coûterait ta dame.', fen: '4k3/3n4/8/7b/8/8/8/3Q2K1 w - - 0 1', answer: ['Dxh5'] },
];

const clean = (s) => String(s).replace(/[+#]/g, '');

// Les étoiles qu'une pièce attrape : où elle peut aller (les cases occupées bloquent).
export function starMoves(ex, at) {
  const blockers = new Set((ex.blockers ?? []).map(sqIndex));
  return reach(ex.piece, sqIndex(at), blockers);
}

// Juge un coup sur un exercice « coup » (ou un problème). pos : la position
// avant le coup ; m : le coup (de chess.js). Renvoie { ok, mate } : bon coup,
// et s'il mate.
export function judge(ex, pos, m) {
  const name = san(pos, m);
  make(pos, m);
  const st = status(pos);
  let ok;
  if (ex.goal === 'any') ok = true;
  else if (ex.goal === 'mate') ok = st === 'mat';
  else if (ex.goal === 'mate2') ok = st === 'mat' || (legalMoves(pos).length > 0 && legalMoves(pos).every((r) => { make(pos, r); const x = mateIn(pos, 1); unmake(pos); return x; }));
  else ok = (ex.answer ?? []).map(clean).includes(clean(name));
  unmake(pos);
  return { ok, mate: st === 'mat', san: name };
}

// Une position d'exercice, prête à jouer.
export const exercisePos = (ex) => fromFen(ex.fen);

// Pour un exercice « endgame » ou « mate2 » : la réponse de Cap (il défend
// au mieux : il retarde le mat le plus possible, sinon il prend ce qu'il peut).
export function defend(pos, pick = (moves) => moves[0]) {
  const moves = legalMoves(pos);
  if (!moves.length) return null;
  const safe = moves.filter((r) => { make(pos, r); const x = !mateIn(pos, 1); unmake(pos); return x; });
  return pick(safe.length ? safe : moves);
}

export { inCheck, typeOf, PAWN };
