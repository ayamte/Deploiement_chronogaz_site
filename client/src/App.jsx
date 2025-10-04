import React, { useEffect, useState } from 'react';        
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';        
import { authService } from './services/authService';        
import FirstLoginModal from './components/FirstLoginModal/FirstLoginModal';  
  
import Home from './components/Home';        
import Dashboard from './pages/admin/Dashboard/Dashboard';        
import GestionCamion from './pages/admin/gestionCamion/gestionCamion'; 
import AjouterCamion from './pages/admin/AjouterCamion/AjouterCamion';        
import GestionClient from './pages/admin/gestionClient/gestionClient';        
import GestionChauffeur from './pages/admin/GestionChauffeur/GestionChauffeur';
import GestionFournisseur from './pages/admin/GestionFournisseur/GestionFournisseur';    
import GestionRegion from './pages/admin/gestionRegion/gestionRegion';    

import GestionBon from './pages/admin/gestionBon/gestionBon';        
import AjouterProduit from './pages/admin/AjouterProduit/AjouterProduit';   
import GestionListePrix from './pages/admin/GestionListePrix/GestionListePrix';   
import GestionUMs from './pages/admin/GestionUniteMesure/GestionUniteMesure';   

import SuiviCommande from './pages/admin/suiviCommande/suiviCommande';        
import OrderManagement from './pages/admin/OrderManagement/OrderManagement';       

import LoginPage from './pages/Login/login';        
import SignupPage from './pages/Signup/signup';        
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';  
import ResetPassword from './pages/ResetPassword/ResetPassword';  
import EmailVerification from './pages/EmailVerification/EmailVerification';  
import AuthCallback from './pages/AuthCallback/AuthCallback';
import CompleteProfile from './pages/CompleteProfile/CompleteProfile';
     
import NextOrderMap from './pages/chauffeur/NextOrderMap/NextOrderMap';        
import TruckUnloading from './pages/magasinier/TruckUnloading/TruckUnloading';        
import TruckLoading from './pages/magasinier/TruckLoading/TruckLoading';
import TruckLoadingHistory from './pages/magasinier/TruckLoadingHistory/TruckLoadingHistory';        
import RouteHistory from './pages/chauffeur/RouteHistory/RouteHistory';       
import SupplierVoucher from './pages/chauffeur/SupplierVoucher/SupplierVoucher';        
import StockManagement from './pages/magasinier/StockManagement/StockManagement';        
        
// Import depuis ghani-dev        
import Command from './pages/PagesClient/Command';        
import TrackOrder from './pages/PagesClient/TrackOrder';        
import OrderHistory from './pages/PagesClient/OrderHistory';        
import ServiceEvaluation from './pages/PagesClient/ServiceEvaluation';        
    
// Import des pages entreprise    
import EntrepriseGestionClient from './pages/entreprise/gestionClient/gestionClient';    
import EntrepriseSuiviCommande from './pages/entreprise/suiviCommande/suiviCommande';    
    
import SidebarWrapper from './components/SidebarWrapper';   
import Profile from './pages/Profile/Profile';   

import GestionStocksDepot from './pages/admin/GestionStocksDepot/GestionStocksDepot'
import GestionStock from './pages/admin/gestionStock/gestionStock'
import GestionDepot from './pages/admin/GestionDepot/GestionDepot'
import GestionProduits from './pages/admin/GestionProduits/GestionProduits'
import StockDepotManagement from './pages/magasinier/StockDepotManagement/StockDepotManagement';  
import StockLineManagement from './pages/magasinier/StockLineManagement/StockLineManagement';  
        
import './App.css';        
        
