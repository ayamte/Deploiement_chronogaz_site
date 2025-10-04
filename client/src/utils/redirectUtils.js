/**      
 * Redirige l'utilisateur vers la page appropriée selon son rôle et type      
 * @param {string} role - Le rôle de l'utilisateur (ADMIN, CLIENT, EMPLOYE, EMPLOYE_MAGASIN)      
 * @param {string} userType - Le type d'utilisateur (PHYSIQUE, MORAL)      
 */      
export const redirectUserByRole = (role, userType) => {      
  switch (role) {      
    case 'ADMIN':      
      window.location.href = '/dashboard';      
      break;      
    case 'CLIENT':  
      // CORRIGÉ: Différencier entre particulier et entreprise  
      if (userType === 'MORAL') {  
        window.location.href = '/entreprise/gestion-clients';  
      } else {  
        window.location.href = '/Command';  
      }  
      break;      
    case 'EMPLOYE':      
      window.location.href = '/chauffeur/next-order';      
      break;      
    case 'EMPLOYE_MAGASIN':      
      window.location.href = '/magasinier/inventaires';      
      break;      
    default:      
      window.location.href = '/';      
  }      
};      
    
/**      
 * Redirige vers la page de connexion      
 */      
export const redirectToLogin = () => {      
  window.location.href = '/login';      
};      
    
/**      
 * Redirige vers la page d'inscription      
 */      
export const redirectToSignup = () => {      
  window.location.href = '/signup';      
};      
    
/**      
 * Redirige vers la page d'accueil      
 */      
export const redirectToHome = () => {      
  window.location.href = '/';      
};      
    
/**      
 * Redirige vers une page spécifique avec gestion d'erreur      
 * @param {string} path - Le chemin vers lequel rediriger      
 */      
export const redirectTo = (path) => {      
  try {      
    window.location.href = path;      
  } catch (error) {      
    console.error('Erreur lors de la redirection:', error);      
    // Fallback vers la page d'accueil      
    window.location.href = '/';      
  }      
};      
    
/**      
 * Obtient la page d'accueil par défaut selon le rôle et type      
 * @param {string} role - Le rôle de l'utilisateur      
 * @param {string} userType - Le type d'utilisateur (PHYSIQUE, MORAL)      
 * @returns {string} - Le chemin de la page d'accueil      
 */      
export const getDefaultPageByRole = (role, userType) => {      
  switch (role) {      
    case 'ADMIN':      
      return '/dashboard';      
    case 'CLIENT':  
      if (userType === 'MORAL') {  
        return '/entreprise/gestion-clients';  
      } else {  
        return '/Command';  
      }      
    case 'EMPLOYE':      
      return '/chauffeur/dailyroutepage';      
    case 'EMPLOYE_MAGASIN':      
      return '/magasin/gestion-stock';      
    default:      
      return '/';      
  }      
};      
    
/**      
 * Vérifie si l'utilisateur a accès à une route spécifique      
 * @param {string} role - Le rôle de l'utilisateur      
 * @param {string} path - Le chemin à vérifier      
 * @param {string} userType - Le type d'utilisateur (PHYSIQUE, MORAL)      
 * @returns {boolean} - True si l'utilisateur a accès      
 */      
export const hasAccessToRoute = (role, path, userType) => {      
  const adminRoutes = [      
    '/dashboard', '/gestioncamion', '/infoCamion', '/gestionclient',      
    '/gestion-chauffeur', '/gestionregion', '/gestionbon',       
    '/ajouter-produit', '/suivicommande', '/gerer-commande'      
  ];      
        
  const clientRoutes = [      
    '/Command', '/Trackorder', '/Orderhistory', '/Serviceevaluation',  
    '/profile'  // AJOUTÉ: Route profile pour tous les clients  
  ];  
  
  const entrepriseRoutes = [  
    '/entreprise/gestion-clients', '/entreprise/suivi-commandes',  
    '/profile'  // AJOUTÉ: Route profile pour les entreprises aussi  
  ];      
        
  const employeRoutes = [      
    '/chauffeur/dailyroutepage', '/chauffeur/next-order',       
    '/chauffeur/historique', '/chauffeur/end-route',       
    '/chauffeur/supplier-voucher'      
  ];      
    
  const magasinRoutes = [      
    '/magasin/gestion-stock', '/magasin/chargement', '/magasin/dechargement'      
  ];      
    
  switch (role) {      
    case 'ADMIN':      
      return adminRoutes.some(route => path.startsWith(route));      
    case 'CLIENT':  
      if (userType === 'MORAL') {  
        return entrepriseRoutes.some(route => path.startsWith(route));  
      } else {  
        return clientRoutes.some(route => path.startsWith(route));  
      }      
    case 'EMPLOYE':      
      return employeRoutes.some(route => path.startsWith(route));      
    case 'EMPLOYE_MAGASIN':      
      return magasinRoutes.some(route => path.startsWith(route));      
    default:      
      return false;      
  }      
};