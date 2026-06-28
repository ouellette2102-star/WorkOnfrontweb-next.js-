# WORKON — LAUNCH READINESS CONTRACT

> **Source de vérité UNIQUE du lancement.** Si une chose n'est pas ici, elle n'est pas dans le scope de lancement — elle est v2.
> Tout agent (humain ou IA) **lit ce fichier avant d'agir**, met à jour le statut + la preuve, et n'invente jamais de scope.
> Établi le 2026-06-23 sur preuves (git/gh/CI). Standard visé : org d'ingénierie disciplinée adaptée à une startup en lancement.
> **Statut global : G0 GELÉ (2026-06-23) — `main` canonique, scope défini, push P0, F1–F5 P0. Exécution G1 en cours.**

---

## 0. Comment ce contrat se gouverne

- **Geler** = Mathieu valide P0/P1/v2 et la décision D1. Tant que non gelé, le scope est *proposé*.
- **Une PR à la fois**, CI verte à chaque pas, `/code-review` = porte unique vers `main`. Aucun merge aveugle.
- **Interdiction de refaire un acquis** sans une ligne de ce fichier qui le justifie.
- Statuts : ✅ fait & prouvé · 🟡 partiel · ☐ à faire · ⛔ bloqué (décision) · ❌ coupé (v2).

---

## 1. Définition de « Launch Readiness » pour WorkOn (ma définition, pas un template)

WorkOn est lançable quand **un vrai utilisateur (employeur ou worker) peut traverser le parcours critique de bout en bout, sur le web mobile réel, sans cul-de-sac, sans incohérence front/back, avec ses vraies données, et qu'on peut l'observer.** Concrètement :

1. **Une seule vérité produit** — une direction de design, un parcours, zéro page orpheline ou « presque prête ».
2. **Parcours critique sans faille** — de l'arrivée publique → action de valeur → confirmation, sans état ambigu.
3. **Cohérence front/back** — contrats API alignés, auth/permissions correctes, zéro mismatch payload.
4. **Argent sûr** — tout flux qui touche un paiement est soit complet et vérifié, soit explicitement désactivé (jamais ambigu).
5. **Filet anti-régression** — E2E sur les parcours critiques + smoke prod + CI verte bloquante.
6. **Observabilité minimale** — erreurs (Sentry) + un événement analytics par étape critique, pour *voir* les premiers users.
7. **Récupérable** — rollback possible (revert PR / redeploy précédent), source de vérité documentée.

> **Non négociable :** « présent dans le code » ≠ « launch-ready ». Une feature est *done* seulement si elle est **branchée, alimentée par de vraies données, intégrée au parcours, instrumentée et gérée en erreur/empty/loading.**

---

## 2. Scope de lancement (PROPOSÉ — à geler par Mathieu)

