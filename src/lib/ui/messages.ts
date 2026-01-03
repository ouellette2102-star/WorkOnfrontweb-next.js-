/**
 * UI Messages - WorkOn
 * 
 * Messages centralisés pour l'authentification, la configuration et les états d'erreur.
 * Anti-bullshit: clairs, courts, actionnables.
 * 
 * Usage:
 *   import { UI_MESSAGES } from "@/lib/ui/messages";
 *   <p>{UI_MESSAGES.AUTH_REQUIRED}</p>
 */

export const UI_MESSAGES = {
  // Auth states
  AUTH_REQUIRED: "Connexion requise",
  AUTH_REQUIRED_DESC: "Connecte-toi pour accéder à cette page.",
  SIGN_IN: "Se connecter",
  SIGN_OUT: "Se déconnecter",
  
  // Config states  
  CONFIG_REQUIRED: "Configuration requise",
  CONFIG_REQUIRED_DESC: "L'application nécessite une configuration.",
  SETUP_LINK: "Voir la configuration",
  
  // Navigation
  GO_HOME: "Retour à l'accueil",
  GO_BACK: "Retour",
  TRY_AGAIN: "Réessayer",
  
  // Empty states
  NO_DATA: "Aucune donnée",
  NO_RESULTS: "Aucun résultat",
  LOADING: "Chargement...",
  
  // Errors
  ERROR_GENERIC: "Une erreur s'est produite",
  ERROR_NETWORK: "Erreur de connexion",
  ERROR_SERVER: "Le serveur ne répond pas",
  
  // Feed
  FEED_EMPTY: "Le fil est vide",
  FEED_EMPTY_DESC: "Aucune publication pour l'instant.",
  FEED_ERROR: "Impossible de charger le fil",
} as const;

export type UIMessageKey = keyof typeof UI_MESSAGES;

