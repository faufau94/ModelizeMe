# Analyse complète du projet ModelizeMe

**Date** : 18 mars 2026
**Projet** : Application Nuxt 3 de modélisation de données collaborative (MCD → MLD → MPD)
**Stack** : Nuxt 3, Vue 3, Prisma/MySQL, Better-Auth, TanStack Query, Pinia, Vue Flow, Yjs

---

## Ce qui va bien

### Architecture générale
- **Stack moderne et cohérent** : Nuxt 3, Vue 3, Pinia, TanStack Query, Prisma — bon choix technologique
- **Séparation composables/stores** bien pensée : les composables API (`useModel`, `useWorkspace`, `useTeam`) encapsulent les mutations TanStack Query, les stores Pinia gèrent l'état UI/flow
- **Collaboration temps réel** via Yjs/CRDT + WebSocket — architecture solide pour le multi-utilisateur
- **Modélisation en 3 niveaux** (MCD → MLD → MPD) avec transformations automatiques — feature métier forte
- **Import SQL/XML** fonctionnel avec parsing regex/DOM
- **UI shadcn-nuxt** propre avec theming HSL et dark mode
- **Validation de formulaires** avec vee-validate + Zod côté client
- **Multi-tenant** bien structuré : Organization → Team → Model
- **Prisma schema** cohérent avec relations et contraintes

---

## Ce qui ne va pas

### 1. SÉCURITÉ — CRITIQUE

#### 1.1 Routes API non protégées (18+ routes)
**Impact : N'importe qui peut supprimer/modifier des données sans être authentifié.**

Routes SANS vérification de session :
- `server/api/models/delete.delete.ts` — suppression de modèle sans auth
- `server/api/models/update.put.ts` — modification sans auth
- `server/api/models/read.get.ts` — lecture sans auth
- `server/api/models/import.put.ts` — import sans auth
- `server/api/models/rename.put.ts` — renommage sans auth
- `server/api/teams/create.post.ts` — création d'équipe sans auth
- `server/api/teams/update.put.ts` — modification sans auth
- `server/api/teams/delete.delete.ts` — suppression sans auth
- `server/api/teams/read.get.ts`, `teams/models.get.ts`
- `server/api/admin/users/list.get.ts` — **liste des users accessible à tous**
- `server/api/admin/users/delete.delete.ts` — **suppression user sans auth**
- `server/api/admin/users/edit.put.ts` — **édition user sans auth**
- `server/api/admin/roles/list.get.ts`
- `server/api/workspaces/read.get.ts`, `delete.delete.ts`, `list-roles.get.ts`
- `server/api/categories/list.get.ts`

**Action** : Ajouter `auth.api.getSession()` + vérification d'autorisation sur TOUTES les routes.

#### 1.2 Pas d'autorisation (ownership check)
Même les routes avec session ne vérifient pas que l'utilisateur a le droit d'agir. Seul `regenerate-invite-code` vérifie le propriétaire. Un user authentifié peut supprimer les modèles d'un autre workspace.

**Action** : Ajouter des vérifications de membership/ownership workspace + team sur chaque opération.

#### 1.3 Secrets hardcodés dans le code source
- `server/api/auth/sign-up.ts` : credentials Mailjet en dur + **mot de passe en clair dans l'email**
- `server/api/workspaces/create.post.ts` : mêmes credentials Mailjet
- `lib/send-invitation.ts` : mêmes credentials Mailjet
- `.env` commité avec OAuth secrets (Google, GitHub, GitLab), database credentials

**Action** : Extraire tous les secrets dans des variables d'environnement, créer un `.env.example`, ajouter `.env` au `.gitignore`, **révoquer et régénérer tous les secrets exposés**.

#### 1.4 Mot de passe envoyé en clair par email
Dans `sign-up.ts`, le mot de passe est loggé en console ET envoyé par email en HTML.

**Action** : Ne jamais envoyer de mot de passe par email. Utiliser un lien de vérification/reset.

#### 1.5 Pas de validation d'input côté serveur
Aucune route API ne valide les entrées avec Zod (installé mais non utilisé côté serveur). Les paramètres sont utilisés directement (`query.id?.toString()`, `Number(id)` sans vérification).

**Action** : Ajouter des schémas Zod sur chaque route API pour valider body/query/params.

#### 1.6 Pas de CSRF, rate limiting, security headers
- Aucune protection CSRF
- Aucun rate limiting (brute force possible sur login/signup)
- Aucun header de sécurité (CSP, X-Frame-Options, HSTS, etc.)

**Action** : Ajouter le module `nuxt-security` ou un middleware custom.

#### 1.7 Middleware super-admin commenté
`middleware/require-super-admin.ts` est entièrement commenté — les routes admin ne sont pas protégées.

---

### 2. QUALITÉ DE CODE — IMPORTANT

