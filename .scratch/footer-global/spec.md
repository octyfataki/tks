Status: ready-for-human

# Pied de page global

Un pied de page unique, présent sur les surfaces publiques et d'authentification,
qui identifie le produit, donne la version, et rend les pages légales
accessibles sans compte.

## Problème

Le projet n'avait aucun pied de page, sauf un `<footer>` local à `/pending`
(une note de réassurance métier). Une page de connexion sans mention de
version, sans contact et sans accès aux mentions légales ne dit pas qui édite
le service ni dans quelle version on se trouve. À l'inverse, les espaces
authentifiés ont déjà une sidebar avec son propre pied : y ajouter un footer
serait un doublon visuel.

## Périmètre

Surfaces couvertes :

- groupe de routes `(auth)` : `/sign-in`, `/sign-up`, `/forgot-password`,
  `/verify-2fa`, `/pending`, `/invite/[token]`, `/first-access/[token]` ;
- groupe de routes `(public)` : `/legal-notice`, `/privacy`.

Surfaces exclues, volontairement :

- `admin/`, `agent/`, `clients/` — la sidebar porte déjà l'identité et le
  compte ; un second pied de page nuirait à la densité de travail ;
- pages d'aide et d'erreur (`/help`, `not-found`, `error`, `global-error`).

## Décisions

### Contenu

Trois blocs sur une ligne : identité (logo, baseline « Crédit airtime en RDC »),
liens, contact. Une barre de bas de footer porte `© TKS <année courante>` et la
version de l'application.

Liens retenus : Connexion, Créer un compte client, Mentions légales,
Confidentialité. **Le lien « Aide » est exclu** : `/help` redirige un visiteur
anonyme vers `/sign-in` (`destinationAide`), donc un lien « Aide » dans le
footer d'une page d'authentification ne mène nulle part.

### Version

Lue depuis `package.json` (`src/lib/app-version.ts`), jamais ressaisie. Le
footer est un composant serveur : la valeur est figée au build et n'est pas
exposée au client.

### Positionnement

En flux, collé en bas du viewport sur une page courte, et rejeté sous le
contenu sur une page longue. Le groupe de routes fournit une colonne flex en
hauteur de viewport ; les pages qui occupaient déjà toute la hauteur
(`AuthShell`, `/pending`) passent de `min-h-full` / `min-h-dvh` à `flex-1` pour
laisser la place au footer.

### Direction visuelle

« Le reçu » : filet supérieur **en pointillés ambrés** (la perforation du
ticket, motif déjà présent dans le produit), trois blocs alignés à gauche,
version en mono Geist, barre de bas en filet plein. Aucun fond propre : le
footer est transparent et laisse voir le fond pointillé de la coque. Il suit
automatiquement le thème clair et sombre via les tokens existants.

### Données

Les liens et le contact vivent dans `src/lib/footer.ts` (constante typée). Le
composant ne fait que les rendre.

### Pages légales

Deux pages distinctes, coquille de lecture simple (logo cliquable, prose,
largeur de ligne limitée) :

- `/legal-notice` — éditeur, hébergeur, nature et accès au service, propriété
  intellectuelle, contact ;
- `/privacy` — responsable du traitement, données collectées, finalités,
  conservation hors ligne, destinataires, durées, droits, transferts, sécurité.

Le contenu est un **gabarit rédigé à trous** : les informations que le porteur
seul connaît (raison sociale, hébergeur, durées de conservation, autorité de
protection des données) sont marquées `[à compléter : …]` et ne sont pas
inventées.

### Contact

`contact@tks.cd` et « Kinshasa, RDC » sont **provisoires**, centralisés dans
`FOOTER_CONTACT` pour être remplacés en un seul endroit. Aucun numéro WhatsApp
n'est affiché tant qu'il n'est pas fourni.

## Non-objectifs

- Ne pas corriger `destinationAide()`, qui renvoie `/admin/aide` alors que la
  page réelle est `/admin/help` (404 sur l'aide admin). Détecté au passage,
  hors périmètre de ce lot.
- Ne pas créer de page d'aide publique.
- Ne pas ajouter de footer aux espaces authentifiés.
- Ne pas afficher d'état de synchronisation hors ligne dans le footer.

## Décisions d'implémentation

| Élément | Décision |
| --- | --- |
| Composant | `src/components/app-footer.tsx`, composant serveur |
| Données | `src/lib/footer.ts` — `FOOTER_LINKS`, `FOOTER_CONTACT`, `FOOTER_TAGLINE` |
| Version | `src/lib/app-version.ts`, import du `package.json` racine |
| Montage | `src/app/(auth)/layout.tsx` et `src/app/(public)/layout.tsx` |
| Coquille légale | `src/components/legal-page.tsx`, `LegalPage` + `LegalSection` |
| Footer `/pending` | supprimé ; la page utilise le footer générique |
| Routes légales | anglaises (`/legal-notice`, `/privacy`), libellés français |

## Décisions de test

- `tests/components/app-footer.test.tsx` : rôle `contentinfo`, liens et cibles,
  `mailto:`, version affichée, absence du lien « Aide ».
- `tests/app/(public)/legal-notice/page.test.tsx` et
  `tests/app/(public)/privacy/page.test.tsx` : titre, sections portantes,
  marqueurs `[à compléter]`, retour à l'accueil par le logo.
- Vérification visuelle humaine obligatoire : le rendu (densité, filet,
  alignements) ne se juge pas en test.
