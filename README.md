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

## Base de données (Supabase)
Avec Supabase, toutes les commandes des clients arrivent dans l'admin, en direct, sur tous vos appareils. Les produits et les paramètres modifiés dans l'admin sont publiés pour tout le monde.

1. Supabase > **SQL Editor** : coller et lancer `supabase/schema.sql`, puis `supabase/seed.sql` (les 7 produits).
2. Supabase > **Authentication > Users** > *Add user* : créer votre compte admin (e-mail + mot de passe, cocher *Auto confirm*).
3. SQL Editor : donner l'accès admin à ce compte :
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'votre@email.com';
   ```
4. Authentication > Sign In / Providers : désactiver *Allow new users to sign up*.
5. Copier `.env.example` en `.env` et coller la clé publique (Project Settings > API > `anon` `public`). Sur Vercel/Netlify, ajouter les mêmes variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

Sécurité : la clé `anon` est publique (c'est normal). Les clients ne peuvent que lire les produits et passer commande ; les prix et le total sont recalculés par la base (fonction `place_order`), le stock est décrémenté automatiquement. Seuls les comptes de la table `admins` voient les commandes. Ne jamais mettre la clé `service_role` dans le site.

Sans ces variables, le site fonctionne en mode local (données dans le navigateur, mot de passe admin `azaris2026`).

## Administration
Adresse : `/#/admin` (avec Supabase : e-mail + mot de passe du compte admin).
- Tableau de bord : chiffre d'affaires, commandes, panier moyen, ventes des 7 derniers jours, meilleures ventes, stock faible
- Commandes (en direct) : recherche, filtres par statut, changement de statut, détail, note interne, contact WhatsApp du client, ajout manuel, export Excel (CSV)
- Produits : ajout, modification, suppression, photos (envoyées dans Supabase Storage, ou lien), stock, prix barré, masquer un produit
- Paramètres : nom, numéro WhatsApp, frais de livraison, bandeau, réseaux sociaux

## Fichiers
- `src/data/defaults.js` : paramètres et catalogue par défaut
- `src/pages/Home.jsx` : boutique
- `src/pages/Admin.jsx` : administration
- `src/store.jsx` : panier, commandes, produits, paramètres
- `src/supabase.js` : connexion Supabase
- `supabase/schema.sql`, `supabase/seed.sql` : base de données
