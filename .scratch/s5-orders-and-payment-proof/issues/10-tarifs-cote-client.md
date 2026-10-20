# 10: Les tarifs côté client — le catalogue en lecture seule

**What to build:** Un client `VALIDE` ouvre « Tarifs » dans son espace et voit,
pour les quatre réseaux, le prix du jour des 100 unités d'airtime, le montant
natif, l'équivalent converti au taux du jour, la date du taux et la date de mise
en vigueur. Il ne peut ni modifier, ni commander, ni consulter l'historique. Le
catalogue est une page autonome ; le parcours de commande (ticket 07)
réutilisera la carte et le calcul, sans dupliquer la grille.

**Blocked by:** 01 — La grille tarifaire (livré) ; l'espace client et son garde
`VALIDE` (S1/S2/S4). Indépendant de 02 et 07.

**Status:** ready-for-human

## Critères

- [x] Un compte client `VALIDE` ouvre `/clients/pricing`. Un compte non validé
      est renvoyé vers l'attente par le layout ; un compte staff ne voit pas
      l'espace client.
- [x] La page est accessible par l'entrée « Tarifs » de la sidebar (groupe
      Opérations, avant Commandes), par le fil d'Ariane, par la palette de
      recherche et par une carte-lien sur `/clients`.
- [x] Les quatre réseaux sont affichés dans l'ordre Orange, Airtel, Africell,
      Vodacom, avec leur bannière.
- [x] Chaque carte porte le **prix natif en grand**, la mention « les 100
      unités », l'équivalent précédé de `≈`, et la date de mise en vigueur.
- [x] Le taux du jour et sa date sont affichés. Sans taux, le prix natif reste
      visible, l'équivalent disparaît et un bandeau l'explique.
- [x] Un réseau sans prix garde sa carte, avec « Indisponible » et « Aucun prix
      publié — commande impossible. »
- [x] Aucun nom d'auteur n'est lu ni rendu : le lecteur client ne joint pas les
      comptes staff et ne sélectionne que réseau, montant, devise et date.
- [x] Aucun historique, aucune modification, aucun badge « Sous le taux »,
      aucun bouton de commande.
- [x] La page est rendue à chaque visite, sans cache statique.
- [x] Les cartes sont responsives en 1, 2, 3 puis 4 colonnes et de même hauteur.
- [x] Tests : mapping client sans clé auteur, carte avec et sans prix.
      `pnpm test`, `pnpm lint` et `pnpm exec tsc --noEmit` passent.

## Comments

### 2026-10-20 — interview de cadrage

| Branche | Décision |
| --- | --- |
| Audience | Client connecté et validé, dans `/clients`. Pas de page publique. |
| Contenu | Les quatre cartes seules. Pas d'historique, pas de noms d'auteurs. |
| Montant | Le montant natif en vedette ; l'équivalent est indicatif et marqué `≈`. |
| Réseau sans prix | Carte visible, badge « Indisponible », commande impossible. |
| Taux absent | Prix natif visible, équivalent masqué, bandeau explicatif. |
| Accès | Sidebar (Opérations, avant Commandes) + carte-lien sur l'accueil. |
| URL | `/clients/pricing`, cohérente avec `/admin/pricing`. |
| Hiérarchie | Bannière conservée, prix en grand, équivalent et date en dessous. |
| Pied de carte | Rien : la page est informative. La commande arrive avec le ticket 07. |
| Réutilisation | Le ticket 07 réutilisera la carte et `toClientEntry` pour le prix de la commande. |

**Ce qui reste hors périmètre.** Page publique, historique, calculateur
unités ↔ montant, notifications, commande en ligne, embarquement hors-ligne
(S8). Le calculateur attend l'arrondi du ticket 02.

**Risques assumés.** Le dépôt n'a pas de base de test : l'absence d'auteur se
prouve par les colonnes sélectionnées et l'absence de jointure, pas par un test
SQL. L'état « réseau sans prix » se vérifie sur une base fraîche ou par test de
composant, car la grille est append-only et aucune ligne ne se supprime. Le taux
est strictement celui du jour à Kinshasa : sans lui, aucun équivalent n'est
calculable. Un client validé sans accès à un profil voit les tarifs ; ce ne sont
ni un solde ni un plafond.

### 2026-10-20 — livraison

**Livré.** Page `/clients/pricing`, quatre cartes, lecteur client sans auteur,
note de taux, états sans prix et sans taux, entrée sidebar, fil d'Ariane,
palette de recherche, carte-lien sur `/clients`.

**Fichiers clés.** `src/app/clients/pricing/`,
`src/modules/pricing/read-client.ts`, `src/modules/pricing/format.ts`,
`src/components/network-assets.ts`.

**Vérifications.** `pnpm test` : 75 fichiers, 494 tests passés.
`pnpm exec tsc --noEmit` : aucune erreur. `pnpm lint` : 0 erreur, 2 avertissements
préexistants (`admin/clients/validation/page.tsx`, `nav-main.tsx`). `pnpm build` :
compilation réussie, `/clients/pricing` rendue dynamiquement.

**Reste.** Le test humain du design et des états (réseau sans prix, taux absent)
sur une base fraîche ou un jour sans taux. Aucun merge sans accord.
