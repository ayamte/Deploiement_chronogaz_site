import React, { useState, useEffect } from 'react';          
import Title from '../../components/client/CommandPage/Title';          
import StepsIndicator from '../../components/client/CommandPage/StepsIndicator';          
import QuantityStep from '../../components/client/CommandPage/QuantityStep';          
import AddressStep from '../../components/client/CommandPage/AddressStep';          
import SummaryStep from '../../components/client/CommandPage/SummaryStep';          
import { authService } from '../../services/authService';        
import productService from '../../services/productService';        
import listePrixService from '../../services/listePrixService';        
import { createOrderFromSteps } from '../../services/orderService';        
import './Command.css'; 
          
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';        
        
const Command = () => {        
  const [currentStep, setCurrentStep] = useState(1);        
  const [quantities, setQuantities] = useState({});        
  const [useGPS, setUseGPS] = useState(false);        
    
  // ✅ Structure d'adresse améliorée pour supporter les différents modes  
  const [address, setAddress] = useState({  
    use_existing_address: false,  
    address_id: null,  
    new_address: {  
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
    },  
    existing_address_data: null  
  });         
    
  const [gpsLocation, setGpsLocation] = useState(null);        
  const [clientData, setClientData] = useState(null);        
  const [clientAddresses, setClientAddresses] = useState([]);        
  const [loadingClient, setLoadingClient] = useState(false);        
        
  const [selectedExistingAddress, setSelectedExistingAddress] = useState(null);      
        
  // États pour les produits depuis l'API        
  const [products, setProducts] = useState([]);        
  const [prices, setPrices] = useState({});        
  const [loading, setLoading] = useState(true);        
  const [error, setError] = useState(null);        
        
  const [cities, setCities] = useState([]);        
  const [loadingLocations, setLoadingLocations] = useState(false);        
      
  const deliveryFee = 20;        
      
  // Charger seulement les villes depuis l'API        
  const loadCities = async () => {        
    try {        
      setLoadingLocations(true);        
      const citiesResponse = await fetch(`${API_BASE_URL}/api/locations/cities`);        
              
      if (citiesResponse.ok) {        
        const citiesData = await citiesResponse.json();        
        setCities(citiesData.data || []);        
      }        
    } catch (error) {        
      console.error('Erreur lors du chargement des villes:', error);        
    } finally {        
      setLoadingLocations(false);        
    }        
  };        
      
  // Charger les produits et prix depuis l'architecture centralisée        
  const loadProductsWithPrices = async () => {          
    try {          
      setLoading(true);          
              
      // Charger les produits actifs        
      const productsResponse = await productService.getAllProducts({ actif: true }); 
      console.log('Réponse produits:', productsResponse); // Affichez la réponse de l'API
         
                
      if (productsResponse.success && productsResponse.data) {          
        const allProducts = productsResponse.data;          
                  
        // Charger les prix depuis les listes de prix actives        
        try {        
          const pricesResponse = await listePrixService.getActivePrices();  
          console.log('Réponse prix:', pricesResponse); // Affichez la réponse de l'API
      
          const pricesMap = {};        
          const productsWithPrices = [];        
                  
          if (pricesResponse.success && pricesResponse.data) {        
            // Créer un map des prix par product_id        
            pricesResponse.data.forEach(prixItem => {        
              pricesMap[prixItem.product_id] = prixItem.prix;        
            });        
                    
            // Filtrer seulement les produits qui ont un prix défini        
            allProducts.forEach(product => {        
              if (pricesMap[product._id]) {        
                productsWithPrices.push(product);        
              }        
            });        
            console.log('Produits avec prix trouvés:', productsWithPrices);

            setProducts(productsWithPrices);        
            setPrices(pricesMap);        
          } else {        
            console.warn("Aucune liste de prix active trouvée");        
            setProducts([]);        
            setPrices({});        
          }        
        } catch (priceError) {        
          console.error("Erreur lors du chargement des prix:", priceError);        
          setProducts([]);        
          setPrices({});        
          setError("Impossible de charger les prix des produits");        
        }        
      }          
      setError(null);          
    } catch (err) {          
      console.error("Erreur lors du chargement des produits:", err);          
      setError("Erreur lors du chargement des produits");          
      setProducts([]);          
      setPrices({});          
    } finally {          
      setLoading(false);          
    }          
  };      
      
  // ✅ Amélioration du chargement des adresses client  
const loadClientData = async () => {          
  try {          
    setLoadingClient(true);          
    const user = authService.getUser();          
    if (user) {          
      setClientData(user);          
        
      // 🔧 CORRECTION: Récupérer customer_id comme dans le profil  
      let customerId = user.customer_id;  
        
      // Si pas de customer_id dans les données locales, le récupérer via l'API profile  
      if (!customerId) {  
        const token = authService.getToken();  
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {  
          headers: {  
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json'  
          }  
        });  
          
        if (profileResponse.ok) {  
          const profileData = await profileResponse.json();  
          customerId = profileData.data?.customer_info?.customer_id;  
            
          // Mettre à jour les données utilisateur locales avec le customer_id  
          if (customerId && user) {  
            const updatedUser = { ...user, customer_id: customerId };  
            authService.setUser(updatedUser);  
            setClientData(updatedUser);  
          }  
        }  
      }  
        
      if (customerId) {        
        // Utiliser le nouveau endpoint du router modulaire    
        const addressesResponse = await fetch(`${API_BASE_URL}/api/customer/${customerId}/addresses`, {        
          headers: {        
            'Authorization': `Bearer ${authService.getToken()}`,        
            'Content-Type': 'application/json'        
          }        
        });          
        if (addressesResponse.ok) {          
          const addressesData = await addressesResponse.json();          
          setClientAddresses(addressesData.addresses || []);          
        } else {    
          console.warn('Impossible de charger les adresses client');    
          setClientAddresses([]);    
        }    
      }        
    }          
  } catch (error) {          
    console.error('Erreur lors du chargement des données client:', error);    
    setClientAddresses([]);          
  } finally {          
    setLoadingClient(false);          
  }          
};     
      
  useEffect(() => {          
    loadProductsWithPrices();      
    loadCities();          
    loadClientData();          
  }, []);       
      
  const handleQuantityChange = (productId, operation) => {        
    const product = products.find(p => p._id === productId);        
    if(!product) return;        
      
    if (operation === 'increment' && !product.actif){        
      alert('Impossible d\'ajouter un produit non disponible');        
      return;        
    }        
    setQuantities(prev => ({        
      ...prev,        
      [productId]: operation === 'increment'        
        ? (prev[productId] || 0) + 1        
        : Math.max(0, (prev[productId] || 0) - 1)        
    }));        
  };        
      
  const handleGPSLocation = () => {        
    if (navigator.geolocation) {        
      navigator.geolocation.getCurrentPosition(        
        (position) => {        
          setGpsLocation({        
            latitude: position.coords.latitude,        
            longitude: position.coords.longitude        
          });        
          setUseGPS(true);        
        },        
        (error) => {        
          console.error('Erreur géolocalisation:', error);  
          alert('Erreur lors de la géolocalisation');        
        }        
      );        
    } else {        
      alert('La géolocalisation n\'est pas supportée par ce navigateur');        
    }        
  };        
      
  const canProceedToStep2 = Object.values(quantities).some(qty => qty > 0);        
        
  // ✅ Validation améliorée pour tous les modes d'adresse  
  const canProceedToStep3 = () => {  
    if (useGPS && gpsLocation) {  
      return true;  
    }  
      
    if (selectedExistingAddress) {  
      return true;  
    }  
      
    if (address.use_existing_address && address.address_id) {  
      return true;  
    }  
      
    if (!address.use_existing_address && address.new_address) {  
      const newAddr = address.new_address;  
      return newAddr.street && newAddr.city_id && newAddr.telephone;  
    }  
      
    return false;  
  };  
          
  const subtotal = Object.entries(quantities).reduce((total, [productId, qty]) => {        
    return total + (qty * (prices[productId] || 0));        
  }, 0);        
  const total = subtotal + deliveryFee;        
      
  // ✅ Amélioration de la création de commande  
