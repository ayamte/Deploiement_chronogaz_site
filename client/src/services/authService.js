import { redirectToLogin, redirectUserByRole } from '../utils/redirectUtils';  
  
export const authService = {  
  // Stocker le token JWT  
  setToken: (token) => {  
    localStorage.setItem('token', token);  
  },  
  
  // Récupérer le token JWT  
  getToken: () => {  
    return localStorage.getItem('token');  
  },  
  
  // Stocker les informations utilisateur  
  setUser: (user) => {  
    localStorage.setItem('user', JSON.stringify(user));  
  },  
  
  // Récupérer les informations utilisateur  
  getUser: () => {  
    const user = localStorage.getItem('user');  
    return user ? JSON.parse(user) : null;  
  },  
  
  // Vérifier si l'utilisateur est connecté  
  isAuthenticated: () => {  
    const token = localStorage.getItem('token');  
    return !!token;  
  },  
  
  // Vérifier le rôle de l'utilisateur  
  hasRole: (role) => {  
    const user = authService.getUser();  
    return user && user.role === role;  
  },  
  
  // Vérifier si l'utilisateur a l'un des rôles autorisés  
  hasAnyRole: (roles) => {  
    const user = authService.getUser();  
    return user && roles.includes(user.role);  
  },  
  
  // Déconnexion complète avec redirection centralisée  
  logout: () => {  
    localStorage.removeItem('token');  
    localStorage.removeItem('user');  
    // Utiliser redirectUtils au lieu de window.location.href direct  
    redirectToLogin();  
  },  
  
  // Nettoyer le stockage (utile pour le debugging)  
  clearStorage: () => {  
    localStorage.removeItem('token');  
    localStorage.removeItem('user');  
  },  
  
  // Vérifier si le token est expiré (optionnel)  
  isTokenExpired: () => {  
    const token = authService.getToken();  
    if (!token) return true;  
  
    try {  
      // Décoder le payload JWT (partie centrale)  
      const payload = JSON.parse(atob(token.split('.')[1]));  
      const currentTime = Date.now() / 1000;  
        
      return payload.exp < currentTime;  
    } catch (error) {  
      console.error('Erreur lors de la vérification du token:', error);  
      return true;  
    }  
  },  
  
  // Obtenir les informations du token décodé  
  getTokenInfo: () => {  
    const token = authService.getToken();  
    if (!token) return null;  
  
    try {  
      const payload = JSON.parse(atob(token.split('.')[1]));  
      return {  
        userId: payload.userId,  
        email: payload.email,  
        role: payload.role,  
        exp: payload.exp,  
        iat: payload.iat  
      };  
    } catch (error) {  
      console.error('Erreur lors du décodage du token:', error);  
      return null;  
    }  
  },  
  
  // Nouvelle méthode : Redirection automatique selon le rôle  
  redirectToUserHome: () => {  
    const user = authService.getUser();  
    if (user && user.role) {  
      redirectUserByRole(user.role);  
    } else {  
      redirectToLogin();  
    }  
  },  
  
  // Nouvelle méthode : Déconnexion avec nettoyage automatique des tokens expirés  
  logoutIfExpired: () => {  
    if (authService.isTokenExpired()) {  
      authService.logout();  
      return true;  
    }  
    return false;  
  }  
};  
  
// Export par défaut pour une utilisation plus flexible  
export default authService;