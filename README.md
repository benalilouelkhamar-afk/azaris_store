# ANZAR STEP — Boutique en ligne

Site e-commerce statique (HTML/CSS/JS, sans build), design premium et épuré inspiré d'anzarstep.com.

## Features
- Hero plein écran (vidéo de la marque), bandeau livraison/COD, sections catégories, histoire, étapes de commande
- 7 produits réels (ZEBRA, Chunky Brownie 90s, Atlass 98, Shadow Step, NARUTO, SONIC, LOVE) avec prix, ancien prix, remise, stock
- Filtres: Chaussures / Sandales & Sabots
- Fiche produit: galerie, choix de pointure EU 36-46, quantité, onglets description / livraison / échange
- Panier (localStorage) + formulaire COD (nom, téléphone, ville, adresse) → commande envoyée sur WhatsApp
- Responsive mobile, reduced-motion respecté

## Modifier
Tout est dans `js/products.js`: nom de la marque, numéro WhatsApp, réseaux sociaux, produits, prix.
Les images sont chargées depuis anzarstep.com; si une image ne charge pas, un visuel neutre de remplacement s'affiche.

## Lancer en local
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## Déployer
Projet statique: Vercel, Netlify ou GitHub Pages (dossier racine, sans build).
