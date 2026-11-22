# AZARIS — Boutique en ligne

Site e-commerce statique (HTML/CSS/JS, sans build). Design sombre et élégant : noir, crème et doré, typographie Fraunces + Work Sans.

## Contenu
- Hero avec visuels produits en arche
- Catalogue de 7 modèles avec filtres (Souliers / Sabots custom), badges promo et stock
- Section maison, services (livraison, paiement, échange), FAQ
- Fiche produit : galerie, pointures EU 36-46, quantité
- Panier (localStorage) + formulaire paiement à la livraison (nom, téléphone, ville, adresse) envoyé sur WhatsApp

## Modifier
Tout est dans `js/products.js` : nom de la marque, numéro WhatsApp, e-mail, réseaux sociaux (vide = masqué), produits et prix.
Les images produits sont chargées depuis leur URL d'origine ; si une image ne charge pas, un visuel neutre s'affiche.

## Lancer en local
```
python3 -m http.server 8000
```

## Déployer
Statique : Vercel, Netlify ou GitHub Pages, sans build.
