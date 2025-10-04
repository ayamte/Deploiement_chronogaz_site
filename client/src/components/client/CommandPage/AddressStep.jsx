import React, { useState, useEffect } from 'react';  
import { MapPin, Navigation, ArrowLeft, ArrowRight, Home, Building, Map } from 'lucide-react';  
import api from '../../../services/api'; 


const updateAddressCoordinates = async (addressId, latitude, longitude) => {    
  try {    
    await api.put(`/addresses/${addressId}`, {    
      latitude,    
      longitude    
    });    
  } catch (error) {    
    console.error('Erreur mise à jour coordonnées:', error);    
  }    
};  
  
const AddressStep = ({  
  useGPS,  
  setUseGPS,  
  address,  
  setAddress,  
  gpsLocation,  
  onGPSLocation,  
  onBack,  
  onNext,  
  canProceed,  
  clientAddresses = [],  
  loadingClient = false,  
  cities = [],  
  loadingLocations = false,  
  selectedExistingAddress,  
  setSelectedExistingAddress  
}) => {  
  const [addressMode, setAddressMode] = useState('new');
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState(null);
    
  const [newAddressData, setNewAddressData] = useState({  
    numappt: '',  
    numimmeuble: '',  
    street: '',  
    quartier: '',  
    city_id: '',  
    postal_code: '',  
    telephone: '',  
    instructions_livraison: '',  
    latitude: null,  
    longitude: null,  
    type_adresse: 'LIVRAISON'  
  });  

  const handleInputChange = (field, value) => {  
    setNewAddressData(prev => ({  
      ...prev,  
      [field]: value  
    }));  
  };  
  
  // ✅ Amélioration du système GPS avec options multiples
  const handleUseGPS = () => {  
    setUseGPS(true);  
    setAddressMode('gps');  
    setSelectedExistingAddress(null);
    setShowMapSelector(true);
    
    // Proposer la géolocalisation automatique
    onGPSLocation();
  };

  // ✅ Nouvelle fonction pour sélection manuelle sur carte
  const handleManualLocationSelect = (coordinates) => {
    setManualCoordinates(coordinates);
    setAddress({
      use_existing_address: false,
      new_address: {
        street: 'Position sélectionnée sur carte',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        type_adresse: 'LIVRAISON'
      }
    });
  };
  
  // ✅ Amélioration de la gestion des adresses existantes
  const handleSelectExistingAddress = (addr) => {      
    setAddressMode('existing');      
    setUseGPS(false);      
    setSelectedExistingAddress(addr);      
      
    // ✅ NOUVEAU: Vérifier si les coordonnées GPS sont manquantes  
    if (!addr.latitude || !addr.longitude) {  
      // Demander la géolocalisation si coordonnées manquantes  
      if (navigator.geolocation) {  
        navigator.geolocation.getCurrentPosition(  
          async (position) => {  
            const { latitude, longitude } = position.coords;  
              
            // Mettre à jour l'adresse avec les nouvelles coordonnées  
            await updateAddressCoordinates(addr._id, latitude, longitude);  
              
            // Mettre à jour l'état local avec les coordonnées  
            addr.latitude = latitude;  
            addr.longitude = longitude;  
          },  
          (error) => {  
            console.error('Erreur géolocalisation:', error);  
            alert('Impossible d\'obtenir votre position. L\'adresse sera utilisée sans coordonnées GPS.');  
          }  
        );  
      }  
    }  
          
    // Structure correcte pour le service de commande avec données complètes  
    setAddress({      
      use_existing_address: true,  
      address_id: addr._id,  
      // Inclure les données complètes pour validation  
      existing_address_data: {  
        street: addr.street,  
        city_id: addr.city_id?._id || addr.city?._id,  
        telephone: addr.telephone,  
        latitude: addr.latitude,  
        longitude: addr.longitude,  
        type_adresse: addr.type_adresse,  
        numappt: addr.numappt,  
        numimmeuble: addr.numimmeuble,  
        quartier: addr.quartier,  
        postal_code: addr.postal_code,  
        instructions_livraison: addr.instructions_livraison  
      }  
    });      
  };
    
  const handleNewAddress = () => {    
    setAddressMode('new');    
    setUseGPS(false);    
    setSelectedExistingAddress(null);
    setShowMapSelector(false);
        
    const emptyAddressData = {    
      numappt: '',    
      numimmeuble: '',    
      street: '',    
      quartier: '',    
      city_id: '',    
      postal_code: '',    
      telephone: '',    
      instructions_livraison: '',    
      latitude: null,    
      longitude: null,    
      type_adresse: 'LIVRAISON'    
    };  
      
    setNewAddressData(emptyAddressData);    
        
    setAddress({    
      use_existing_address: false,    
      new_address: emptyAddressData
    });    
  };
    
  const handleGetCurrentLocation = () => {  
    if (navigator.geolocation) {  
      navigator.geolocation.getCurrentPosition(  
        (position) => {  
          const { latitude, longitude } = position.coords;  
          setNewAddressData(prev => ({  
            ...prev,  
            latitude,  
            longitude  
          }));  
            
          setAddress(prev => ({  
            ...prev,  
            new_address: {  
              ...prev.new_address,  
              latitude,  
              longitude  
            }  
          }));  
        },  
        (error) => {  
          console.error('Erreur géolocalisation:', error);  
          alert('Impossible d\'obtenir votre position');  
        }  
      );  
    }  
  };

  // ✅ Composant carte interactive simple (peut être remplacé par Leaflet/Google Maps)
  const MapSelector = () => (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h5 className="font-medium text-gray-800 mb-3">Sélectionner sur la carte</h5>
      <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Map size={48} className="mx-auto mb-2" />
          <p>Interface carte interactive</p>
          <p className="text-sm">(Intégration Leaflet/Google Maps à venir)</p>
          <button 
            onClick={() => handleManualLocationSelect({
              latitude: 33.5731,
              longitude: -7.5898
            })}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Utiliser position exemple (Casablanca)
          </button>
        </div>
      </div>
    </div>
  );
  
  useEffect(() => {  
    if (addressMode === 'new') {  
      setAddress({  
        use_existing_address: false,  
        new_address: newAddressData  
      });  
    }  
  }, [newAddressData, addressMode, setAddress]);  
  
  return (  
    <div className="bg-white rounded-lg shadow-md p-8">  
      <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">  
        Adresse de livraison  
      </h2>  
  
      {/* Options de sélection d'adresse */}  
      <div className="mb-8 space-y-4">  
       
  
        {/* Adresses sauvegardées améliorées */}  
        {clientAddresses.length > 0 && (  
          <div>  
            <div   
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${  
                addressMode === 'existing'   
                  ? 'border-blue-500 bg-blue-50'   
                  : 'border-gray-300 hover:border-blue-300'  
              }`}  
              onClick={() => setAddressMode('existing')}  
            >  
              <div className="flex items-center space-x-3">  
                <input  
                  type="radio"  
                  name="addressType"  
                  checked={addressMode === 'existing'}  
                  onChange={() => setAddressMode('existing')}  
                  className="w-4 h-4 text-blue-600"  
                />  
                <Home className="text-blue-600" size={24} />  
                <div>  
                  <h3 className="text-lg font-semibold text-blue-900">  
                    Choisir une adresse sauvegardée  
                  </h3>  
                  <p className="text-gray-600 text-sm">  
                    {clientAddresses.length} adresse(s) disponible(s)  
                  </p>  
                </div>  
              </div>  
            </div>  
  
            {addressMode === 'existing' && (  
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">  
                {clientAddresses.map((addr) => (  
                  <div  
                    key={addr._id}  
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${  
                      selectedExistingAddress?._id === addr._id  
                        ? 'border-blue-500 bg-blue-50'  
                        : 'border-gray-200 hover:border-blue-300'  
                    }`}  
                    onClick={() => handleSelectExistingAddress(addr)}  
                  >  
                    <div className="flex items-start space-x-3">  
                      <Building className="text-gray-500 mt-1" size={16} />  
                      <div className="flex-1">  
                        <p className="font-medium text-gray-800">  
                          {addr.type_adresse || 'Adresse'}  
                          {addr.is_principal && (  
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">  
                              Principal  
                            </span>  
                          )}  
                        </p>  
                        <p className="text-sm text-gray-600 mt-1">  
                          {addr.numimmeuble && `Imm. ${addr.numimmeuble}, `}  
                          {addr.numappt && `Apt. ${addr.numappt}, `}  
                          {addr.street}  
                        </p>  
                        <p className="text-sm text-gray-600">  
                          {addr.quartier && `${addr.quartier}, `}  
                          {addr.postal_code && `${addr.postal_code}, `}  
                          {addr.city_id?.name || addr.city?.name || 'Casablanca'}
                        </p>
                        {addr.telephone && (
                          <p className="text-sm text-gray-500">
                            Tél: {addr.telephone}
                          </p>
                        )}
                      </div>  
                    </div>  
                  </div>  
                ))}  
              </div>  
            )}  
          </div>  
        )}  
  
        {/* Nouvelle adresse */}  
        <div   
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${  
            addressMode === 'new'   
              ? 'border-blue-500 bg-blue-50'   
              : 'border-gray-300 hover:border-blue-300'  
          }`}  
          onClick={handleNewAddress}  
        >  
          <div className="flex items-center space-x-3">  
            <input  
              type="radio"  
              name="addressType"  
              checked={addressMode === 'new'}  
              onChange={handleNewAddress}  
              className="w-4 h-4 text-blue-600"  
            />  
            <MapPin className="text-blue-600" size={24} />  
            <div>  
              <h3 className="text-lg font-semibold text-blue-900">  
                Saisir une nouvelle adresse  
              </h3>  
              <p className="text-gray-600 text-sm">  
                Cette adresse sera sauvegardée dans votre profil  
              </p>  
            </div>  
          </div>  
        </div>  
      </div>  
  
      {/* Formulaire nouvelle adresse */}    
      {addressMode === 'new' && (    
        <div className="border-t pt-6">    
          <h4 className="text-lg font-semibold text-gray-800 mb-4">    
            Informations de l'adresse    
          </h4>    
              
          {/* Géolocalisation pour nouvelle adresse */}    
          <div className="mb-4">    
            <button    
              type="button"    
              onClick={handleGetCurrentLocation}    
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"    
            >    
              <Navigation className="mr-2" size={16} />    
              Obtenir ma position actuelle    
            </button>    
            {newAddressData.latitude && newAddressData.longitude && (    
              <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">    
                ✓ Position: {newAddressData.latitude.toFixed(6)}, {newAddressData.longitude.toFixed(6)}    
              </div>    
            )}    
          </div>    
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Numéro d'appartement    
              </label>    
              <input    
                type="text"    
                value={newAddressData.numappt}    
                onChange={(e) => handleInputChange('numappt', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: 12"    
              />    
            </div>    
    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Numéro d'immeuble    
              </label>    
              <input    
                type="text"    
                value={newAddressData.numimmeuble}    
                onChange={(e) => handleInputChange('numimmeuble', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: 45"    
              />    
            </div>    
    
            <div className="md:col-span-2">    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Rue *    
              </label>    
              <input    
                type="text"    
                value={newAddressData.street}    
                onChange={(e) => handleInputChange('street', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: Avenue Mohammed V"    
                required    
              />    
            </div>    
    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Quartier    
              </label>    
              <input    
                type="text"    
                value={newAddressData.quartier}    
                onChange={(e) => handleInputChange('quartier', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: Maarif"    
              />    
            </div>    
    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Code postal    
              </label>    
              <input    
                type="text"    
                value={newAddressData.postal_code}    
                onChange={(e) => handleInputChange('postal_code', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: 20000"    
              />    
            </div>    
    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Ville *    
              </label>    
              <select    
                value={newAddressData.city_id}    
                onChange={(e) => handleInputChange('city_id', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                required    
                disabled={loadingLocations}    
              >    
                <option value="">Sélectionner une ville</option>    
                {cities.map(city => (    
                  <option key={city._id} value={city._id}>    
                    {city.nom || city.name}    
                  </option>    
                ))}    
              </select>    
            </div>    
    
            <div>    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Téléphone *    
              </label>    
              <input    
                type="tel"    
                value={newAddressData.telephone}    
                onChange={(e) => handleInputChange('telephone', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                placeholder="Ex: 0612345678"    
                required    
              />    
            </div>    
    
            <div className="md:col-span-2">    
              <label className="block text-sm font-medium text-gray-700 mb-2">    
                Instructions de livraison (optionnel)    
              </label>    
              <textarea    
                value={newAddressData.instructions_livraison}    
                onChange={(e) => handleInputChange('instructions_livraison', e.target.value)}    
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"    
                rows="3"    
                placeholder="Instructions spéciales pour la livraison..."    
              />    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* Affichage de l'adresse GPS */}    
      {addressMode === 'gps' && (gpsLocation || manualCoordinates) && (    
        <div className="border-t pt-6">    
          <h4 className="text-lg font-semibold text-gray-800 mb-4">    
            Position GPS sélectionnée    
          </h4>    
          <div className="bg-green-50 p-4 rounded-lg">    
            {gpsLocation && (  
              <>  
                <p className="text-green-800 font-medium">    
                  ✓ Position automatique détectée    
                </p>  
                <p className="text-green-800 text-sm">    
                  Latitude: {gpsLocation.latitude.toFixed(6)} | Longitude: {gpsLocation.longitude.toFixed(6)}    
                </p>    
              </>  
            )}  
            {manualCoordinates && (  
              <>  
                <p className="text-blue-800 font-medium">    
                  ✓ Position sélectionnée sur carte    
                </p>  
                <p className="text-blue-800 text-sm">    
                  Latitude: {manualCoordinates.latitude.toFixed(6)} | Longitude: {manualCoordinates.longitude.toFixed(6)}    
                </p>    
              </>  
            )}  
          </div>    
        </div>    
      )}    
    
      {/* Affichage des informations de l'adresse existante sélectionnée */}    
      {addressMode === 'existing' && selectedExistingAddress && (    
        <div className="border-t pt-6">    
          <h4 className="text-lg font-semibold text-gray-800 mb-4">    
            Adresse sélectionnée    
          </h4>    
          <div className="bg-blue-50 p-4 rounded-lg">    
            <div className="flex items-start space-x-3">    
              <Building className="text-blue-600 mt-1" size={20} />    
              <div className="flex-1">    
                <p className="font-medium text-gray-800">    
                  {selectedExistingAddress.type_adresse || 'Adresse'}    
                  {selectedExistingAddress.is_principal && (    
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">    
                      Principal    
                    </span>    
                  )}    
                </p>    
                <p className="text-sm text-gray-600 mt-1">    
                  {selectedExistingAddress.numimmeuble && `Imm. ${selectedExistingAddress.numimmeuble}, `}    
                  {selectedExistingAddress.numappt && `Apt. ${selectedExistingAddress.numappt}, `}    
                  {selectedExistingAddress.street}    
                </p>    
                <p className="text-sm text-gray-600">    
                  {selectedExistingAddress.quartier && `${selectedExistingAddress.quartier}, `}    
                  {selectedExistingAddress.postal_code && `${selectedExistingAddress.postal_code}, `}    
                  {selectedExistingAddress.city_id?.name || selectedExistingAddress.city?.name || 'Casablanca'}    
                </p>    
                {selectedExistingAddress.telephone && (    
                  <p className="text-sm text-gray-600">    
                    Tél: {selectedExistingAddress.telephone}    
                  </p>    
                )}    
                {selectedExistingAddress.instructions_livraison && (    
                  <p className="text-sm text-gray-500 mt-2">    
                    Instructions: {selectedExistingAddress.instructions_livraison}    
                  </p>    
                )}    
                {(selectedExistingAddress.latitude && selectedExistingAddress.longitude) && (  
                  <p className="text-sm text-gray-500 mt-1">  
                    GPS: {selectedExistingAddress.latitude.toFixed(6)}, {selectedExistingAddress.longitude.toFixed(6)}  
                  </p>  
                )}  
              </div>    
            </div>    
          </div>    
        </div>    
      )}    
    
      {/* Navigation buttons */}    
      <div className="flex justify-between mt-8">    
        <button    
          onClick={onBack}    
          className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"    
        >    
          <ArrowLeft className="mr-2" size={20} />    
          Retour    
        </button>    
              
        <button    
          onClick={onNext}    
          disabled={!canProceed}    
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${    
            canProceed    
              ? 'bg-blue-700 text-white hover:bg-blue-800'    
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'    
          }`}    
        >    
          Continuer    
          <ArrowRight className="ml-2" size={20} />    
        </button>    
      </div>    
    </div>    
  );    
};    
    
export default AddressStep;