#### 2.1 Mix TypeScript / JavaScript incohérent
- Composables API en `.ts` ✓
- Stores flow/collaboration en `.js` ✗
- Utils en `.js` ✗

**Action** : Migrer progressivement les `.js` vers `.ts` pour la cohérence et la sécurité de typage.

#### 2.2 Inconsistance dans les appels API
- Certains composables utilisent `authClient` (Better Auth)
- D'autres utilisent `$fetch` directement
- Pas de pattern unifié

#### 2.3 Gestion d'erreurs incohérente
Deux patterns mélangés :
```ts
return { status: 401, body: { message: 'Unauthorized' } }  // pattern 1
throw createError({ statusCode: 401 })                       // pattern 2
```

**Action** : Standardiser sur `createError()` de Nuxt partout.

#### 2.4 Code commenté / fichiers obsolètes
- `old_useFloatingEdge.js`, `old_listitem.vue` — fichiers non nettoyés
- Blocs de code commentés dans `useLayout.js`, `useReorganize.js`, middleware

#### 2.5 Import manquant
`composables/api/useModel.ts` utilise `storeToRefs` sans import explicite (peut fonctionner via auto-import Nuxt, mais à vérifier).

---

### 3. ARCHITECTURE — AMÉLIORATIONS

#### 3.1 WebSocket hardcodé
`collaboration-store.js` pointe sur `ws://localhost:1234` — ne marchera pas en production.

**Action** : Utiliser une variable d'environnement / runtimeConfig pour l'URL WebSocket.

#### 3.2 PrismaClient non singleton
Le client Prisma semble ne pas utiliser le pattern singleton recommandé pour le dev (hot reload crée de multiples instances).

#### 3.3 Page modèle trop volumineuse
`pages/app/model/[idModel].client.vue` fait 719 lignes — à découper en composants plus petits.

#### 3.4 Query invalidation inconsistante
Certaines mutations invalidate `'models'`, d'autres utilisent des queryKey arrays différents. Risque de données stale.

#### 3.5 Pas de .env.example
Pas de fichier template pour les variables d'environnement — difficile pour un nouveau développeur de setup le projet.

---

## Résumé des priorités

| Priorité | Problème | Impact |
|----------|----------|--------|
| 🔴 P0 | 18+ routes API sans authentification | Données accessibles/modifiables par n'importe qui |
| 🔴 P0 | Routes admin sans protection | N'importe qui peut supprimer des users |
| 🔴 P0 | Secrets hardcodés + .env commité | Compromission de comptes OAuth/email |
| 🔴 P0 | Mot de passe en clair dans les emails | Fuite de credentials |
| 🟠 P1 | Pas d'autorisation (ownership) | Un user peut agir sur les données d'un autre |
| 🟠 P1 | Pas de validation d'input serveur | Injection / données corrompues |
| 🟠 P1 | Pas de CSRF / rate limiting | Attaques brute force / CSRF |
| 🟡 P2 | Mix TS/JS incohérent | Maintenabilité |
| 🟡 P2 | WebSocket hardcodé | Bloquant pour la production |
| 🟡 P2 | Gestion d'erreurs inconsistante | UX dégradée |
| 🟢 P3 | Code commenté / fichiers obsolètes | Dette technique |
| 🟢 P3 | Page modèle trop volumineuse | Maintenabilité |

---

## Plan d'action recommandé

### Phase 1 : Sécurité critique (P0)
1. **Créer un middleware serveur d'authentification** réutilisable (`server/utils/requireAuth.ts`)
2. **Ajouter l'auth sur toutes les routes API** non protégées
3. **Activer le middleware super-admin** pour les routes `/api/admin/*`
4. **Extraire les secrets** du code source vers `.env` + créer `.env.example`
5. **Supprimer l'envoi de mot de passe** par email dans `sign-up.ts`
6. **Révoquer tous les secrets exposés** (Mailjet, OAuth, etc.)

### Phase 2 : Autorisation & validation (P1)
7. **Ajouter des checks d'autorisation** (membership workspace/team) sur chaque opération
8. **Ajouter la validation Zod** sur toutes les routes API
9. **Installer nuxt-security** ou ajouter les headers/CSRF/rate limiting manuellement

### Phase 3 : Qualité de code (P2-P3)
10. **Migrer les stores JS → TS**
11. **Configurer l'URL WebSocket** via runtimeConfig
12. **Standardiser la gestion d'erreurs**
13. **Nettoyer les fichiers obsolètes et code commenté**
14. **Découper la page modèle** en composants

---

## Fichiers critiques à modifier

- `server/api/**/*.ts` — toutes les 42 routes API
- `middleware/require-super-admin.ts` — réactiver
- `server/api/auth/sign-up.ts` — retirer secrets et mdp en clair
- `lib/send-invitation.ts` — retirer credentials hardcodés
- `stores/collaboration-store.js` — URL WebSocket dynamique
- `lib/auth.ts` — configuration Better Auth
- `.gitignore` — ajouter `.env`
