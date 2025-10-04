import React, { useState, useEffect, useCallback } from "react";          
import { useParams, useNavigate } from 'react-router-dom';          
import api from '../../services/api';        
import evaluationService from '../../services/evaluationService';      
import { useWebSocket } from '../../hooks/useWebSocket';    
import Title from "../../components/client/TrackOrderPage/Title";                 
import OrderProgress from "../../components/client/TrackOrderPage/OrderProgress";          
import DeliveryDriverInfo from "../../components/client/TrackOrderPage/DeliveryDriverInfo";          
import InteractiveMap from "../../components/client/TrackOrderPage/InteractiveMap";
import SimpleMap from "../../components/client/TrackOrderPage/SimpleMap";
import { useDeliveryTracking } from "../../hooks/useDeliveryTracking";
import OrderSummary from "../../components/client/TrackOrderPage/OrderSummary";
import CancelOrderButton from '../../components/client/TrackOrderPage/CancelOrderButton';           
import './TrackOrder.css';           
    
const TrackOrder = () => {          
  const [orderData, setOrderData] = useState(null);          
  const [loading, setLoading] = useState(true);          
  const [error, setError] = useState(null);  
  const [availableOrders, setAvailableOrders] = useState([]);
  const [showOrderSelection, setShowOrderSelection] = useState(false);
          
  const { orderId } = useParams();          
  const navigate = useNavigate();      
    
  const { subscribe, isConnected } = useWebSocket(true);

  // ✅ SIMPLE: Extraire les positions + WebSocket temps réel
  const [currentDriverPosition, setCurrentDriverPosition] = useState(null);

  const destinationPosition = orderData?.command?.address_id ? {
    lat: parseFloat(orderData.command.address_id.latitude),
    lng: parseFloat(orderData.command.address_id.longitude)
  } : null;

  // Position initiale du chauffeur
  useEffect(() => {
    if (orderData?.livraison?.latitude && orderData?.livraison?.longitude) {
      const initialPos = {
        lat: parseFloat(orderData.livraison.latitude),
        lng: parseFloat(orderData.livraison.longitude)
      };
      setCurrentDriverPosition(initialPos);
      console.log('🔍 [TrackOrder] Position initiale chauffeur:', initialPos);
    }
  }, [orderData?.livraison]);

  // ✅ NOUVEAU: Écouter les mises à jour WebSocket temps réel
  useEffect(() => {
    if (!orderData?.livraison?._id || !isConnected) return;

    const unsubscribePosition = subscribe('position_updated', (data) => {
      console.log('📡 [TrackOrder] Position WebSocket reçue:', data);

      if (data.deliveryId === orderData.livraison._id) {
        const newPosition = {
          lat: parseFloat(data.position.latitude),
          lng: parseFloat(data.position.longitude),
          timestamp: data.timestamp
        };

        console.log('✅ [TrackOrder] Mise à jour position chauffeur temps réel:', newPosition);
        setCurrentDriverPosition(newPosition);
      }
    });

    return unsubscribePosition;
  }, [orderData?.livraison?._id, isConnected, subscribe]);


  // ✅ NOUVEAU: Fonction pour récupérer les commandes du client connecté
  const fetchUserOrders = useCallback(async () => {
    try {
      // Récupérer les commandes du client connecté
      const response = await api.get('/commands');
      
      if (response.data.success) {
        const orders = response.data.data || [];
        
        // Filtrer les commandes actives (non livrées/annulées) pour la sélection
        const activeOrders = orders.filter(order => 
          !['LIVREE', 'ANNULEE', 'ECHOUEE'].includes(order.statut)
        );
        
        setAvailableOrders(activeOrders);
        
        // Si aucun orderId dans l'URL mais qu'il y a des commandes actives
        if (!orderId && activeOrders.length > 0) {
          // Prendre la commande la plus récente
          const latestOrder = activeOrders[0];
          navigate(`/Trackorder/${latestOrder._id}`, { replace: true });
          return;
        }
        
        // Si aucun orderId et aucune commande active, montrer la sélection
        if (!orderId && activeOrders.length === 0) {
          // Montrer toutes les commandes pour sélection
          setAvailableOrders(orders);
          setShowOrderSelection(true);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  }, [orderId, navigate]);
    
  // Fonction fetchOrderData inchangée
  const fetchOrderData = useCallback(async () => {          
    if (!orderId) {          
      setError('Aucun ID de commande fourni');          
      setLoading(false);          
      return;          
    }          
        
    try {          
      setLoading(true);          
      setError(null);          
        
      console.log('🔄 Rechargement des données de commande pour ID:', orderId);
      const orderResponse = await api.get(`/commands/${orderId}`);
      console.log('📦 Données de commande reçues:', orderResponse.data);

      if (orderResponse.data.success) {
        console.log('✅ Réponse API réussie');
        console.log('📊 Structure complète des données:', JSON.stringify(orderResponse.data.data, null, 2));

        // ✅ NOUVEAU: Vérification spéciale pour livraison
        const data = orderResponse.data.data;
        console.log('🔍 Analyse des données:');
        console.log('   - Commande:', data?.command ? 'Présente' : 'Absente');
        console.log('   - Planification:', data?.planification ? 'Présente' : 'Absente');
        console.log('   - Livraison:', data?.livraison ? 'Présente' : 'Absente');

        if (data?.planification && !data?.livraison) {
          console.log('⚠️ Planification présente mais pas de livraison - Recherche manuelle...');

          // Essayer de récupérer la livraison manuellement
          try {
            const livraisonResponse = await api.get('/livraisons', {
              params: {
                planificationId: data.planification._id,
                etat: 'EN_COURS'
              }
            });

            if (livraisonResponse.data.success && livraisonResponse.data.data.length > 0) {
              console.log('✅ Livraison trouvée manuellement:', livraisonResponse.data.data[0]);
              data.livraison = livraisonResponse.data.data[0];
            }
          } catch (livraisonError) {
            console.log('⚠️ Erreur recherche livraison manuelle:', livraisonError.message);
          }
        }

        setOrderData(data);
              
        // Logs de débogage détaillés      
        console.log('🔍 Vérification des conditions de redirection:');      
        console.log('   - Statut commande:', orderResponse.data.data?.command?.statut);      
        console.log('   - ID livraison:', orderResponse.data.data?.livraison?._id);      
        console.log('   - Condition statut LIVREE:', orderResponse.data.data?.command?.statut === 'LIVREE');      
        console.log('   - Condition ID livraison existe:', !!orderResponse.data.data?.livraison?._id);      
              
        if (orderResponse.data.data?.command?.statut === 'LIVREE' &&           
            orderResponse.data.data?.livraison?._id) {          
          console.log('✅ Conditions remplies, vérification évaluation...');      
                
          try {          
            console.log('🔄 Appel evaluationService.canEvaluateLivraison avec ID:', orderResponse.data.data.livraison._id);      
                  
            const canEvaluate = await evaluationService.canEvaluateLivraison(          
              orderResponse.data.data.livraison._id          
            );          
                  
            console.log('📋 Résultat canEvaluate:', canEvaluate);      
                  
            if (canEvaluate) {          
              console.log('🚀 Redirection vers ServiceEvaluation...');      
              console.log('🔗 URL de redirection:', `/Serviceevaluation/${orderResponse.data.data.livraison._id}`);      
                    
              navigate(`/Serviceevaluation/${orderResponse.data.data.livraison._id}`);          
              return;          
            } else {      
              console.log('❌ Évaluation non autorisée (déjà existante ou autre raison)');      
            }      
          } catch (error) {          
            console.error('💥 Erreur lors de la vérification d\'évaluation:', error);      
            console.error('📝 Détails de l\'erreur:', error.message);      
            console.error('🔍 Stack trace:', error.stack);      
          }          
        } else {      
          console.log('❌ Conditions non remplies pour la redirection');      
          if (orderResponse.data.data?.command?.statut !== 'LIVREE') {      
            console.log('   → Statut actuel:', orderResponse.data.data?.command?.statut, '(attendu: LIVREE)');      
          }      
          if (!orderResponse.data.data?.livraison?._id) {      
            console.log('   → ID livraison manquant');      
          }      
        }      
      } else {              
        console.log('❌ Réponse API échouée');      
        setError('Commande non trouvée');              
      }        
    } catch (error) {          
      console.error('Erreur lors du chargement des données:', error);          
      setError('Erreur de connexion au serveur');          
    } finally {          
      setLoading(false);          
    }          
  }, [orderId, navigate]);    

  // ✅ NOUVEAU: useEffect pour la logique de sélection automatique
  useEffect(() => {
    if (!orderId) {
      fetchUserOrders();
    }
  }, [orderId, fetchUserOrders]);
  
  // Monitoring de l'état WebSocket et des données  
  useEffect(() => {  
    console.log('🔌 [TrackOrder] État connexion WebSocket:', isConnected);  
    console.log('📊 [TrackOrder] Order ID:', orderId);  
    console.log('📋 [TrackOrder] Order Data:', orderData?.command?.statut);  
    console.log('📋 [TrackOrder] Planification:', orderData?.planification ? 'Présente' : 'Absente');  
    console.log('📋 [TrackOrder] Livraison:', orderData?.livraison ? 'Présente' : 'Absente');  
  }, [isConnected, orderId, orderData]);  
    
  // useEffect pour WebSocket - écouter les changements de statut ET les planifications  
  useEffect(() => {    
    if (orderId && isConnected) {    
      console.log('✅ [TrackOrder] Abonnement aux événements WebSocket...');    
          
      const unsubscribeStatus = subscribe('order_status_updated', (data) => {
        console.log('🔄 [TrackOrder] order_status_updated reçu:', data);
        console.log('   - orderId reçu:', data.orderId);
        console.log('   - orderId attendu:', orderId);
        console.log('   - Match:', data.orderId === orderId);

        if (data.orderId === orderId) {
          console.log('✅ [TrackOrder] Statut commande mis à jour - IMMÉDIAT:', data.status);

          // ✅ NOUVEAU: Mise à jour immédiate du statut sans rechargement complet
          setOrderData(prevData => {
            if (prevData?.command) {
              const newData = {
                ...prevData,
                command: {
                  ...prevData.command,
                  statut: data.status
                }
              };
              console.log('📊 [TrackOrder] Données mises à jour:', newData.command.statut);
              return newData;
            }
            return prevData;
          });

          // Recharger les données complètes en arrière-plan
          console.log('🔄 [TrackOrder] Rechargement données en arrière-plan...');
          fetchOrderData();
        } else {
          console.log('❌ [TrackOrder] order_status_updated ignoré (ID différent)');
        }
      });
      
      // NOUVEAU: Écouter les nouvelles assignations/planifications
      const unsubscribeAssignment = subscribe('new_assignment', (data) => {
        console.log('📋 [TrackOrder] Nouvelle assignation reçue:', data);
        if (data.orderId === orderId) {
          console.log('✅ [TrackOrder] Planification pour cette commande - rechargement...');
          fetchOrderData();
        }
      });

      // ✅ NOUVEAU: Écouter le démarrage de livraison
      const unsubscribeDeliveryStarted = subscribe('delivery_started', (data) => {
        console.log('🚚 [TrackOrder] Livraison démarrée reçue:', data);
        if (data.orderId === orderId) {
          console.log('✅ [TrackOrder] Livraison démarrée pour cette commande - rechargement...');

          // ✅ NOUVEAU: Mise à jour immédiate du statut
          setOrderData(prevData => {
            if (prevData?.command) {
              return {
                ...prevData,
                command: {
                  ...prevData.command,
                  statut: 'EN_COURS'
                }
              };
            }
            return prevData;
          });

          // Recharger les données complètes
          fetchOrderData();
        }
      });

      return () => {
        unsubscribeStatus();
        unsubscribeAssignment();
        unsubscribeDeliveryStarted();
      };
    }    
  }, [orderId, isConnected, subscribe, fetchOrderData]);  
    
  // useEffect pour le chargement initial    
  useEffect(() => {    
    if (orderId) {
      fetchOrderData();    
    }
  }, [fetchOrderData]);    
      
  // Callback pour gérer les changements de statut de livraison      
  const handleStatusChange = async (status) => {      
    console.log('Statut de livraison changé:', status);      
          
    // Redirection automatique vers l'évaluation quand la livraison est terminée      
    if (status === 'LIVRE' && orderData?.livraison?._id) {      
      try {      
        const canEvaluate = await evaluationService.canEvaluateLivraison(orderData.livraison._id);      
        if (canEvaluate) {      
          console.log('Redirection vers la page d\'évaluation');      
          navigate(`/Serviceevaluation/${orderData.livraison._id}`);      
        }      
      } catch (error) {      
        console.error('Erreur lors de la vérification d\'évaluation:', error);      
      }      
    }      
  };    

  // ✅ NOUVEAU: Fonction pour sélectionner une commande
  const handleOrderSelect = (selectedOrderId) => {
    navigate(`/Trackorder/${selectedOrderId}`, { replace: true });
    setShowOrderSelection(false);
  };

  // ✅ NOUVEAU: Fonction pour obtenir le statut en français
  const getStatusInFrench = (status) => {
    const statusMap = {
      'CONFIRMEE': 'Confirmée',
      'ASSIGNEE': 'Assignée',
      'EN_COURS': 'En cours',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée',
      'ECHOUEE': 'Échouée'
    };
    return statusMap[status] || status;
  };

  // ✅ NOUVEAU: Interface de sélection de commande
  if (showOrderSelection) {
    return (
      <div className="track-wrapper">            
        <div className="track-container">            
          <div className="track-content">            
            <div className="track-page-content">           
              <div className="min-h-screen bg-gray-50">
                <Title title="Sélectionner une Commande" />
                
                <div className="max-w-4xl mx-auto p-6">
                  {availableOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <div className="text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune commande trouvée</h3>
                      <p className="text-gray-600 mb-4">Vous n'avez actuellement aucune commande à suivre.</p>
                      <button 
                        onClick={() => navigate('/Command')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Passer une commande
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md">
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Vos Commandes</h2>
                        <p className="text-gray-600 mt-1">Sélectionnez une commande pour la suivre</p>
                      </div>
                      
                      <div className="divide-y divide-gray-200">
                        {availableOrders.map((order) => (
                          <div 
                            key={order._id}
                            onClick={() => handleOrderSelect(order._id)}
                            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">
                                    Commande #{order.numero_commande}
                                  </h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.statut === 'CONFIRMEE' ? 'bg-yellow-100 text-yellow-800' :
                                    order.statut === 'ASSIGNEE' ? 'bg-blue-100 text-blue-800' :
                                    order.statut === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                                    order.statut === 'LIVREE' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {getStatusInFrench(order.statut)}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>
                                    <span className="font-medium">Date:</span> {' '}
                                    {new Date(order.date_commande).toLocaleDateString('fr-FR')}
                                  </p>
                                  <p>
                                    <span className="font-medium">Montant:</span> {' '}
                                    {order.montant_total?.toFixed(2)} MAD
                                  </p>
                                  {order.urgent && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      Urgente
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0 ml-4">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>            
          </div>            
        </div>            
      </div>
    );
  }
          
  const orderNumber = orderData?.command?.numero_commande || 'N/A';          
          
  // ✅ CORRIGÉ: Utiliser les données de planification et livraison depuis orderData      
  const deliveryDriver = orderData?.planification?.livreur_employee_id ? {          
    name: `${orderData.planification.livreur_employee_id.physical_user_id?.first_name || ''} ${orderData.planification.livreur_employee_id.physical_user_id?.last_name || ''}`.trim() || 'Chauffeur',          
    phone: orderData.planification.livreur_employee_id.physical_user_id?.telephone_principal || null,          
    vehicle: orderData.planification.trucks_id ?           
      `${orderData.planification.trucks_id.matricule}` :           
      'Véhicule non spécifié'          
  } : null;          
          
  // ✅ CORRIGÉ: Description du statut basée sur votre nouvelle architecture        
  const getStatusDescription = () => {        
    // Priorité 1: État de la commande (source de vérité)        
    if (orderData?.command?.statut) {        
      switch(orderData.command.statut) {        
        case 'CONFIRMEE': return "Votre commande a été confirmée avec succès";        
        case 'ASSIGNEE': return "Votre commande est prête pour la livraison";        
        case 'EN_COURS': return "Votre commande est en cours de livraison";        
        case 'LIVREE': return "Votre commande a été livrée avec succès";        
        case 'ANNULEE': return "Commande annulée";        
        case 'ECHOUEE': return "Problème lors de la livraison";        
        default: return "Suivi de votre commande";        
      }        
    }        
        
    // Fallback: État de livraison        
    if (orderData?.livraison) {        
      switch(orderData.livraison.etat) {        
        case 'EN_COURS': return "Votre commande est en cours de livraison";        
        case 'LIVRE': return "Votre commande a été livrée avec succès";        
        case 'ECHEC': return "Problème lors de la livraison";        
        case 'ANNULE': return "Livraison annulée";        
        default: return "Livraison en préparation";        
      }        
    }        
        
    return "Chargement du statut...";        
  };        
          
  const getEstimatedTime = () => {          
    if (orderData?.livraison?.updatedAt && orderData.command.statut === 'LIVREE') {          
      return new Date(orderData.livraison.updatedAt).toLocaleTimeString('fr-FR', {           
        hour: '2-digit',           
        minute: '2-digit'           
      });          
    }          
    if (orderData?.planification?.delivery_date) {          
      return new Date(orderData.planification.delivery_date).toLocaleTimeString('fr-FR', {           
        hour: '2-digit',           
        minute: '2-digit'           
      });          
    }          
    return null;        
  };          
          
  // États de chargement et d'erreur (restent identiques)        
  if (loading) {          
    return (          
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">          
        <div className="text-center">          
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>          
          <div className="text-lg">Chargement des informations de commande...</div>          
        </div>          
      </div>          
    );          
  }          
          
  if (error) {          
    return (          
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">          
        <div className="text-center">          
          <div className="text-red-500 mb-4">          
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">          
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />          
            </svg>          
          </div>          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h3>          
          <p className="text-gray-600 mb-4">{error}</p>          
          <div className="space-y-2">
            <button           
              onClick={() => window.location.reload()}           
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"          
            >          
              Réessayer          
            </button>
            <button           
              onClick={() => navigate('/Trackorder')}           
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"          
            >          
              Sélectionner une autre commande          
            </button>
          </div>          
        </div>          
      </div>          
    );          
  }          
          
  if (!orderData) {          
    return (          
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">          
        <div className="text-center">          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Commande non trouvée</h3>          
          <p className="text-gray-600 mb-4">Aucune commande trouvée avec cet identifiant.</p>
          <button           
            onClick={() => navigate('/Trackorder')}           
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"          
          >          
            Sélectionner une commande          
          </button>          
        </div>          
      </div>          
    );          
  }          
          
  return (          
    <div className="track-wrapper">            
      <div className="track-container">            
        <div className="track-content">            
          <div className="track-page-content">           
            <div className="min-h-screen bg-gray-50">          
              <Title title="Suivre ma Commande" />          
          
              <div className="max-w-4xl mx-auto p-6">
                {/* ✅ NOUVEAU: Bouton pour changer de commande */}
                <div className="mb-4">
                  <button
                    onClick={() => navigate('/Trackorder')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Changer de commande
                  </button>
                </div>       
          
                {/* ✅ CORRIGÉ: Passer les bonnes données de livraison */}      
                <OrderProgress           
                  deliveryData={orderData?.livraison}          
                  orderData={orderData}          
                />          
          
                {deliveryDriver && (          
                  <DeliveryDriverInfo           
                    driver={deliveryDriver}          
                    isVisible={true}          
                  />          
                )}          
          
                {/* ✅ SOLUTION SIMPLE: Toujours rendre la carte si livraison existe */}
                {orderData?.livraison && currentDriverPosition ? (  
                  <div style={{  
                    width: '100%',  
                    height: '400px',  
                    minHeight: '400px',  
                    border: '2px solid #007bff',  
                    borderRadius: '8px',  
                    overflow: 'hidden',  
                    marginTop: '20px',  
                    backgroundColor: '#f8f9fa'  
                  }}>  
                    <div style={{  
                      padding: '10px',  
                      backgroundColor: '#007bff',  
                      color: 'white',  
                      fontWeight: 'bold'  
                    }}>  
                      🗺️ Suivi en temps réel - Livraison {orderData.livraison.etat}  
                    </div>  
                    <div style={{ height: '350px', position: 'relative' }}>  
                      <InteractiveMap  
                        deliveryId={orderData.livraison._id}  
                        driverPosition={currentDriverPosition}  
                        destinationPosition={destinationPosition}  
                        isVisible={true}  
                        autoCenter={true}  
                        showRoute={true}  
                        onPositionUpdate={(pos) => console.log('📍 Position mise à jour:', pos)}  
                        onStatusChange={(status) => console.log('📊 Statut changé:', status)}  
                      />  
                    </div>  
                  </div>  
                ) : orderData?.livraison && !currentDriverPosition ? (  
                  <div style={{  
                    padding: '20px',  
                    backgroundColor: '#f8d7da',  
                    border: '1px solid #f5c6cb',  
                    margin: '10px 0',  
                    borderRadius: '8px'  
                  }}>  
                    <h4>🗺️ Carte de suivi</h4>  
                    <p><strong>État:</strong> Position du chauffeur non disponible</p>  
                    <p style={{ color: '#721c24' }}>  
                      ❌ La livraison a été annulée ou le chauffeur n'est pas encore en route  
                    </p>  
                  </div>  
                ) : orderData?.planification ? (
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    margin: '10px 0',
                    borderRadius: '8px'
                  }}>
                    <h4>🗺️ Carte de suivi</h4>
                    <p><strong>État:</strong> Planifiée - En attente de démarrage</p>
                    <p style={{ color: '#856404' }}>
                      ⏳ En attente que le chauffeur démarre la route...
                    </p>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    margin: '10px 0',
                    borderRadius: '8px'
                  }}>
                    <h4>🗺️ Carte de suivi</h4>
                    <p><strong>État:</strong> Aucune livraison trouvée</p>
                  </div>
                )}
          
                <OrderSummary           
                  orderData={orderData}           
                  loading={false}           
                  error={null}           
                />          
          
                <CancelOrderButton          
                  orderId={orderData?.command?._id}          
                  currentStatus={orderData?.command?.statut}          
                  onCancelSuccess={() => {          
                    window.location.reload();          
                  }}          
                />          
              </div>          
            </div>          
          </div>            
        </div>            
      </div>            
    </div>           
  );          
};          
          
export default TrackOrder;