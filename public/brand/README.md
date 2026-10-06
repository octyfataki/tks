# /public/brand — logo TKS unique (fond transparent)

| Fichier | Usage | Taille |
| ------- | ----- | ------ |
| `logo.png` | header / sidebar / login — clair ET sombre | 640px, transparent |
| `icon-512.png` | PWA / icône carrée, fond zinc `#09090B` | 512×512 |
| `favicon-32.png` | onglet navigateur, fond zinc `#09090B` | 32×32 |
| `apple-touch-icon.png` | iOS, fond zinc `#09090B` | 180×180 |

Favicon : logo ambre centré à 80 % sur tuile sombre unie (contraste à 16–32px).
`src/app/icon.png` est la copie de `icon-512.png` — Next.js la sert en `/icon.png`.
L'ancien `src/app/favicon.ico` (logo Next par défaut) est supprimé : c'était lui
que le navigateur affichait.

Utilisation : `import { BrandLogo } from "@/components/brand-logo"` puis `<BrandLogo height={32} />`.