function App() {        
  const [isAuthenticated, setIsAuthenticated] = useState(false);        
  const [user, setUser] = useState(null);        
  const [loading, setLoading] = useState(true);  
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);        
        
  useEffect(() => {        
    // Vérifier l'authentification au démarrage avec gestion d'erreur      
    const checkAuth = () => {        
      try {      
        const authenticated = authService.isAuthenticated();        
        const userData = authService.getUser();        
                
        setIsAuthenticated(authenticated);        
        setUser(userData);  
          
        // Vérifier si l'utilisateur doit changer son mot de passe  
        if (authenticated && userData?.requiresPasswordChange && userData?.created_by_admin &&       
            (userData?.role === 'EMPLOYE' || userData?.role === 'EMPLOYE_MAGASIN' || userData?.role === 'CLIENT')) {    
          setShowFirstLoginModal(true);    
        }
      } catch (error) {      
        console.error('Erreur lors de la vérification auth:', error);      
        setIsAuthenticated(false);      
        setUser(null);      
      } finally {      
        setLoading(false);        
      }      
    };        
        
    checkAuth();        
  }, []);        
      
  // Vérification périodique du token expiré      
  useEffect(() => {      
    if (isAuthenticated) {      
      const interval = setInterval(() => {      
        if (authService.isTokenExpired && authService.isTokenExpired()) {      
          authService.logout();      
          setIsAuthenticated(false);      
          setUser(null);      
        }      
      }, 60000); // Vérifier chaque minute      
            
      return () => clearInterval(interval);      
    }      
  }, [isAuthenticated]);  
  
  // Gérer la fermeture du modal après changement de mot de passe  
  const handlePasswordChanged = () => {  
    setShowFirstLoginModal(false);  
    // Recharger les données utilisateur pour supprimer le flag requiresPasswordChange  
    const updatedUser = { ...user, requiresPasswordChange: false };  
    setUser(updatedUser);  
  };  
        
  // Composant pour protéger les routes        
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {        
    if (!isAuthenticated) {        
      window.location.href = '/login';        
      return null;        
    }        
        
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {        
      return (      
        <div style={{ padding: '20px', textAlign: 'center' }}>      
          <h2>Accès non autorisé</h2>      
          <p>Votre rôle ({user?.role}) ne permet pas d'accéder à cette page.</p>      
          <button onClick={() => window.location.href = '/'}>      
            Retour à l'accueil      
          </button>      
        </div>      
      );      
    }        
        
    return children;        
  };        
        
  if (loading) {        
    return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement de l'application...</div>;        
  }        
        
  return (        
    <Router>        
      <div className="App" style={{ display: 'flex' }}>        
        {/* Afficher la sidebar seulement si connecté */}        
        {isAuthenticated && <SidebarWrapper />}        
                
        <div style={{ flex: 1, padding: isAuthenticated ? '0px' : '0' }}>        
          <Routes>        
            {/* Routes publiques */}        
            <Route path="/login" element={<LoginPage />} />        
            <Route path="/signup" element={<SignupPage />} />        
            <Route path="/forgot-password" element={<ForgotPassword />} />  
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
     
            {/* Routes protégées pour admin */}        
            <Route         
              path="/dashboard"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <Dashboard />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/admin/gestion-camions"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionCamion />        
                </ProtectedRoute>        
              }         
            />  
            <Route         
              path="/admin/ajouter-camion"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <AjouterCamion />        
                </ProtectedRoute>        
              }         
            />   
 
            <Route   
              path="/admin/stocks-depot"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYE_MAGASIN']}>  
                  <GestionStocksDepot />  
                </ProtectedRoute>  
              }   
            /> 
            <Route   
              path="/admin/stocks"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYE_MAGASIN']}>  
                  <GestionStock />  
                </ProtectedRoute>  
              }   
            /> 
            <Route   
              path="/admin/gestion-depots"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN']}>  
                  <GestionDepot />  
                </ProtectedRoute>  
              }   
            />
            <Route   
              path="/admin/gestion-produits"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN']}>  
                  <GestionProduits />  
                </ProtectedRoute>  
              }   
            />
            <Route   
              path="/admin/gestion-liste-prix"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN']}>  
                  <GestionListePrix />  
                </ProtectedRoute>  
              }   
            />
            <Route   
              path="/admin/gestion-ums"   
              element={  
                <ProtectedRoute allowedRoles={['ADMIN']}>  
                  <GestionUMs />  
                </ProtectedRoute>  
              }   
            />
      
            <Route         
              path="/gestionclient"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionClient />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/gestion-chauffeur"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionChauffeur />        
                </ProtectedRoute>        
              }         
            /> 
            <Route         
              path="/gestion-fournisseur"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionFournisseur />        
                </ProtectedRoute>        
              }         
            />        
        
            <Route         
              path="/gestionregion"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionRegion />        
                </ProtectedRoute>        
              }         
            />  
            <Route         
              path="/gestionbon"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <GestionBon />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/ajouter-produit"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <AjouterProduit />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/suivicommande"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <SuiviCommande />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/gerer-commande"         
              element={        
                <ProtectedRoute allowedRoles={['ADMIN']}>        
                  <OrderManagement />        
                </ProtectedRoute>        
              }         
            />        
        
            {/* Routes protégées pour employés/chauffeurs */}        
            <Route 
              path="/chauffeur/chargement" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYE']}>
                  <TruckLoading />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/chauffeur/dechargement" 
              element={
                <ProtectedRoute allowedRoles={['EMPLOYE']}>
                  <TruckUnloading />
                </ProtectedRoute>
              }
            />

       
            <Route         
              path="/chauffeur/next-order"         
              element={        
                <ProtectedRoute allowedRoles={['EMPLOYE']}>        
                  <NextOrderMap />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/chauffeur/historique"         
              element={        
                <ProtectedRoute allowedRoles={['EMPLOYE']}>        
                  <RouteHistory />        
                </ProtectedRoute>        
              }         
            />        
      
            <Route         
              path="/chauffeur/supplier-voucher"         
              element={        
                <ProtectedRoute allowedRoles={['EMPLOYE', 'EMPLOYE_MAGASIN']}>          
                  <SupplierVoucher />        
                </ProtectedRoute>        
              }         
            />        
        
            {/* Routes protégées pour magasiniers */}        
            <Route         
              path="/magasin/gestion-stock"         
              element={        
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>        
                  <StockManagement />        
                </ProtectedRoute>        
              }         
            />        
            <Route         
              path="/magasin/chargement"         
              element={        
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>        
                  <TruckLoading />        
                </ProtectedRoute>          
              }           
            />          
            <Route           
              path="/magasin/dechargement"           
              element={          
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>          
                  <TruckUnloading />          
                </ProtectedRoute>          
              }           
            />          
            <Route     
              path="/magasinier/inventaires"     
              element={    
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>    
                  <StockDepotManagement />    
                </ProtectedRoute>    
              }     
            />    
            <Route     
              path="/magasinier/stock-lines/:stockDepotId"     
              element={    
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>    
                  <StockLineManagement />    
                </ProtectedRoute>    
              }     
            />
            <Route     
              path="/magasinier/historique-chargements"     
              element={    
                <ProtectedRoute allowedRoles={['EMPLOYE_MAGASIN']}>    
                  <TruckLoadingHistory />    
                </ProtectedRoute>    
              }     
            />  
          
            {/* Routes protégées pour clients */}          
            <Route           
              path="/Command"           
              element={          
                <ProtectedRoute allowedRoles={['CLIENT']}>          
                  <Command />          
                </ProtectedRoute>          
              }           
            />          
            <Route             
  path="/Trackorder"             
  element={            
    <ProtectedRoute allowedRoles={['CLIENT']}>            
      <TrackOrder />            
    </ProtectedRoute>            
  }             
/>
<Route             
  path="/Trackorder/:orderId"             
  element={            
    <ProtectedRoute allowedRoles={['CLIENT']}>            
      <TrackOrder />            
    </ProtectedRoute>            
  }             
/>        
            <Route           
              path="/Orderhistory"           
              element={          
                <ProtectedRoute allowedRoles={['CLIENT']}>          
                  <OrderHistory />          
                </ProtectedRoute>          
              }           
            />          
            <Route             
              path="/Serviceevaluation/:livraisonId"             
              element={            
                <ProtectedRoute allowedRoles={['CLIENT']}>            
                  <ServiceEvaluation />            
                </ProtectedRoute>            
              }             
            />  
             <Route     
              path="/profile"     
              element={    
                <ProtectedRoute allowedRoles={['CLIENT']}>    
                  <Profile />    
                </ProtectedRoute>    
              }     
            />  
    
            {/* Routes protégées pour entreprises */}    
            <Route           
              path="/entreprise/gestion-clients"           
              element={          
                <ProtectedRoute allowedRoles={['CLIENT']}>          
                  <EntrepriseGestionClient />          
                </ProtectedRoute>          
              }           
            />    
            <Route           
              path="/entreprise/suivi-commandes"           
              element={          
                <ProtectedRoute allowedRoles={['CLIENT']}>          
                  <EntrepriseSuiviCommande />          
                </ProtectedRoute>          
              }           
            />    
                      
            {/* Redirection par défaut */}          
            <Route           
              path="/"           
              element={isAuthenticated ? <Home /> : <LoginPage />}           
            />          
          </Routes>          
        </div>    
    
        {/* Modal de première connexion */}    
        {showFirstLoginModal && (    
          <FirstLoginModal onPasswordChanged={handlePasswordChanged} />    
        )}    
      </div>          
    </Router>          
  );          
}          
          
export default App;