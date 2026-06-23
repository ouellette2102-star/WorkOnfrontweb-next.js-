> **Porté du legacy** (app Flutter `workon-frontend`, `docs/FLUTTER_BACKEND_MAPPING.md`). **Même backend que le web** → référence des endpoints disponibles. À miner pour repérer les capacités backend que le web n'exploite pas encore.

---

# Flutter ↔ Backend Mapping — WorkOn

> **Date**: 2026-01-30
> **Version**: 1.0
> **Statut**: ✅ VALIDÉ (Option C)

---

## 📋 Configuration

### AppConfig (Flutter)

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `_apiBaseUrlProd` | `https://workon-backend-production-8908.up.railway.app` | Production |
| `_apiBaseUrlStaging` | `https://workon-backend-production.up.railway.app` | Staging |
| `_apiBaseUrlDev` | `http://10.0.2.2:3001` | Dev (émulateur Android) |
| `apiVersion` | `/api/v1` | Tous |
| `connectionTimeout` | 30 secondes | Tous |
| `stripePublishableKey` | `pk_test_51RAxXTJ6SQ...` | Test mode |

### Safety Guards ✅

- ✅ `isMisconfigured` — Vérifie URL valide
- ✅ `isUpdateRequired` — Forced update gate
- ✅ `maintenanceMode` — Kill-switch
- ✅ `disableAuth` — Auth kill-switch
- ✅ `disablePayments` — Payments kill-switch

---

## 📡 Endpoints Mapping

### Auth Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `AuthService.register` | `/api/v1/auth/register` | POST | ❌ |
| `AuthService.login` | `/api/v1/auth/login` | POST | ❌ |
| `AuthService.refresh` | `/api/v1/auth/refresh` | POST | ✅ |
| `AuthService.logout` | `/api/v1/auth/logout` | POST | ✅ |
| `AuthService.me` | `/api/v1/auth/me` | GET | ✅ |

### Missions Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `MissionsApi.fetchNearby` | `/api/v1/missions-local/nearby` | GET | ✅ |
| `MissionsApi.fetchById` | `/api/v1/missions-local/:id` | GET | ✅ |
| `MissionsApi.fetchMyMissions` | `/api/v1/missions-local/my-missions` | GET | ✅ |
| `MissionsApi.fetchMyAssignments` | `/api/v1/missions-local/my-assignments` | GET | ✅ |
| `MissionsApi.createMission` | `/api/v1/missions-local` | POST | ✅ |
| `MissionsApi.acceptMission` | `/api/v1/missions-local/:id/accept` | POST | ✅ |
| `MissionsApi.startMission` | `/api/v1/missions-local/:id/start` | POST | ✅ |
| `MissionsApi.completeMission` | `/api/v1/missions-local/:id/complete` | POST | ✅ |

### Offers Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `OffersApi.create` | `/api/v1/offers` | POST | ✅ |
| `OffersApi.getForMission` | `/api/v1/offers/mission/:missionId` | GET | ✅ |
| `OffersApi.accept` | `/api/v1/offers/:id/accept` | PATCH | ✅ |
| `OffersApi.reject` | `/api/v1/offers/:id/reject` | PATCH | ✅ |
| `OffersApi.getMine` | `/api/v1/offers/mine` | GET | ✅ |

### Payments Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `PaymentsApi.createIntent` | `/api/v1/payments/create-intent` | POST | ✅ |
| `PaymentsApi.checkout` | `/api/v1/payments/checkout` | POST | ✅ |
| `PaymentsApi.getInvoice` | `/api/v1/payments/invoice/:id` | GET | ✅ |

### Ratings Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `RatingsApi.create` | `/api/v1/reviews` | POST | ✅ |
| `RatingsApi.getForUser` | `/api/v1/reviews` | GET | ✅ |
| `RatingsApi.getSummary` | `/api/v1/reviews/summary` | GET | ✅ |

### Compliance Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `ComplianceApi.getVersions` | `/api/v1/compliance/versions` | GET | ❌ |
| `ComplianceApi.getStatus` | `/api/v1/compliance/status` | GET | ✅ |
| `ComplianceApi.accept` | `/api/v1/compliance/accept` | POST | ✅ |

### User/Profile Endpoints

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `UserApi.getProfile` | `/api/v1/profile/me` | GET | ✅ |
| `UserApi.updateProfile` | `/api/v1/profile/me` | PATCH | ✅ |
| `UserApi.getPublicProfile` | `/api/v1/users/:id` | GET | ✅ |

### Earnings Endpoints (Worker)

| Flutter Service | Backend Endpoint | Méthode | Protégé |
|-----------------|------------------|---------|---------|
| `EarningsApi.getSummary` | `/api/v1/earnings/summary` | GET | ✅ |
| `EarningsApi.getHistory` | `/api/v1/earnings/history` | GET | ✅ |

---

## 🔐 Authentication Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Flutter App   │──────│   ApiClient     │──────│   Backend API   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │  1. Login request      │                        │
        │───────────────────────>│                        │
        │                        │  POST /auth/login      │
        │                        │───────────────────────>│
        │                        │                        │
        │                        │  { token, user }       │
        │                        │<───────────────────────│
        │                        │                        │
        │  2. Store token        │                        │
        │<───────────────────────│                        │
        │  (TokenStorage)        │                        │
        │                        │                        │
        │  3. Authenticated req  │                        │
        │───────────────────────>│                        │
        │                        │  GET /missions         │
        │                        │  Authorization: Bearer │
        │                        │───────────────────────>│
        │                        │                        │
        │                        │  { data: [...] }       │
        │                        │<───────────────────────│
        │                        │                        │
        │  4. 401 Unauthorized   │                        │
        │<───────────────────────│<───────────────────────│
        │                        │                        │
        │  5. Token refresh      │                        │
        │───────────────────────>│  POST /auth/refresh    │
        │                        │───────────────────────>│
        │                        │  { newToken }          │
        │                        │<───────────────────────│
        │                        │                        │
        │  6. Retry original     │                        │
        │<───────────────────────│───────────────────────>│
```

---

## 🔄 Mission Lifecycle (Flutter → Backend)

```
OPEN (créée par employer)
  │
  ▼ Worker: POST /missions-local/:id/accept
ASSIGNED (worker assigné)
  │
  ▼ Worker: POST /missions-local/:id/start
IN_PROGRESS (travail en cours)
  │
  ▼ Worker: POST /missions-local/:id/complete
COMPLETED (terminée)
  │
  ▼ Both: POST /reviews (rating)
RATED
```

---

## ✅ Validation Status

| Critère | Statut | Preuve |
|---------|--------|--------|
| URLs configurées | ✅ | AppConfig.dart |
| Auth flow complet | ✅ | AuthService + TokenStorage |
| Missions CRUD | ✅ | MissionsApi.dart |
| Error handling | ✅ | Exceptions typées |
| Token refresh | ✅ | TokenRefreshInterceptor |
| Kill-switches | ✅ | AppConfig feature flags |
| Consent gate | ✅ | ComplianceApi |

---

## 📝 Notes

1. **Backend URL Production**: `workon-backend-production-8908.up.railway.app`
2. **API Version**: `/api/v1` (toutes les routes)
3. **Auth Header**: `Authorization: Bearer {token}`
4. **Content-Type**: `application/json`
5. **Correlation**: `X-Request-Id` header pour tracing

---

_Document généré automatiquement - Option C validation_
_2026-01-30_