const handleConfirmOrder = async () => {            
  try {            
    const orderData = {            
      products,            
      quantities,            
      prices,            
      deliveryFee,            
      subtotal,            
      total,            
      useGPS,            
      gpsLocation,            
      selectedExistingAddress,          
      additionalInfo: '',      
      address: address    
    };            
              
    const result = await createOrderFromSteps(orderData);            
    console.log('✅ Commande créée avec succès:', result);            
              
    // 🔧 MODIFIÉ: Rediriger avec l'ID de la commande créée  
    if (result && result._id) {  
      window.location.href = `/TrackOrder/${result._id}`;  
    } else {  
      // Fallback si pas d'ID retourné  
      window.location.href = "/TrackOrder";  
    }           
  } catch (error) {            
    console.error('❌ Erreur création commande:', error);            
    alert(`Erreur lors de la création de la commande: ${error.message || 'Erreur inconnue'}`);            
  }            
};  
      
  const orderData = {        
    products,        
    quantities,        
    prices,        
    deliveryFee,        
    subtotal,        
    total,        
    useGPS,        
    address,        
    gpsLocation,      
    selectedExistingAddress      
  };        
      
  if (loading) {        
    return (        
      <div className="command-page-content">        
        <Title />        
        <div className="flex justify-center items-center h-64">        
          <div className="text-center">        
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>        
            <p className="mt-4 text-gray-600">Chargement des produits...</p>        
          </div>        
        </div>        
      </div>        
    );        
  }        
      
  if (error) {        
    return (        
      <div className="command-page-content">        
        <Title />        
        <div className="flex justify-center items-center h-64">        
          <div className="text-center">        
            <p className="text-red-600 mb-4">{error}</p>        
            <button         
              onClick={loadProductsWithPrices}        
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"        
            >        
              Réessayer        
            </button>        
          </div>        
        </div>        
      </div>        
    );        
  }        
      
  return (        
      <div className="command-wrapper">  
        <div className="command-container">  
          <div className="command-content">  
            <div className="command-page-content">  
              <Title />  
              <StepsIndicator currentStep={currentStep} />          
      <div className="max-w-4xl mx-auto p-6">          
        {currentStep === 1 && (        
          <QuantityStep        
            products={products}        
            quantities={quantities}        
            prices={prices}        
            onQuantityChange={handleQuantityChange}        
            onNext={() => setCurrentStep(2)}        
            canProceed={canProceedToStep2}      
            apiBaseUrl={API_BASE_URL}      
          />        
        )}        
        {currentStep === 2 && (        
          <AddressStep        
            useGPS={useGPS}        
            setUseGPS={setUseGPS}        
            address={address}        
            setAddress={setAddress}        
            gpsLocation={gpsLocation}        
            onGPSLocation={handleGPSLocation}        
            onBack={() => setCurrentStep(1)}        
            onNext={() => setCurrentStep(3)}        
            canProceed={canProceedToStep3()}        
            clientAddresses={clientAddresses}        
            loadingClient={loadingClient}        
            cities={cities}        
            loadingLocations={loadingLocations}      
            selectedExistingAddress={selectedExistingAddress}      
            setSelectedExistingAddress={setSelectedExistingAddress}      
          />        
        )}        
        {currentStep === 3 && (        
          <SummaryStep        
            orderData={orderData}        
            onBack={() => setCurrentStep(2)}        
            onConfirm={handleConfirmOrder}        
          />        
        )}        
      </div>          
       </div>  
      </div>  
    </div>  
  </div>          
  );        
};        
      
export default Command;