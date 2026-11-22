# AZARIS — Boutique en ligne (React)

Boutique React (Vite) avec commande en paiement à la livraison via WhatsApp et tableau de bord d'administration.

## Lancer
```
npm install
npm run dev        # développement
npm run build      # version en ligne dans dist/
```
Déploiement : Vercel, Netlify ou tout hébergeur statique (dossier `dist`).

## Boutique
- Catalogue avec filtres (Souliers / Sabots), fiche produit avec photos, pointures, quantité
- Panier enregistré dans le navigateur
- Formulaire de commande (nom, téléphone, ville, adresse) : la commande est enregistrée puis le message est ouvert dans WhatsApp, prêt à envoyer

## Administration
Adresse : `/#/admin` (mot de passe par défaut : `azaris2026`, à changer dans Paramètres).
- Tableau de bord : chiffre d'affaires, commandes, panier moyen, ventes des 7 derniers jours, meilleures ventes, stock faible
- Commandes : recherche, filtres par statut, changement de statut, détail, note interne, contact WhatsApp du client, ajout manuel, export Excel (CSV)
- Produits : ajout, modification, suppression, photos (upload ou lien), stock, prix barré, masquer un produit
- Paramètres : nom, numéro WhatsApp, frais de livraison, bandeau, réseaux sociaux, mot de passe

## Important
Le site n'a pas de serveur : les commandes et les modifications de l'administration sont enregistrées dans le navigateur.
- Les commandes passées par les clients arrivent sur WhatsApp ; dans l'admin elles ne s'affichent que sur l'appareil où elles ont été passées (utiliser « Ajouter une commande » pour les saisir).
- Les modifications de produits faites dans l'admin ne sont visibles que sur cet appareil. Pour les publier pour tous, exporter `produits.json` et mettre à jour `src/data/defaults.js`.
Pour un admin partagé (commandes de tous les clients en temps réel), il faut brancher une base de données (Supabase ou Firebase).

## Fichiers
- `src/data/defaults.js` : paramètres et catalogue par défaut
- `src/pages/Home.jsx` : boutique
- `src/pages/Admin.jsx` : administration
- `src/store.jsx` : panier, commandes, produits, paramètres
