// Parcours finance : du débutant au trading. Chaque leçon = une idée, un exemple,
// un exercice concret, un quiz (2/3 pour valider). Chiffres fiscaux : France, 2026.
// À revérifier chaque année sur impots.gouv.fr et amf-france.org.

export const UNITS = [
  {
    id: 'u1',
    title: 'Les bases',
    emoji: '🧱',
    lessons: [
      {
        id: 'precaution',
        title: 'L’épargne de précaution',
        idea: 'Avant d’investir, garde de côté de quoi vivre 3 mois sans revenu, sur un livret disponible à tout moment (Livret A, LDDS). Cet argent ne sert pas à rapporter : il sert à ne jamais devoir vendre tes placements au pire moment.',
        example: 'Tu as 2 914 €. Si ta dépense mensuelle est de 300 €, ta réserve est de 900 €. Si ton PEA perd 30 % et qu’en même temps tu as besoin de 500 € pour un permis ou une réparation, la réserve t’évite de vendre à perte.',
        exercise: 'Calcule tes dépenses réelles d’un mois (abonnements, sorties, nourriture hors maison). Multiplie par 3. Compare avec ce que tu as sur un livret. Note les deux chiffres dans le bilan de la semaine.',
        quiz: [
          { q: 'À quoi sert l’épargne de précaution ?', a: ['À rapporter le plus possible', 'À ne pas devoir vendre ses placements en urgence', 'À payer moins d’impôts'], c: 1, why: 'Son rôle est la disponibilité, pas le rendement.' },
          { q: 'Où la placer ?', a: ['Sur un livret disponible (Livret A, LDDS)', 'Sur des actions Micron', 'Sur un PEA'], c: 0, why: 'Il faut pouvoir la retirer à tout moment, sans risque de perte.' },
          { q: 'Combien viser en règle générale ?', a: ['1 semaine de dépenses', '3 à 6 mois de dépenses', '5 ans de dépenses'], c: 1, why: '3 à 6 mois est la règle habituelle. Tu vis chez tes parents, donc 3 mois suffit pour commencer.' },
        ],
      },
      {
        id: 'composes',
        title: 'Les intérêts composés',
        idea: 'Tes gains produisent eux-mêmes des gains. Sur longtemps, l’effet devient énorme. Le facteur le plus puissant n’est pas le montant, c’est la durée.',
        example: '100 € par mois à 7 % par an (moyenne historique plausible des actions mondiales, sans aucune garantie) : environ 17 300 € après 10 ans pour 12 000 € versés, et environ 122 000 € après 30 ans pour 36 000 € versés.',
        exercise: 'Ouvre la calculatrice « Intérêts composés » plus bas. Compare 50 € par mois pendant 40 ans et 100 € par mois pendant 20 ans. Qu’est-ce qui gagne ?',
        quiz: [
          { q: 'Règle de 72 : à 7 % par an, en combien de temps un capital double-t-il environ ?', a: ['7 ans', '10 ans', '20 ans'], c: 1, why: '72 ÷ 7 ≈ 10 ans.' },
          { q: 'Quel est le facteur le plus puissant ?', a: ['Le montant de départ', 'La durée', 'Le nombre d’actions différentes'], c: 1, why: 'L’effet composé s’accélère avec le temps : commencer à 19 ans est un énorme avantage.' },
          { q: 'Un rendement de 7 % par an est-il garanti ?', a: ['Oui, c’est la moyenne', 'Non, c’est une moyenne historique, avec des années à −30 %'], c: 1, why: 'Une moyenne passée n’est jamais une promesse.' },
        ],
      },
      {
        id: 'inflation',
        title: 'L’inflation et le rendement réel',
        idea: 'L’inflation réduit ce que ton argent permet d’acheter. Le vrai rendement, c’est le rendement moins l’inflation. Un compte courant à 0 % perd de la valeur chaque année.',
        example: 'En France, l’inflation a été d’environ 5 % par an en 2022 et 2023. 1 000 € sur un compte courant achetaient environ 10 % de choses en moins deux ans plus tard.',
        exercise: 'Cherche sur insee.fr l’inflation des 12 derniers mois et le taux actuel du Livret A. Calcule le rendement réel du Livret A.',
        quiz: [
          { q: 'Placement à 3 %, inflation à 2 % : rendement réel ?', a: ['5 %', '3 %', 'Environ 1 %'], c: 2, why: 'Rendement réel ≈ rendement − inflation.' },
          { q: 'De l’argent qui dort sur un compte courant…', a: ['garde sa valeur', 'perd du pouvoir d’achat', 'prend de la valeur'], c: 1, why: '0 % moins l’inflation donne un rendement réel négatif.' },
          { q: 'Pourquoi investir en actions sur le long terme ?', a: ['Pour battre l’inflation', 'Parce que c’est sans risque', 'Pour éviter les impôts'], c: 0, why: 'Les actions ont historiquement battu l’inflation sur longue période, avec beaucoup de volatilité.' },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'Investir',
    emoji: '🌱',
    lessons: [
      {
        id: 'produits',
        title: 'Actions, obligations, ETF',
        idea: 'Une action est un morceau d’entreprise. Une obligation est un prêt à une entreprise ou un État. Un ETF est un panier coté qui réplique un indice : CW8 réplique le MSCI World, soit environ 1 400 grandes entreprises de 23 pays développés.',
        example: 'Avec une seule part de CW8, tu possèdes un petit bout d’Apple, de Microsoft, de Nvidia, de Nestlé… Avec une action Micron, tout dépend d’une seule entreprise et d’un seul secteur : la mémoire informatique, très cyclique.',
        exercise: 'Va sur justetf.com, cherche « CW8 » (Amundi MSCI World Swap). Note les frais annuels (TER), le nombre de lignes et les 3 pays les plus représentés.',
        quiz: [
          { q: 'Un ETF MSCI World, c’est…', a: ['Une seule entreprise américaine', 'Un panier qui réplique un indice mondial', 'Un livret garanti'], c: 1, why: 'L’ETF suit un indice : la diversification est intégrée.' },
          { q: 'Le plus risqué, à montant égal ?', a: ['Une seule action', 'Un ETF MSCI World', 'Un Livret A'], c: 0, why: 'Une seule entreprise peut perdre 50 % ou plus ; c’est arrivé plusieurs fois à Micron.' },
          { q: 'CW8 est « synthétique » (swap). Pourquoi c’est utile en France ?', a: ['Il est garanti', 'Il est éligible au PEA tout en suivant un indice mondial', 'Il n’a pas de frais'], c: 1, why: 'Le swap permet de répliquer le monde entier dans une enveloppe réservée aux actions européennes.' },
        ],
      },
      {
        id: 'enveloppes',
        title: 'Les enveloppes : PEA, CTO, Livret A, assurance vie',
        idea: 'L’enveloppe, c’est le compte qui contient tes placements. Elle décide des impôts. PEA : après 5 ans, les gains ne paient pas d’impôt sur le revenu (seulement 18,6 % de prélèvements sociaux). Compte-titres (CTO, ex. Trade Republic) : 31,4 % de flat tax en 2026 sur chaque gain réalisé.',
        example: 'Le PEA n’est PAS bloqué 5 ans : tu peux retirer à tout moment. Avant 5 ans, un retrait ferme le plan (sauf exceptions) et les gains sont taxés comme sur un CTO. Après 5 ans, tu retires librement, avec l’avantage fiscal. Les 5 ans sont un compteur qui tourne dès l’ouverture : ton PEA Fortuneo a déjà commencé à compter. Conclusion : « le PEA est trop long et peu rentable » est faux. La rentabilité dépend de ce qu’il contient, pas de l’enveloppe. En revanche, Micron (action américaine) n’y est pas éligible : il reste sur le CTO.',
        exercise: 'Retrouve la date d’ouverture de ton PEA dans l’appli Fortuneo. Calcule la date de ses 5 ans et note-la. Vérifie le type d’IBAN de ton compte Trade Republic (FR ou DE) : ça change ta déclaration.',
        quiz: [
          { q: 'Peut-on retirer de l’argent d’un PEA avant 5 ans ?', a: ['Non, c’est bloqué', 'Oui, mais ça ferme le plan (sauf exceptions)'], c: 1, why: 'L’argent est disponible ; c’est l’avantage fiscal qui demande 5 ans.' },
          { q: 'Après 5 ans, les gains d’un PEA paient…', a: ['31,4 %', '18,6 % de prélèvements sociaux seulement', 'Rien du tout'], c: 1, why: 'Exonération d’impôt sur le revenu, mais les prélèvements sociaux restent dus.' },
          { q: 'Où peut-on détenir une action Micron ?', a: ['PEA', 'Compte-titres (CTO)', 'Livret A'], c: 1, why: 'Le PEA est réservé aux actions européennes (et aux ETF éligibles comme CW8).' },
        ],
      },
      {
        id: 'frais',
        title: 'Les frais, ennemis silencieux',
        idea: 'Les frais se composent comme les gains, mais contre toi. Il y a 4 types de frais : les frais de l’ETF (TER, annuels), le courtage (à chaque ordre), le change (euro ↔ dollar) et le spread (écart entre prix d’achat et de vente).',
        example: 'Sur 30 ans avec 100 € par mois à 7 %, passer de 0,2 % à 2 % de frais annuels coûte plus de 30 000 €. Un aller-retour à 1 € sur une ligne de 50 € coûte 4 %, et il faut déjà gagner 4 % pour revenir à zéro.',
        exercise: 'Regarde la grille tarifaire de Fortuneo et de Trade Republic : courtage par ordre, frais de change. Calcule ce que coûte un aller-retour (achat et vente) sur 100 € de Micron.',
        quiz: [
          { q: 'Le TER d’un ETF, c’est…', a: ['Un frais à chaque achat', 'Un frais annuel prélevé dans le prix de l’ETF', 'Un impôt'], c: 1, why: 'Il est invisible mais prélevé en continu.' },
          { q: 'Pourquoi le trading fréquent sur de petits montants coûte cher ?', a: ['Les frais fixes pèsent lourd en %', 'Les impôts sont plus élevés', 'Ce n’est pas le cas'], c: 0, why: '1 € sur 50 €, c’est 2 % ; sur 1 000 €, c’est 0,1 %.' },
          { q: 'Le spread, c’est…', a: ['L’écart entre prix d’achat et de vente', 'Un dividende', 'Les frais de tenue de compte'], c: 0, why: 'Tu le paies à chaque aller-retour, surtout sur les titres peu échangés.' },
        ],
      },
      {
        id: 'risque',
        title: 'Le risque et la diversification',
        idea: 'Le risque, c’est la profondeur et la durée des chutes. Le MSCI World a perdu environ 50 % en 2008-2009, et une action seule peut perdre 80 %. Diversifier, c’est réduire le risque spécifique à une entreprise. La question clé : combien peux-tu voir baisser sans vendre ?',
        example: 'Micron a perdu plus de 50 % à plusieurs reprises (2018-2019, 2022) parce que le prix de la mémoire est cyclique. Un ETF mondial a aussi baissé en 2022, mais beaucoup moins.',
        exercise: 'Sur TradingView ou Boursorama, affiche le graphique de Micron (MU) sur 10 ans et celui du MSCI World. Note la pire chute de chacun.',
        quiz: [
          { q: 'Une perte de 50 % demande quel gain pour revenir à zéro ?', a: ['+50 %', '+100 %', '+25 %'], c: 1, why: '100 € → 50 € : il faut doubler pour revenir à 100 €.' },
          { q: 'La diversification réduit surtout…', a: ['Le risque propre à une entreprise', 'Tous les risques', 'Les impôts'], c: 0, why: 'Elle ne protège pas d’une crise mondiale, mais d’une faillite isolée.' },
          { q: 'Le bon « montant risqué » est celui…', a: ['qui rapporte le plus', 'que tu peux voir baisser de 50 % sans vendre', 'que conseille un influenceur'], c: 1, why: 'Ton comportement pendant la baisse compte plus que le produit choisi.' },
        ],
      },
    ],
  },
  {
    id: 'u3',
    title: 'Analyser',
    emoji: '🔍',
    lessons: [
      {
        id: 'resultats',
        title: 'Lire les résultats d’une entreprise (méthode Micron)',
        idea: 'Chaque trimestre, l’entreprise publie ses résultats et ses prévisions. Méthode en 6 points : 1) chiffre d’affaires et croissance sur un an, 2) marge brute (pour Micron, c’est le thermomètre du cycle de la mémoire), 3) bénéfice par action (BPA), 4) trésorerie disponible (free cash flow) et dette, 5) stocks (s’ils gonflent, les prix vont baisser), 6) prévisions (« guidance ») pour le trimestre suivant.',
        example: 'Micron publie environ toutes les 13 semaines (son exercice se termine fin août ou début septembre). Le cours bouge surtout selon les prévisions comparées à ce que le marché attendait (le « consensus »), pas selon le résultat passé. Un bon trimestre avec des prévisions décevantes peut faire chuter l’action. Attention : le chiffre « ajusté » (non-GAAP) exclut certains coûts, comme les rémunérations en actions.',
        exercise: 'Sur investors.micron.com, ouvre le dernier communiqué de résultats. Remplis ces 6 lignes : CA, croissance sur un an, marge brute, BPA, prévision de CA pour le trimestre suivant, part de la DRAM et de la HBM. Écris ensuite 3 lignes : qu’est-ce qui a surpris le marché ?',
        quiz: [
          { q: 'Qu’est-ce qui fait le plus bouger le cours le jour des résultats ?', a: ['Le CA passé', 'Les prévisions comparées aux attentes', 'Le nombre de salariés'], c: 1, why: 'Le marché regarde l’avenir : c’est l’écart avec le consensus qui compte.' },
          { q: 'Pour Micron, une marge brute qui baisse plusieurs trimestres de suite signale…', a: ['un cycle de la mémoire qui se retourne', 'une hausse certaine', 'rien du tout'], c: 0, why: 'La marge suit les prix de la DRAM et de la NAND.' },
          { q: 'Des stocks qui gonflent fortement, c’est…', a: ['plutôt un signal d’alerte', 'toujours une bonne nouvelle'], c: 0, why: 'Des stocks qui s’accumulent annoncent souvent des baisses de prix.' },
        ],
      },
      {
        id: 'valorisation',
        title: 'Valorisation et piège des cycliques',
        idea: 'Le PER (cours ÷ bénéfice par action) dit combien tu paies pour 1 € de bénéfice. Pour une entreprise cyclique comme Micron, c’est un piège : au sommet du cycle, les bénéfices sont énormes, donc le PER paraît bas, juste avant que les bénéfices ne s’effondrent.',
        example: 'Peter Lynch : acheter un cyclique quand son PER est bas est souvent une erreur, car il est bas parce que les bénéfices sont au plus haut. Pour Micron, on regarde plutôt le cours divisé par la valeur comptable par action et la position dans le cycle des prix de la mémoire.',
        exercise: 'Trouve le PER actuel de Micron et sa moyenne sur 5 ans (sur Zonebourse ou Boursorama). Dans quelle phase du cycle penses-tu être ? Écris-le comme une hypothèse, pas comme une certitude.',
        quiz: [
          { q: 'Un PER de 10, c’est…', a: ['10 € payés pour 1 € de bénéfice annuel', '10 % de rendement garanti'], c: 0, why: 'PER = cours ÷ bénéfice par action.' },
          { q: 'Cyclique au sommet du cycle : le PER paraît…', a: ['très élevé', 'trompeusement bas'], c: 1, why: 'Les bénéfices exceptionnels font baisser le PER juste avant le retournement.' },
          { q: 'Une bonne analyse distingue…', a: ['faits, hypothèses et opinions', 'rien, il faut suivre son intuition'], c: 0, why: 'Écris ce qui est mesuré, ce que tu supposes, et ce que tu penses.' },
        ],
      },
      {
        id: 'graphiques',
        title: 'Lire un graphique (sans magie)',
        idea: 'Un graphique montre ce que les gens ont fait, pas ce qu’ils vont faire. Les outils utiles : la tendance (des sommets et des creux de plus en plus hauts ou de plus en plus bas), les zones de support et de résistance, le volume, et la moyenne mobile sur 200 jours. Aucun indicateur ne prédit l’avenir de façon fiable.',
        example: 'Sur TradingView, ajoute la moyenne mobile sur 200 jours sur Micron. Quand le cours est en dessous depuis longtemps, la tendance de fond est baissière. Ce n’est pas un signal d’achat ni de vente, c’est un contexte.',
        exercise: 'Crée un compte gratuit TradingView. Trace sur MU (graphique hebdomadaire) 2 supports, 2 résistances et la moyenne mobile 200 jours. Fais une capture et note ce que tu observes.',
        quiz: [
          { q: 'Un graphique permet de…', a: ['prédire le cours de demain', 'situer le contexte et des niveaux de prix'], c: 1, why: 'C’est un outil de contexte et de gestion du risque, pas une boule de cristal.' },
          { q: 'Une tendance haussière, c’est…', a: ['des sommets et des creux de plus en plus hauts', 'un cours qui monte un jour'], c: 0, why: 'La tendance se lit sur une suite de points, pas sur une bougie.' },
          { q: 'Le volume sert à…', a: ['mesurer la conviction derrière un mouvement', 'calculer les impôts'], c: 0, why: 'Une cassure avec un fort volume est plus significative.' },
        ],
      },
    ],
  },
  {
    id: 'u4',
    title: 'Trader',
    emoji: '⚔️',
    lessons: [
      {
        id: 'ordres',
        title: 'Les ordres et leurs pièges',
        idea: 'L’ordre « au marché » s’exécute tout de suite au prix disponible. L’ordre « à cours limité » s’exécute à ton prix ou mieux. L’ordre « stop » se déclenche si le cours franchit un seuil, puis devient un ordre au marché. Piège : le « gap », quand l’action ouvre loin de la clôture de la veille, souvent après des résultats.',
        example: 'Micron cote aux États-Unis. Si tu passes un ordre au marché pendant que la bourse de New York est fermée, tu achètes sur une plateforme européenne avec un spread souvent plus large. Un stop à −8 % peut s’exécuter à −15 % si le titre ouvre en gap après ses résultats.',
        exercise: 'Dans ton journal simulé, n’utilise que des ordres à cours limité pendant 10 trades. Note pour chacun l’heure de passage de l’ordre (pendant ou hors des heures de cotation américaines : 15 h 30 – 22 h, heure de Paris).',
        quiz: [
          { q: 'Un ordre à cours limité…', a: ['garantit l’exécution', 'garantit le prix maximum payé'], c: 1, why: 'Prix garanti, exécution non garantie.' },
          { q: 'Un gap à l’ouverture peut…', a: ['faire exécuter ton stop bien plus bas que prévu', 'annuler ton ordre'], c: 0, why: 'Le stop devient un ordre au marché au premier prix disponible.' },
          { q: 'Heures de cotation de Micron à New York (heure de Paris) ?', a: ['9 h – 17 h 30', '15 h 30 – 22 h'], c: 1, why: 'Hors de ces heures, la liquidité est plus faible et le spread plus large.' },
        ],
      },
      {
        id: 'risque-trade',
        title: 'Gestion du risque : la règle du 1 %',
        idea: 'Avant d’entrer, tu décides où tu sors si tu as tort (le stop). Ne risque jamais plus de 1 à 2 % de ton capital de trading par trade. Taille de la position = (capital × % de risque) ÷ (prix d’entrée − stop). On appelle « 1R » le montant risqué.',
        example: 'Capital de trading 500 €, risque 1 % = 5 €. Entrée à 100 $, stop à 92 $ : risque de 8 $ par action, donc 5 ÷ 8 = 0,6 action (Trade Republic permet les fractions). Avec 10 pertes d’affilée, tu perds environ 10 %, pas 100 %.',
        exercise: 'Utilise la calculatrice « Taille de position » pour 3 trades imaginaires. Constate que la taille dépend du stop, pas de ton envie.',
        quiz: [
          { q: 'Capital 1 000 €, risque 1 %, entrée 50, stop 45. Taille ?', a: ['2 actions', '20 actions', '10 actions'], c: 0, why: '10 € ÷ 5 = 2 actions.' },
          { q: 'Le stop se décide…', a: ['avant d’entrer', 'quand on perd déjà'], c: 0, why: 'Après, les émotions décident à ta place.' },
          { q: 'Avec 1 % de risque par trade, 10 pertes d’affilée coûtent environ…', a: ['10 %', '50 %', '100 %'], c: 0, why: 'C’est ce qui te permet de survivre aux séries de pertes, qui arrivent toujours.' },
        ],
      },
      {
        id: 'psycho',
        title: 'Psychologie, statistiques et journal',
        idea: 'La plupart des traders particuliers perdent. L’AMF a mesuré qu’environ 89 % des particuliers perdaient de l’argent sur le Forex, et une étude brésilienne a trouvé que 97 % des day traders persistants perdaient. Les ennemis : la peur de rater (FOMO), vouloir se refaire après une perte, couper les gains trop tôt et laisser courir les pertes.',
        example: 'Un trader qui gagne 40 % de ses trades peut être rentable si ses gains moyens valent 2R et ses pertes 1R. L’espérance par trade = 0,4 × 2 − 0,6 × 1 = +0,2R. Le taux de réussite seul ne veut rien dire.',
        exercise: 'Pour chaque trade simulé, écris AVANT d’entrer : la thèse, l’entrée, le stop, l’objectif. Après la sortie, écris : as-tu respecté le plan ? Le journal calcule ton espérance.',
        quiz: [
          { q: '40 % de gagnants, gain moyen 2R, perte moyenne 1R : espérance ?', a: ['Négative', '+0,2R par trade', '+0,4R par trade'], c: 1, why: '0,4 × 2 − 0,6 × 1 = 0,2.' },
          { q: '« Revenge trading », c’est…', a: ['reprendre un trade plus gros pour se refaire', 'copier un autre trader'], c: 0, why: 'C’est la façon la plus rapide de vider un compte.' },
          { q: 'Ce qui compte dans un journal…', a: ['seulement les gains', 'le respect du plan, même sur les trades perdants'], c: 1, why: 'Un trade perdant bien exécuté est un bon trade.' },
        ],
      },
      {
        id: 'fiscalite',
        title: 'La fiscalité du trading en France',
        idea: 'Sur un compte-titres, plus-values et dividendes sont soumis à la flat tax de 31,4 % en 2026 (12,8 % d’impôt et 18,6 % de prélèvements sociaux). Les moins-values se déduisent des plus-values de la même année, puis des 10 années suivantes. Les dividendes américains subissent une retenue à la source aux États-Unis, en partie déductible.',
        example: 'Trade Republic fournit un Imprimé Fiscal Unique (IFU) à reporter sur ta déclaration (formulaires 2042 et 2074). Si ton compte a un IBAN allemand (DE), tu dois en plus le déclarer comme compte à l’étranger (formulaire 3916). Avec un IBAN français (FR), ce n’est plus nécessaire.',
        exercise: 'Vérifie ton IBAN Trade Republic. Note dans ton bilan les formulaires que tu devras remplir au printemps prochain. Pense à l’option du barème progressif : si ton revenu est faible, elle peut être plus avantageuse que le taux de 12,8 %. Vérifie avec le simulateur d’impots.gouv.fr.',
        quiz: [
          { q: 'Flat tax sur un compte-titres en 2026 ?', a: ['30 %', '31,4 %', '18,6 %'], c: 1, why: 'Elle est passée de 30 % à 31,4 % avec la hausse de la CSG.' },
          { q: 'Une moins-value non utilisée…', a: ['est perdue', 'est reportable sur 10 ans'], c: 1, why: 'Elle réduira tes futures plus-values.' },
          { q: 'Compte Trade Republic avec IBAN DE :', a: ['rien à déclarer', 'déclarer le compte (3916) et les revenus'], c: 1, why: 'Ne pas déclarer un compte à l’étranger expose à une amende.' },
        ],
      },
      {
        id: 'plan',
        title: 'Plan de trading et passage au réel',
        idea: 'Tu passes au réel seulement quand ces 3 conditions sont réunies : 30 trades simulés notés dans le journal, une espérance positive, et des règles respectées sur au moins 90 % des trades. Le capital de trading reste limité (par exemple 10 % de tes placements). Le reste est investi à long terme (ETF sur le PEA) et on n’y touche pas.',
        example: 'Plan type : uniquement des actions que tu as analysées (leçon 8), 1 % de risque, stop systématique, au maximum 3 positions ouvertes, aucun trade dans les 2 jours avant des résultats, revue chaque dimanche. Si tu perds 15 % du capital de trading, tu arrêtes un mois et tu reviens en simulation.',
        exercise: 'Écris ton plan de trading en 10 lignes maximum dans le bilan de la semaine. Relis-le avant chaque trade simulé.',
        quiz: [
          { q: 'Quand passer au réel ?', a: ['Après un gros gain en simulation', 'Après 30 trades simulés, une espérance positive et des règles respectées'], c: 1, why: 'Un gros gain peut être de la chance ; 30 trades donnent un début de statistique.' },
          { q: 'Le capital de trading devrait être…', a: ['tout ton argent', 'une petite part que tu peux perdre'], c: 1, why: 'Le cœur du patrimoine reste investi à long terme.' },
          { q: 'Après −15 % sur le capital de trading :', a: ['doubler la mise pour se refaire', 'pause et retour en simulation'], c: 1, why: 'Une règle d’arrêt écrite à l’avance protège de toi-même.' },
        ],
      },
    ],
  },
];

export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons);

export const RESOURCES = [
  { name: 'AMF – Épargne Info Service', url: 'https://www.amf-france.org/fr/espace-epargnants', why: 'Le régulateur : arnaques à éviter, liste noire des sites non autorisés.' },
  { name: 'La finance pour tous', url: 'https://www.lafinancepourtous.com', why: 'Cours gratuits et neutres (Institut pour l’éducation financière du public).' },
  { name: 'justETF', url: 'https://www.justetf.com/fr/', why: 'Comparer les ETF : frais, éligibilité au PEA, composition.' },
  { name: 'TradingView', url: 'https://fr.tradingview.com', why: 'Graphiques gratuits et compte de trading simulé (paper trading).' },
  { name: 'Micron – Relations investisseurs', url: 'https://investors.micron.com', why: 'Résultats trimestriels, présentations, conférences téléphoniques.' },
  { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar/search/', why: 'Rapports officiels américains (10-K, 10-Q), la source primaire.' },
  { name: 'Zonebourse', url: 'https://www.zonebourse.com', why: 'Consensus des analystes, PER, historique des résultats.' },
  { name: 'impots.gouv.fr', url: 'https://www.impots.gouv.fr', why: 'Simulateur d’impôt et formulaires (2074, 3916).' },
];