### P0 — bloque le lancement
- [x] ✅ **D1 tranché : `main` est la base canonique.** Les branches périmées (RedPhone) = **source d'idées à miner** : extraire ce qui complète/améliore, **recréer en mieux sur main**, sans casser les logiques existantes (qu'on améliore aussi si un agent détecte une optimisation).
- [ ] 🟢 **Parcours employeur** : `/publier-besoin` **landé (#271)** → mission créée → réception de propositions. *(reste : prouver le POST réel + E2E.)*
- [ ] 🟡 **Parcours worker** : onboarding rôle → découverte (`/swipe` `/map` `/missions`) → mission → contrat.
- [ ] 🟡 **`/map` et `/pros` stables** — **code-vérifié 2026-06-23** : `/map` en Leaflet impératif anti-crash (garde `_leaflet_id`, `map.remove()`, `ssr:false`, icônes custom = pas de 404 marqueur) + états loading/error/empty/success complets ; `/pros` n'utilise pas Leaflet — **preuve navigateur 2026-06-23 : `/pros` stable (rendu, recherche, filtres, empty-state, 0 crash)** + bug console nav (clé `/pricing` dupliquée) trouvé & corrigé (#281). *Reste : preuve navigateur de `/map` connecté (gated → auth requise).*
- [ ] ✅ **Paiements réels** branchés sur Invoice/escrow (déjà en main, #248) — **à re-vérifier E2E**, pas à recoder.
- [ ] 🟡 **Analytics branché** (≥ 1 event/étape critique) — **2026-06-23** : `analytics.ts` + `trackEvent()` générique (transport Sentry). Events **account_registered** (F2, #278), **mission_created** (F3, #278), **payment_succeeded/failed** (F4, #279). *F1 absent de main ; reste : confirmer les events live en prod.*
- [ ] 🟡 **FCM Web Push (P0)** — câblage **déjà présent en main** : SW `public/firebase-messaging-sw.js` + enregistrement `src/lib/firebase-client.ts` (getMessaging/getToken/onMessage) + `src/hooks/use-device-registration.ts` (POST `/devices` avec pushToken). **Gap** = (1) vérifier le runtime permission→token→réception *(bloqué : env `NEXT_PUBLIC_FIREBASE_*` + VAPID à poser dans Vercel + envoi FCM Admin SDK backend)*, (2) ~~commentaire périmé~~ **✅ corrigé (#277)** — `firebase-client.ts` confirmé câblé (getToken+VAPID), commentaire honnête. Pas de reconstruction.
- [ ] ☐ **E2E verts** sur les parcours critiques + **smoke prod** passé.
- [ ] ☐ **États empty/loading/error** présents sur toute page P0.
- [ ] ☐ **Passe d'amélioration UX sur F1–F5** (skills `design:design-critique`, `design:accessibility-review`, `/code-review`) — améliorer l'expérience, pas juste « ça marche ».

### P1 — souhaité, non bloquant
- [ ] Notifications push avancées (au-delà du minimum P0).
- [ ] **Consentement cookies** : le bandeau (z-9999) recouvre le CTA du form au 1er chargement (révélé par l'E2E F1) → revoir le z-index / le placement pour ne pas bloquer la conversion.
- [ ] Trust badges / disputes polish.
- [ ] FAQ enrichie, copy QC final.

### v2 — COUPÉ pour le lancement (écrit noir sur blanc)
- ❌ App mobile Flutter.
- ❌ Toute refonte d'un acquis déjà en main « pour faire plus propre ».
- ❌ Tout « nice to have » non listé en P0/P1.
- ❌ Re-livraison de travail déjà mergé (paiements #248, accents #262, premium UI lots).

---

## 3. Parcours critiques à valider (preuve E2E exigée)

| # | Parcours | Étapes clés | Statut |
|---|---|---|---|
| F1 | Capture de demande publique | arrivée → `/publier-besoin` → POST `/public/missions` → confirmation | ✅ **prouvé** : page live + E2E vert + endpoint/proxy validés (reste : event analytics) |
| F2 | Onboarding + découverte worker | register → role → details → `/swipe`·`/map`·`/missions` | 🟡 → **inscription E2E ✅ (#283, mockée, en CI)** ; découverte (`/map` stable, `/pros` browser-vérifié) — reste swipe |
| F3 | Cycle de mission | création → feed → détail → proposition/contrat → invoice | 🟡 → **création mission E2E ✅ (#284, mockée, tous les gates réels)** ; reste feed/détail/contrat/invoice |
| F4 | Paiement bout-en-bout | checkout → escrow → acceptation bilatérale → earnings | 🟡 (code en main, preuve à refaire) |
| F5 | Auth/session/rôles | login, cookies httpOnly, gating admin/employer/worker | 🟡 **gating UI prouvé** (E2E worker→refusé / admin→dashboard) + **autorisation backend prouvée** : test d'intégration réel nightly (`e2e/admin-authz-prod.spec.ts`) — endpoints `/admin/*` rejettent sans token / token bidon (401). Reste : séparation worker-vs-admin sur token valide (exigerait un token worker seedé) |

---

## 4. Barres de qualité (gates de contenu)

- **Perf** : pas de page P0 qui bloque > 3 s sur 4G mobile ; pas de crash JS console sur le parcours critique.
- **UX** : navigation cohérente, zéro dead-end, zéro bouton non câblé sur une page P0.
- **Sécurité** : aucun secret en clair (✅ vérifié) · CI audit npm **BLOQUANT** (`audit:release` sans `|| true` depuis #308 → rouge sur high/critical) · gating de rôle **UI** testé (E2E) **et** autorisation **backend prouvée** (nightly `admin-authz-prod` : `/admin/*` → 401 sans token).
- **Observabilité** : Sentry actif (✅), ≥ 1 event analytics par étape F1–F4 (☐).
- **Données** : zéro métrique seed présentée comme réelle ; instrumentation prête à mesurer de vrais users.

---

## 5. Release gates

- **G0 — Contrat gelé** : §2 et D1 validés par Mathieu. ⛔ *bloquant actuel.*
- **G1 — Consolidation propre** : PR #271 landée, tests E2E récupérés, backend local synchro remote, branches mortes purgées, CI verte. ☐
- **G2 — P0 fermés** : tous les P0 ✅ avec preuve au Proof Ledger. ☐
- **G3 — Hardening** : E2E verts + smoke prod + Sentry propre + 0 régression. ☐
- **G4 — Go/No-Go** : revue go/no-go honnête, instrumentation live. ☐

---

## 6. Branch Salvage Map (preuves — anti-régression)

> **Découverte clé :** la majorité du « travail bloqué » est **déjà en main** ou **périmé**. Le merger aveuglément aurait **régressé** le produit. Vérifié par dates + `merge-base --is-ancestor` + `git cherry`.

| Travail | Branche | Dans main ? | Verdict | Preuve |
|---|---|---|---|---|
| Paiements réels Invoice/escrow | fix/worker-payments-earnings | ✅ via **#248** | **DROP** (doublon) | `5f498b1a` en main |
| Accents FR | salvage (`8d62e429`) | ✅ via **#262** (plus récent) | **DROP** (supersédé) | main 2026-06-21 > branche 06-17 |
| Premium account ops hub | codex worktree | ✅ `84051497` en main | **DROP** (déjà mergé) | log main |
| Premium UI (19 commits) | — | ✅ en main | — | `grep -c premium` = 19 |
| **RedPhone — nav + design-system polish** (28 fichiers, +1337/−1052) | redesign/landing-redphone | ❌ absent | **MINE → recréer mieux** sur main, fichier par fichier | diff `top-bar` `bottom-nav` `button` `hero-worker-card` `trust-tier-badge` |
| Lucide icons / tokens | mêmes branches | 🟡 main migre déjà (#271 utilise Lucide) | **MINE ciblé** | `a9902aa0` |
| **Publier-besoin (capture publique sans auth)** | chantier/publier-besoin (**PR #271 OUVERTE**) | ❌ ouvert | ✅ **REVIEW & LAND** | seule PR ouverte, funnel réel |
| FCM Web Push (P0) | `public/firebase-messaging-sw.js` | ✅ fichier **en main** | **VERIFY câblage** (registration/permission/réception) | existe ; ne pas reconstruire |
| ~~Suite E2E proofs (14 specs prod one-shot)~~ | harvestés en main | ✅ **SUPPRIMÉS** — validations one-shot de PRs mergées (comptes throwaway morts, URLs preview mortes, configs absentes, plusieurs destructeurs) | Remplacés par **1 nightly prod-smoke réel + non-destructeur** (`admin-authz-prod` + `smoke`) | `nightly-prod-smoke.yml` |
| ~38 branches squash-merged | — | ✅ | **DELETE** | ahead=1, behind 60-95 |

---

## 7. Proof Ledger (à remplir à mesure — aucune ligne « ready » sans preuve)

| Item P0 | Preuve code | Preuve test | Preuve UI/flow | Preuve API/back | Preuve obs | Statut |
|---|---|---|---|---|---|---|
| F1 publier-besoin | ✅ #271 mergé | ✅ `e2e/publier-besoin.spec.ts` **landé main (#273)**, vert (vs prod, POST mocké) · job CI à activer (scope `workflow`) | ✅ page prod HTTP 200 | ✅ endpoint+proxy live (400 sur invalide) · payload contrat OK | ☐ event analytics | 🟢 **prouvé E2E** |
| F4 paiement E2E | #248 en main | ☐ E2E | ☐ | ☐ escrow | ☐ | 🟡 |
| /map stable | ✅ Leaflet impératif anti-crash + états L/E/empty/success | ☐ | ☐ preuve nav | — | ☐ Sentry 0 | 🟡 **code-vérifié** |
| Analytics F2/F3/F4 | ✅ `trackEvent` + events #278/#279 | ✅ `analytics.test` 7/7 | — | — | ☐ events live (Sentry) | 🟡 **instrumenté** |
| FCM push (front) | ✅ `firebase-client`+hook+SW, commentaire honnête #277 | — | — | ⛔ secrets Vercel + send BE | — | 🟡 **code prêt** |

---

## 8. Gouvernance branches & merge

- **main = vérité.** Frontend repo (Vercel) et backend repo (Railway) sont **2 repos distincts** — chacun sa main, sa CI.
- ⚠️ **Backend local PÉRIMÉ** : `main` local = 2026-05-17, mais remote/CI actif jusqu'au 2026-06-22. **Synchroniser avant tout travail backend.**
- 1 branche d'intégration nommée, merge quotidien, **suppression après merge**.
- Porte unique vers main : CI (audit+build+lint) verte + `/code-review`. Pas d'exception.

---

## 9. Décisions — GELÉES (2026-06-23)

- **D1 ✅ — `main` est la base canonique.** On ne reprend rien tel quel. On **mine** RedPhone (et autres branches périmées) pour identifier ce qui *ajoute, complète ou améliore*, puis on **recrée en mieux sur main**, fichier par fichier, sans régression. Les logiques existantes faibles sont aussi candidates à amélioration si un agent détecte une optimisation — toujours derrière la porte qualité (`/code-review` + CI).
- **D2 ✅ — FCM push = P0.** Le service worker existe déjà en main → vérifier/compléter le câblage, pas reconstruire.
- **D3 ✅ — F1–F5 sont tous P0**, chacun avec une **passe d'amélioration UX** via les bons skills (`design:design-critique`, `design:accessibility-review`, `/verify`).

---

## 10. Photo de départ — ce qui est DÉJÀ solide (pour confiance)

✅ main avec **CI verte à chaque push** (front + back) · ✅ 19 commits premium UI intégrés · ✅ paiements réels Invoice/escrow (#248) · ✅ accents FR (#262) · ✅ DM temps réel (#269) · ✅ OTP état honnête · ✅ secrets vérifiés clean · ✅ Sentry actif · ✅ landing `src/app/page.tsx` à jour (06-21) · ✅ **partage mission (#276)** · ✅ **analytics funnel F2/F3/F4 (#278/#279)** · ✅ **FCM commentaire honnête (#277)** · ✅ **`/pros` browser-vérifié + fix clé nav (#281)**.

> **Tu es plus proche du lancement que la fragmentation ne le laissait croire.** Le « tourner en rond » venait de te battre contre des branches déjà obsolètes. Le vrai travail restant est court et listé ci-dessus.
