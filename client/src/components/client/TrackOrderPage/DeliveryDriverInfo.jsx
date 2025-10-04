import React from "react";  
  
const DeliveryDriverInfo = ({ driver, isVisible }) => {  
  if (!isVisible) return null;  
  
  // Vérification de la validité des données du chauffeur  
  if (!driver || !driver.name) {  
    return null;  
  }  
  
  return (  
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">  
      <h3 className="text-xl font-bold mb-4" style={{color: '#245FA6'}}>  
        Informations du livreur  
      </h3>  
        
      <div className="border-2 border-gray-200 rounded-lg p-4">  
        <div className="flex items-center space-x-4">  
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white"   
               style={{backgroundColor: '#4DAEBD'}}>  
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">  
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>  
            </svg>  
          </div>  
            
          <div className="flex-1">  
            <h4 className="text-lg font-bold text-gray-900">{driver.name}</h4>  
            <p className="text-gray-600 text-sm mb-2">{driver.vehicle || 'Véhicule non spécifié'}</p>  
              
            <div className="flex items-center space-x-2">  
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#4DAEBD">  
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>  
              </svg>  
              <span className="text-sm font-medium">{driver.phone || 'Téléphone non disponible'}</span>  
            </div>  
          </div>  
            

        </div>  
      </div>  
    </div>  
  );  
};  
  
export default DeliveryDriverInfo;