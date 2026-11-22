# AZARIS — Boutique en ligne

Site e-commerce statique (HTML/CSS/JS, sans build). Design original : bento grid, vert forêt + citron vert, typographie grotesque.

## Contenu
- Hero en bento (titre, offre -34%, produits phares)
- Catalogue de 7 modèles avec filtres (Souliers / Sabots custom), badges promo et stock
- Mise en avant d'un modèle avec achat rapide (choix de pointure direct)
- Engagements, étapes de commande, FAQ
- Fiche produit en panneau latéral (bottom sheet sur mobile) : galerie, pointures EU 36-46, quantité
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
