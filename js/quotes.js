// Une citation par jour (même citation toute la journée).
import { diffDays } from './logic.js';

export const QUOTES = [
  { text: 'Ce n’est pas parce que les choses sont difficiles que nous n’osons pas, c’est parce que nous n’osons pas qu’elles sont difficiles.', author: 'Sénèque, Lettres à Lucilius' },
  { text: 'Nous souffrons plus souvent en imagination que dans la réalité.', author: 'Sénèque, Lettres à Lucilius' },
  { text: 'Ce n’est pas que nous ayons peu de temps, c’est que nous en perdons beaucoup.', author: 'Sénèque, De la brièveté de la vie' },
  { text: 'Reprends possession de toi-même, et le temps qu’on te prenait, qu’on te dérobait, qui t’échappait, recueille-le et garde-le.', author: 'Sénèque, Lettres à Lucilius' },
  { text: 'Ce qui trouble les hommes, ce ne sont pas les choses, mais les jugements qu’ils portent sur les choses.', author: 'Épictète, Manuel' },
  { text: 'Parmi les choses, les unes dépendent de nous, les autres n’en dépendent pas.', author: 'Épictète, Manuel' },
  { text: 'Ne discute plus sur ce que doit être l’homme de bien, mais sois-le.', author: 'Marc Aurèle, Pensées' },
  { text: 'Au petit jour, quand tu as du mal à te lever, aie cette pensée présente : je me lève pour faire œuvre d’homme.', author: 'Marc Aurèle, Pensées' },
  { text: 'Tout le malheur des hommes vient d’une seule chose, qui est de ne savoir pas demeurer en repos dans une chambre.', author: 'Pascal, Pensées' },
  { text: 'Nous sommes ce que nous faisons de manière répétée. L’excellence n’est donc pas un acte, mais une habitude.', author: 'Will Durant, résumant Aristote' },
  { text: 'On ne s’élève pas au niveau de ses objectifs, on retombe au niveau de ses systèmes.', author: 'James Clear, Un rien peut tout changer' },
  { text: 'Le principal problème de l’investisseur, et même son pire ennemi, est probablement lui-même.', author: 'Benjamin Graham, L’investisseur intelligent' },
  { text: 'Règle n° 1 : ne jamais perdre d’argent. Règle n° 2 : ne jamais oublier la règle n° 1.', author: 'Warren Buffett' },
  { text: 'Le premier principe est de ne pas te tromper toi-même, et tu es la personne la plus facile à tromper.', author: 'Richard Feynman' },
];

export function quoteOfDay(key) {
  const n = diffDays('2026-01-01', key);
  return QUOTES[((n % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
