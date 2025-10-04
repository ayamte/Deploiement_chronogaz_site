import React from 'react';      
import { authService } from '../services/authService';      
      
// Import des différentes sidebars      
import ClientSidebar from './client/SideBar';  
import DriverSidebar from './chauffeur/DriverSidebar/DriverSidebar';  
import AdminSidebar from './admin/Sidebar/Sidebar';  
import EntrepriseSidebar from './entreprise/Sidebar/EntrepriseSidebar';  
import MagasinierSidebar from './magasinier/magasinierSidebar';  
      
const SidebarWrapper = () => {      
  const user = authService.getUser();      
        
  if (!user) return null;      
    
  switch (user.role) {      
    case 'CLIENT':    
      if (user.type === 'MORAL') {    
        return <EntrepriseSidebar userName={user.raison_sociale || 'Entreprise'} />;    
      }    
      return <ClientSidebar userName={user.first_name || user.raison_sociale || 'Client'} />;   
    case 'EMPLOYE':      
      return <DriverSidebar userName={user.first_name || 'Chauffeur'} />;  
    case 'EMPLOYE_MAGASIN': // AJOUTÉ: Cas manquant pour les magasiniers  
      return <MagasinierSidebar userName={user.first_name || 'Magasinier'} />;  
    case 'ADMIN':      
      return <AdminSidebar userName={user.first_name || 'Admin'} />;      
    default:      
      return null;      
  }      
};      
      
export default SidebarWrapper;