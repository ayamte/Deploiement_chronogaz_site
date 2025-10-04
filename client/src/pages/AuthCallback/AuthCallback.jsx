import { useEffect } from 'react';  
import { useLocation, useNavigate } from 'react-router-dom';  
import { authService } from '../../services/authService';  
import { redirectUserByRole } from '../../utils/redirectUtils';  
  
const AuthCallback = () => {  
  const location = useLocation();  
  const navigate = useNavigate();  
    
  useEffect(() => {  
    const urlParams = new URLSearchParams(location.search);  
    const token = urlParams.get('token');  
    const needsCompletion = urlParams.get('complete');  
      
    if (token) {  
      try {  
        // Stocker le token d'abord  
        authService.setToken(token);  
          
        if (needsCompletion === 'true') {  
          // Rediriger vers la page de complétion de profil  
          navigate('/complete-profile');  
        } else {  
          // Récupérer le profil complet et rediriger normalement  
          fetchUserProfile();  
        }  
          
      } catch (error) {  
        console.error('Erreur lors du traitement du token:', error);  
        navigate('/login');  
      }  
    } else {  
      navigate('/login');  
    }  
  }, [location, navigate]);  
    
  const fetchUserProfile = async () => {  
    try {  
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/profile`, {  
        method: 'GET',  
        headers: {  
          'Authorization': `Bearer ${authService.getToken()}`,  
          'Content-Type': 'application/json'  
        }  
      });  
        
      const data = await response.json();  
        
      if (data.success) {  
        // Créer l'objet utilisateur avec la structure attendue par votre système  
        const completeUser = {  
          id: data.data.id,  
          email: data.data.email,  
          role: data.data.role,  
          statut: data.data.statut,  
          // Aplatir la structure profile pour compatibilité  
          type: data.data.profile?.type,  
          first_name: data.data.profile?.first_name,  
          last_name: data.data.profile?.last_name,  
          raison_sociale: data.data.profile?.raison_sociale,  
          physical_user_id: data.data.profile?.physical_user_id,  
          moral_user_id: data.data.profile?.moral_user_id,  
          // Garder aussi l'objet profile complet si nécessaire  
          profile: data.data.profile  
        };  
          
        authService.setUser(completeUser);  
        redirectUserByRole(completeUser.role, completeUser.type); 
      } else {  
        throw new Error('Impossible de récupérer le profil utilisateur');  
      }  
    } catch (error) {  
      console.error('Erreur lors de la récupération du profil:', error);  
      navigate('/login');  
    }  
  };  
    
  return (  
    <div className="auth-callback-container">  
      <div className="auth-callback-content">  
        <div className="loading-spinner"></div>  
        <h2>Connexion en cours...</h2>  
        <p>Veuillez patienter pendant que nous finalisons votre connexion.</p>  
      </div>  
    </div>  
  );  
};  
  
export default AuthCallback;