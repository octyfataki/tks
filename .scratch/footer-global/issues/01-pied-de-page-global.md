Status: ready-for-human

# Pied de page global sur les surfaces publique et d'authentification

Toutes les décisions de conception sont dans `../spec.md`. Ce ticket est le lot
livrable.

## Ce qui change

- Un composant `AppFooter` (serveur) monté dans deux layouts : `(auth)` et
  `(public)`.
- Un footer de trois blocs (identité, liens, contact) et une barre
  copyright / version.
- Deux pages légales : `/legal-notice` et `/privacy`, en gabarit à trous.
- `/pending` perd son `<footer>` local au profit du footer générique.
- `AuthShell` et `/pending` passent en `flex-1` pour que le footer tienne en bas
  du viewport.

## Critères d'acceptation

- [ ] Sur `/sign-in`, `/sign-up`, `/forgot-password`, `/pending`,
      `/legal-notice`, `/privacy`, un `<footer>` est visible sans défilement
      quand la page est courte, et suit le contenu quand la page est longue.
- [ ] Le footer affiche « Connexion », « Créer un compte client »,
      « Mentions légales », « Confidentialité », `contact@tks.cd`, « Kinshasa, RDC »,
      `© TKS <année>` et `version 0.1.0`.
- [ ] Aucun footer sur `/admin/*`, `/agent/*`, `/clients/*`.
- [ ] Le lien « Aide » n'apparaît pas dans le footer.
- [ ] Le rendu est correct en thème clair, en thème sombre et à 390 px de large.
- [ ] `tsc`, `eslint` et `vitest` passent.

## Commandes de vérification

```
pnpm exec tsc --noEmit
pnpm exec eslint src tests
pnpm exec vitest run
```

## Comments

- Ouvert après le grill de cadrage. Sept branches tranchées avec le porteur :
  surfaces, contenu, positionnement, sort du footer de `/pending`, direction
  visuelle, thème, architecture. Deux points ont été signalés comme bloquants
  et corrigés dans le périmètre : le lien « Aide » (boucle vers `/sign-in`) et
  l'absence de pages légales.
