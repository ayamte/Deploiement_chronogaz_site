import React, { useState, useEffect, useRef } from 'react';
import {
  MdLocationOn as MapPin,
  MdNavigation as Navigation,
  MdInventory as Package,
  MdAccessTime as Clock,
  MdCheckCircle as CheckCircle,
  MdRoute as Route,
  MdWarning as AlertTriangle,
  MdKeyboardArrowUp as ArrowUp,
  MdKeyboardArrowDown as ArrowDown,
  MdRemove as Minus,
  MdGpsFixed as Target,
  MdRefresh as Loader2,
  MdClose as X,
  MdVisibility as Eye,
  MdPhone as Phone,
  MdEmail as Email,
  MdAdd as Plus
} from 'react-icons/md';
import './NextOrderMap.css';
import livraisonService from '../../../services/livraisonService';
import { authService } from '../../../services/authService';
import planificationService from '../../../services/planificationService';
import { useWebSocket } from '../../../hooks/useWebSocket';
import RealDeliveryMap from './RealDeliveryMap';

export default function NextOrderMapPage() {
  const [livraisons, setLivraisons] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  
  // ✅ Nouveaux états et ref pour gérer le suivi GPS
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const { subscribe, isConnected, updatePosition } = useWebSocket(true);

  // ✅ Nouvelle fonction : démarre la surveillance GPS
  const handleStartTracking = () => {
    console.log('🎯 BOUTON SUIVI CLIQUÉ !');
    if (!navigator.geolocation) {
      setNotification({ type: 'warning', message: 'Géolocalisation non supportée par le navigateur' });
      return;
    }

    if (isTracking) {
      console.log('ℹ️ Le suivi est déjà actif.');
      return;
    }

    setNotification({ type: 'info', message: 'Démarrage du suivi GPS...' });
    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setDriverLocation(newPosition);
        console.log('📍 Position du chauffeur mise à jour:', newPosition);
        
        // ✅ PRIORITÉ ABSOLUE à l'ID de livraison pour le suivi en temps réel
        if (isConnected && selectedOrder) {
          // Utiliser UNIQUEMENT l'ID de livraison si disponible, sinon planification
          const trackingId = selectedOrder.livraisonId || selectedOrder.planificationId;
          const trackingType = selectedOrder.livraisonId ? 'LIVRAISON' : 'PLANIFICATION';

          if (trackingId) {
            console.log(`📤 Envoi de la position pour l'ID: ${trackingId} (type: ${trackingType})`);
            updatePosition(trackingId, newPosition.latitude, newPosition.longitude);
          } else {
            console.log('❌ Aucun ID de tracking disponible:', selectedOrder);
          }
        } else {
          console.log('❌ Pas d\'envoi de position:', {
            isConnected,
            selectedOrder: !!selectedOrder,
            livraisonId: selectedOrder?.livraisonId,
            planificationId: selectedOrder?.planificationId
          });
        }
      },
      (error) => {
        console.error('❌ Erreur de suivi GPS:', error);
        setNotification({ type: 'error', message: `Erreur GPS: ${error.message}` });
        setIsTracking(false);
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0 
      }
    );

    watchIdRef.current = watchId;
  };

  // ✅ Nouvelle fonction : arrête la surveillance GPS
  const handleStopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      console.log('🚫 Suivi GPS arrêté.');
      setIsTracking(false);
      setNotification({ type: 'info', message: "Suivi GPS arrêté." });
    }
  };

  // ✅ useEffect pour le nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Le reste du code...
  useEffect(() => {
    console.log('🔌 [NextOrderMap] État connexion WebSocket:', isConnected);
    console.log('👤 [NextOrderMap] Current user employee_id:', currentUser?.employee_id);
      
    if (currentUser?.employee_id && isConnected) {
      console.log('✅ [NextOrderMap] Abonnement aux événements WebSocket...');
        
      const unsubscribe = subscribe('new_assignment', (data) => {
        console.log('📋 [NextOrderMap] Nouvelle assignation reçue:', data);
        console.log('🔍 [NextOrderMap] Comparaison IDs:', {
          received: data.employeeId,
          current: currentUser.employee_id,
          match: data.employeeId === currentUser.employee_id
        });
          
        if (data.employeeId === currentUser.employee_id) {
          console.log('✅ [NextOrderMap] Assignation pour cet employé - rechargement...');
          refreshDeliveryData();
          setNotification({
            type: "info",
            message: `Nouvelle commande assignée: ${data.orderNumber}`
          });
        } else {
          console.log('❌ [NextOrderMap] Assignation pour un autre employé');
        }
      });
          
      return unsubscribe;
    } else {
      console.log('❌ [NextOrderMap] Conditions non remplies:', {
        hasEmployeeId: !!currentUser?.employee_id,
        isConnected
      });
    }
  }, [currentUser, isConnected, subscribe]);

  useEffect(() => {
    if (isConnected) {
      const testSubscribe = subscribe('test', (data) => {
        console.log('🧪 [NextOrderMap] Événement test reçu:', data);
      });
          
      return () => testSubscribe();
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('🔍 DÉBUT - Récupération utilisateur connecté');
        const token = authService.getToken();
        
        if (!token) {
          console.error('❌ ERREUR: Aucun token trouvé');
          setNotification({
            type: "error",
            message: "Session expirée - veuillez vous reconnecter"
          });
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('❌ ERREUR API:', response.status, response.statusText);
          setNotification({
            type: "error",
            message: `Erreur API: ${response.status} - ${response.statusText}`
          });
          return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.data) {
          console.error('❌ ERREUR: Données utilisateur manquantes');
          setNotification({
            type: "error",
            message: "Erreur lors de la récupération du profil"
          });
          return;
        }
        
        const userData = {
          ...data.data,
          employee_id: data.data.employee_info?._id || data.data.employee_info?.matricule
        };
        
        if (!userData.employee_id) {
          console.error('❌ ERREUR: employee_id manquant dans userData');
          setNotification({
            type: "error",
            message: "ID employé manquant - contactez l'administrateur"
          });
          return;
        }
        
        console.log('✅ Employee ID trouvé:', userData.employee_id);
        setCurrentUser(userData);
        
      } catch (error) {
        console.error('💥 EXCEPTION lors de la récupération utilisateur:', error);
        setNotification({
          type: "error",
          message: `Erreur technique: ${error.message}`
        });
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    console.log('🔌 [NextOrderMap] État connexion:', isConnected);
    console.log('📊 [NextOrderMap] Nombre de livraisons:', livraisons.length);
  }, [isConnected, livraisons.length]);

  const refreshDeliveryData = async () => {
    console.log('🔄 [NextOrderMap] Début refreshDeliveryData');
    console.log('👤 [NextOrderMap] Employee ID:', currentUser?.employee_id);
      
    if (!currentUser?.employee_id) {
      console.log('⏳ [NextOrderMap] ATTENTE: employee_id non disponible');
      return;
    }
      
    try {
      console.log('📡 [NextOrderMap] Appel API getPlanificationsByEmployee...');
      const planificationsResponse = await planificationService.getPlanificationsByEmployee(currentUser.employee_id);
          
      console.log('📋 [NextOrderMap] Planifications reçues:', planificationsResponse.data?.length || 0);
      
      const filteredPlanifications = planificationsResponse.data?.filter(planification => {    
        const commandeStatut = planification.commande_id?.statut;    
        const planificationEtat = planification.etat;    
            
        // États qui doivent faire disparaître la commande    
        const etatsCommandeTermines = ['LIVREE', 'ANNULEE', 'ECHOUEE'];    
        const etatsPlanificationTermines = ['ANNULE'];    
            
        const isCommandeTerminee = etatsCommandeTermines.includes(commandeStatut);    
        const isPlanificationTerminee = etatsPlanificationTermines.includes(planificationEtat);    
        
        // ✅ Filtre par date du jour actuel  
        const deliveryDate = new Date(planification.delivery_date || planification.date);    
        const today = new Date();    
        const isToday = deliveryDate.toDateString() === today.toDateString();    
            
        // ✅ CORRECTION: Inclure isToday dans la condition  
        return !isCommandeTerminee && !isPlanificationTerminee && isToday;    
      }) || [];

      console.log('✅ Résultat final:');
      console.log(`  - Planifications gardées: ${filteredPlanifications.length}`);
        
      setLivraisons(filteredPlanifications);
      
      // ✅ Correction : Définir automatiquement la prochaine commande pour le suivi
      if (filteredPlanifications.length > 0) {
        const nextOrderCandidate = transformLivraisonToOrder(filteredPlanifications[0]);
        if (nextOrderCandidate) {
          setSelectedOrder(nextOrderCandidate);
          console.log('✅ Prochaine commande définie automatiquement :', nextOrderCandidate.orderNumber);
        }
      } else {
        setSelectedOrder(null);
      }
          
    } catch (error) {
      console.error('💥 [NextOrderMap] Erreur lors du rechargement:', error);
      setNotification({
        type: "error",
        message: `Erreur chargement: ${error.message}`
      });
    }
  };

  useEffect(() => {
    const fetchDeliveryData = async () => {
      if (!currentUser?.employee_id) {
        return;
      }

      try {
        setLoading(true);
        await refreshDeliveryData();
        
        if (livraisons.length === 0) {
          setNotification({
            type: "info",
            message: "Aucune livraison assignée pour le moment"
          });
        }
        
      } catch (error) {
        console.error('💥 EXCEPTION lors de la récupération des données:', error);
        setNotification({
          type: "error",
          message: `Erreur chargement: ${error.message}`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryData();
  }, [currentUser]);

  const transformLivraisonToOrder = (item) => {
    if (!item) return null;
    
    const itemId = item.id || item._id;
    if (!itemId) return null;
    
    const isPlanification = item.etat === 'PLANIFIE';
    const isLivraison = ['EN_COURS', 'LIVRE', 'ECHEC', 'ANNULE'].includes(item.etat);
    
    const commandeData = item.commande_id;
    const customerData = item.commande_id?.customer_id;
    const addressData = item.commande_id?.address_id;
    
    if (!commandeData) return null;
    
    return {
      id: itemId,
      orderNumber: commandeData?.numero_commande || 'N/A',
      planificationId: isPlanification ? itemId : (item.planification_id?._id || item.planification_id || itemId),
      customer: {
        id: customerData?._id || '',
        name: customerData?.physical_user_id
          ? `${customerData.physical_user_id.first_name} ${customerData.physical_user_id.last_name}`
          : customerData?.moral_user_id?.raison_sociale || 'Client inconnu',
        phone: customerData?.physical_user_id?.telephone_principal ||
               customerData?.moral_user_id?.telephone_principal || '',
        email: '',
      },
      deliveryAddress: {
        street: addressData?.street || '',
        city: addressData?.city_id?.name || '',
        postalCode: addressData?.postal_code || '',
        latitude: addressData?.latitude || 0,
        longitude: addressData?.longitude || 0,
      },
      orderDate: commandeData?.date_commande || new Date().toISOString(),
      requestedDeliveryDate: item.delivery_date || item.date || new Date().toISOString(),
      status: mapLivraisonStatus(item.etat),
      priority: item.priority || 'medium',
      products: commandeData?.lignes || [],
      totalAmount: commandeData?.montant_total || item.total || 0,
      customerNotes: commandeData?.details || item.details || '',
      estimatedDeliveryTime: new Date(item.delivery_date || item.date || new Date()).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timeWindow: {
        start: new Date(item.delivery_date || item.date || new Date()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        end: new Date(new Date(item.delivery_date || item.date || new Date()).getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      },
      distanceFromCurrent: 0,
      estimatedTravelTime: 0,
      livraisonId: isLivraison ? itemId : null,
      etat: item.etat,
      isPlanification,
      isLivraison,
      history: [
        {
          id: `hist-${itemId}`,
          action: isPlanification ? 'Commande assignée' : 'Livraison démarrée',
          details: isPlanification ? 'Assignée au camion' : 'Chauffeur en route',
          timestamp: item.createdAt || new Date().toISOString(),
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Système',
        }
      ]
    };
  };

  const mapLivraisonStatus = (etat) => {
    switch (etat) {
      case 'PLANIFIE': return 'assigned';
      case 'EN_COURS': return 'en_route';
      case 'LIVRE': return 'delivered';
      case 'ECHEC': return 'failed';
      case 'ANNULE': return 'cancelled';
      default: return 'assigned';
    }
  };

  const orders = livraisons.map(transformLivraisonToOrder).filter(order => order !== null);
  
  const activeOrders = orders.filter(order =>
    !['delivered', 'cancelled', 'failed'].includes(order.status)
  );

  const sortedOrders = [...activeOrders].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return (a.estimatedTravelTime || 0) - (b.estimatedTravelTime || 0);
  });

  const nextOrder = sortedOrders[0];

  // ✅ DÉBOGAGE: Logs détaillés pour comprendre l'état
  useEffect(() => {
    console.log('🔍 [DEBUG] État actuel:');
    console.log('  - Next order:', nextOrder);
    console.log('  - Next order status:', nextOrder?.status);
    console.log('  - Next order etat:', nextOrder?.etat);
    console.log('  - Next order planificationId:', nextOrder?.planificationId);
    console.log('  - Next order livraisonId:', nextOrder?.livraisonId);
    console.log('  - Selected order:', selectedOrder);
    console.log('  - Is tracking:', isTracking);
    console.log('  - Driver location:', driverLocation);
  }, [nextOrder, selectedOrder, isTracking, driverLocation]);

  const handleStartRoute = async (order) => {
    console.log('🎯 BOUTON DÉMARRER ROUTE CLIQUÉ !', order);

    if (!order.planificationId) {
      setNotification({
        type: "error",
        message: "Impossible de démarrer la livraison - planification manquante"
      });
      return;
    }

    setLoading(true);
    try {
      // ✅ NOUVEAU: Vérifier d'abord si une livraison existe déjà
      console.log('🔍 Vérification livraison existante pour planification:', order.planificationId);

      let livraisonId = null;

      try {
        const existingLivraisons = await livraisonService.getLivraisons({
          planificationId: order.planificationId,
          etat: 'EN_COURS'
        });

        if (existingLivraisons.data && existingLivraisons.data.length > 0) {
          const existingLivraison = existingLivraisons.data[0];
          livraisonId = existingLivraison.id || existingLivraison._id;
          console.log('✅ Livraison existante trouvée:', livraisonId);
        }
      } catch (searchError) {
        console.log('⚠️ Erreur recherche livraison existante:', searchError.message);
      }

      // Si pas de livraison existante, en créer une nouvelle
      if (!livraisonId) {
        const deliveryData = {
          latitude: driverLocation?.latitude || 33.274458833333334,
          longitude: driverLocation?.longitude || -7.581053666666666,
          details: `Démarrage de la livraison pour ${order.customer.name}`
        };

        console.log('🚀 Création nouvelle livraison pour planification:', order.planificationId);
        console.log('📍 Données de livraison:', deliveryData);

        const startResult = await livraisonService.startLivraison(order.planificationId, deliveryData);
        console.log('📦 Résultat création livraison:', startResult);

        livraisonId = startResult.data?._id || startResult._id;
        console.log('✅ Nouvelle livraison créée avec ID:', livraisonId);
      }

      if (!livraisonId) {
        throw new Error('Impossible d\'obtenir un ID de livraison');
      }

      // ✅ NOUVEAU: Mettre à jour immédiatement l'ordre sélectionné
      const updatedOrder = {
        ...order,
        livraisonId: livraisonId,
        isLivraison: true,
        isPlanification: false,
        status: 'en_route',
        etat: 'EN_COURS'
      };
      setSelectedOrder(updatedOrder);
      console.log('✅ Ordre sélectionné mis à jour IMMÉDIATEMENT avec ID livraison:', livraisonId);

      // ✅ NOUVEAU: Démarrer automatiquement le suivi GPS avec le bon ID
      if (!isTracking) {
        console.log('🎯 Démarrage automatique du suivi GPS avec ID livraison...');
        setIsTracking(true);
        setNotification({ type: 'info', message: 'Démarrage du suivi GPS...' });

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newPosition = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setDriverLocation(newPosition);
            console.log('📍 Position du chauffeur mise à jour:', newPosition);

            // Utiliser l'ID de livraison pour le suivi
            if (isConnected && livraisonId) {
              console.log(`📤 Envoi de la position pour l'ID LIVRAISON: ${livraisonId}`);
              updatePosition(livraisonId, newPosition.latitude, newPosition.longitude);
            }
          },
          (error) => {
            console.error('❌ Erreur de suivi GPS:', error);
            setNotification({ type: 'error', message: `Erreur GPS: ${error.message}` });
            setIsTracking(false);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        watchIdRef.current = watchId;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshDeliveryData();

      setNotification({
        type: "success",
        message: `Route démarrée vers ${order.customer.name} - Suivi GPS actif`
      });

      // ✅ SUPPRIMÉ: Plus d'ouverture Google Maps - utilisation de la carte intégrée
      console.log('✅ Route démarrée - Suivi GPS actif sur la carte intégrée');

      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('💥 EXCEPTION démarrage route:', error);
      console.error('💥 Détails de l\'erreur:', error.response?.data || error.message);
      setNotification({
        type: "error",
        message: `Erreur lors du démarrage: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (order, newStatus, note = '') => {
    setLoading(true);
    try {
      const statusMapping = {
        'delivered': 'LIVRE',
        'failed': 'ECHEC',
        'cancelled': 'ANNULE'
      };
  
      let livraisonId = null;
  
      try {
        console.log('🔍 Recherche livraison pour planification:', order.planificationId);
          
        const existingLivraisons = await livraisonService.getLivraisons({
          planification_id: order.planificationId,
          etat: 'EN_COURS'
        });
  
        if (existingLivraisons.data && existingLivraisons.data.length > 0) {
          const existingLivraison = existingLivraisons.data[0];
          livraisonId = existingLivraison.id || existingLivraison._id;
          console.log('✅ Livraison existante trouvée:', livraisonId);
        }
      } catch (searchError) {
        console.error('❌ Erreur recherche livraison:', searchError);
      }
  
      if (!livraisonId && order.isPlanification && order.etat === 'PLANIFIE') {
        console.log('📋 Création automatique de livraison pour planification');
          
        const deliveryData = {
          latitude: driverLocation?.latitude || 0,
          longitude: driverLocation?.longitude || 0,
          details: `Démarrage automatique pour changement de statut`
        };
  
        const startResult = await livraisonService.startLivraison(order.planificationId, deliveryData);
        livraisonId = startResult.data?._id || startResult._id;
          
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      if (!livraisonId) {
        throw new Error('Impossible de trouver ou créer une livraison');
      }
  
      const completionData = {
        latitude: driverLocation?.latitude || 0,
        longitude: driverLocation?.longitude || 0,
        details: note,
        commentaires_livreur: note,
        etat: statusMapping[newStatus] || 'LIVRE'
      };
  
      console.log('📤 Finalisation livraison:', livraisonId, 'avec statut:', statusMapping[newStatus]);
      await livraisonService.completeLivraison(livraisonId, completionData);
  
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refreshDeliveryData();
  
      setIsStatusModalOpen(false);
      setStatusNote('');
  
      const statusText = {
        'delivered': 'livrée',
        'failed': 'annulée (échec)',
        'cancelled': 'annulée'
      };
  
      setNotification({
        type: "success",
        message: `Commande ${order.orderNumber} marquée comme ${statusText[newStatus]}`
      });
  
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('💥 EXCEPTION changement statut:', error);
      setNotification({
        type: "error",
        message: "Erreur lors de la mise à jour du statut"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "nom-priority-urgent";
      case "high": return "nom-priority-high";
      case "medium": return "nom-priority-medium";
      case "low": return "nom-priority-low";
      default: return "nom-priority-default";
    }
  };
  
  const getPriorityText = (priority) => {
    switch (priority) {
      case "urgent": return "Urgente";
      case "high": return "Haute";
      case "medium": return "Moyenne";
      case "low": return "Basse";
      default: return priority;
    }
  };
  
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <ArrowUp className="nom-priority-icon" />;
      case "medium":
        return <Minus className="nom-priority-icon" />;
      case "low":
        return <ArrowDown className="nom-priority-icon" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case "assigned": return "nom-status-assigned";
      case "en_route": return "nom-status-en-route";
      case "delivered": return "nom-status-delivered";
      case "failed": return "nom-status-failed";
      case "cancelled": return "nom-status-cancelled";
      default: return "nom-status-default";
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case "assigned": return "Assignée";
      case "en_route": return "En route";
      case "delivered": return "Livrée";
      case "failed": return "Échec";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };
  
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };
  
  const getMapMarkerColor = (priority) => {
    switch (priority) {
      case "urgent": return "#ef4444";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#22c55e";
      default: return "#6b7280";
    }
  };
  
  if (loading && livraisons.length === 0) {
    return (
      <div className="nom-layout">
        <div className="nom-wrapper">
          <div className="nom-container">
            <div className="nom-loading-container">
              <Loader2 className="nom-loading-spinner" />
              <p>Chargement de vos livraisons...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="nom-layout">
      <div className="nom-wrapper">
        <div className="nom-container">
          <main className="nom-main">
            <div className="nom-page-header">
              <h2 className="nom-page-title">Carte des Prochaines Commandes</h2>
              <p className="nom-page-subtitle">Visualisez vos commandes assignées et planifiez votre itinéraire</p>
            </div>
  
            {/* Notification */}
            {notification && (
              <div className={`nom-alert nom-alert-${notification.type}`}>
                {notification.type === "success" ? (
                  <CheckCircle className="nom-alert-icon" />
                ) : notification.type === "error" ? (
                  <AlertTriangle className="nom-alert-icon" />
                ) : (
                  <Target className="nom-alert-icon" />
                )}
                <div className="nom-alert-content">
                  {notification.message}
                </div>
              </div>
            )}
  
            {/* Next Order Priority Card */}
            {nextOrder && (
              <div className="nom-card nom-priority-card">
                <div className="nom-card-header">
                  <div className="nom-card-title">
                    <Target className="nom-card-icon" />
                    <span>Prochaine Commande Prioritaire</span>
                  </div>
                </div>
                <div className="nom-card-content">
                  <div className="nom-priority-content">
                    <div className="nom-priority-info">
                      <div className="nom-badges">
                        <span className={`nom-badge ${getPriorityColor(nextOrder.priority)}`}>
                          {getPriorityIcon(nextOrder.priority)}
                          <span className="nom-badge-text">{getPriorityText(nextOrder.priority)}</span>
                        </span>
                        <span className={`nom-badge ${getStatusColor(nextOrder.status)}`}>
                          {getStatusText(nextOrder.status)}
                        </span>
                      </div>
                      <h3 className="nom-customer-name">{nextOrder.customer.name}</h3>
                      <p className="nom-order-number">Commande: {nextOrder.orderNumber}</p>
                      <div className="nom-order-details">
                        <div className="nom-detail-item">
                          <MapPin className="nom-detail-icon" />
                          <span>
                            {nextOrder.deliveryAddress.street}, {nextOrder.deliveryAddress.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="nom-priority-actions">
                      <button
                        className="nom-btn nom-btn-secondary"
                        onClick={() => handleViewDetails(nextOrder)}
                      >
                        Détails
                      </button>
                        
                      <button
                        className="nom-btn nom-btn-success"
                        onClick={() => {
                          setSelectedOrder(nextOrder);
                          setStatusAction('delivered');
                          setIsStatusModalOpen(true);
                        }}
                        disabled={loading}
                      >
                        <CheckCircle className="nom-btn-icon" />
                        Marquer Livré
                      </button>
  
                      <button
                        className="nom-btn nom-btn-danger"
                        onClick={() => {
                          setSelectedOrder(nextOrder);
                          setStatusAction('failed');
                          setIsStatusModalOpen(true);
                        }}
                        disabled={loading}
                      >
                        <X className="nom-btn-icon" />
                        Échec
                      </button>
  
                      {/* ✅ DÉBOGAGE: Toujours afficher le bouton pour test */}
                      <button
                        className="nom-btn nom-btn-primary"
                        onClick={() => {
                          console.log('🎯 CLIC SUR DÉMARRER ROUTE !');
                          console.log('Order à démarrer:', nextOrder);
                          handleStartRoute(nextOrder);
                        }}
                        disabled={loading || !nextOrder}
                        style={{
                          backgroundColor: nextOrder?.status === "assigned" ? '' : '#orange',
                          opacity: nextOrder?.status === "assigned" ? 1 : 0.7
                        }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="nom-btn-icon nom-spinner" />
                            Démarrage...
                          </>
                        ) : (
                          <>
                            <Navigation className="nom-btn-icon" />
                            {nextOrder?.status === "assigned" ? "Démarrer Route" : `Forcer Démarrage (${nextOrder?.status})`}
                          </>
                        )}
                      </button>

                      <button  
                        className="nom-btn nom-btn-warning"  
                        onClick={() => {  
                          console.log('🔄 Force refresh carte chauffeur');  
                          window.location.reload();  
                        }}  
                        disabled={loading}  
                      >  
                        🔄 Recharger  
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="nom-content-grid">
              {/* Map Section */}
              <div className="nom-map-section">
                <div className="nom-card nom-map-card">
                  <div className="nom-card-header">
                    <div className="nom-card-title">
                      <MapPin className="nom-card-icon" />
                      <span>Carte Interactive</span>
                    </div>
                    {/* ✅ SUPPRIMÉ: Boutons de suivi GPS - démarrage automatique */}
                    <div className="nom-tracking-status">
                      {isTracking ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                          🎯 Suivi GPS actif
                        </span>
                      ) : (
                        <span style={{ color: '#6c757d' }}>
                          📍 Suivi GPS inactif
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="nom-card-content nom-map-content">
                    {/* ✅ Le composant de carte réel est maintenant ici */}
                    <RealDeliveryMap
                      orders={activeOrders}
                      currentLocation={driverLocation}
                      onOrderSelect={handleViewDetails}
                      className="nom-real-map"
                    />

                
                  </div>
                </div>
              </div>
  
              {/* Orders List */}
              <div className="nom-orders-section">
                <div className="nom-card nom-orders-card">
                  <div className="nom-card-header">
                    <div className="nom-card-title">
                      <Package className="nom-card-icon" />
                      <span>Mes Commandes</span>
                    </div>
                    <span className="nom-orders-count">{activeOrders.length} commandes</span>
                  </div>
                  <div className="nom-card-content nom-orders-content">
                    <div className="nom-orders-list">
                      {sortedOrders.map((order, index) => (
                        <div
                          key={order.id}
                          className={`nom-order-item ${
                            order.id === nextOrder?.id ? "nom-order-next" : ""
                          }`}
                          onClick={() => handleViewDetails(order)}
                        >
                          <div className="nom-order-header">
                            <div className="nom-order-left">
                              <div
                                className="nom-order-marker"
                                style={{ backgroundColor: getMapMarkerColor(order.priority) }}
                              >
                                {index + 1}
                              </div>
                              <span className={`nom-badge ${getPriorityColor(order.priority)}`}>
                                {getPriorityIcon(order.priority)}
                                <span className="nom-badge-text">{getPriorityText(order.priority)}</span>
                              </span>
                            </div>
                            <span className={`nom-badge ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
  
                          <h3 className="nom-order-customer">{order.customer.name}</h3>
                          <p className="nom-order-number">{order.orderNumber}</p>
  
                          <div className="nom-order-info">
                            <div className="nom-order-detail">
                              <MapPin className="nom-order-icon" />
                              <span className="nom-order-address">
                                {order.deliveryAddress.street}, {order.deliveryAddress.city}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
  
      {/* Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="nom-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="nom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nom-modal-header">
              <div className="nom-modal-title">
                <Eye className="nom-modal-icon" />
                <span>Détails de la Commande</span>
              </div>
              <button
                className="nom-modal-close"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <X className="nom-close-icon" />
              </button>
            </div>
  
            <div className="nom-modal-body">
              <div className="nom-details-grid">
                {/* Customer Info */}
                <div className="nom-details-section">
                  <div className="nom-details-card">
                    <div className="nom-details-header">
                      <h4 className="nom-details-title">Informations Client</h4>
                    </div>
                    <div className="nom-details-content">
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">Nom:</span>
                        <span className="nom-detail-value">{selectedOrder.customer.name}</span>
                      </div>
                      <div className="nom-detail-row">
                        <Phone className="nom-detail-icon" />
                        <span className="nom-detail-value">{selectedOrder.customer.phone}</span>
                      </div>
                      {selectedOrder.customer.email && (
                        <div className="nom-detail-row">
                          <Email className="nom-detail-icon" />
                          <span className="nom-detail-value">{selectedOrder.customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
  
                {/* Delivery Info */}
                <div className="nom-details-section">
                  <div className="nom-details-card">
                    <div className="nom-details-header">
                      <h4 className="nom-details-title">Détails de la Livraison</h4>
                    </div>
                    <div className="nom-details-content">
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">N° de Commande:</span>
                        <span className="nom-detail-value">{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">Adresse:</span>
                        <span className="nom-detail-value">
                          {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}
                        </span>
                      </div>
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">Statut:</span>
                        <span className={`nom-detail-value ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">Créée le:</span>
                        <span className="nom-detail-value">
                          {new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="nom-detail-row">
                        <span className="nom-detail-label">Notes client:</span>
                        <span className="nom-detail-value">
                          {selectedOrder.customerNotes || "Aucune"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Products Section */}
              {selectedOrder.products.length > 0 && (
                <div className="nom-details-section">
                  <div className="nom-details-card">
                    <div className="nom-details-header">
                      <h4 className="nom-details-title">Liste des Produits</h4>
                    </div>
                    <div className="nom-details-content">
                      <ul className="nom-product-list">
                        {selectedOrder.products.map((product, index) => (
                          <li key={index} className="nom-product-item">
                            {product.quantite}x {product.produit_id?.name || 'Produit inconnu'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
  
            </div>
            <div className="nom-modal-actions">
              <button
                className="nom-btn nom-btn-secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Status Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div className="nom-modal-overlay" onClick={() => setIsStatusModalOpen(false)}>
          <div className="nom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nom-modal-header">
              <div className="nom-modal-title">
                {statusAction === 'delivered' ? (
                  <>
                    <CheckCircle className="nom-modal-icon" />
                    <span>Marquer comme livré</span>
                  </>
                ) : (
                  <>
                    <X className="nom-modal-icon" />
                    <span>Marquer comme échec</span>
                  </>
                )}
              </div>
              <button
                className="nom-modal-close"
                onClick={() => setIsStatusModalOpen(false)}
              >
                <X className="nom-close-icon" />
              </button>
            </div>
  
            <div className="nom-modal-body">  
              <div className="nom-status-info">  
                <h3 className="nom-status-customer">{selectedOrder.customer.name}</h3>  
                <p className="nom-status-order">Commande: {selectedOrder.orderNumber}</p>  
                <p>Confirmez le statut pour cette commande.</p>  
              </div>  
              <div className="nom-form-group">  
                <label className="nom-form-label">Commentaire:</label>  
                <textarea  
                  className="nom-form-textarea"  
                  rows="4"  
                  placeholder="Ajouter une note ou un commentaire (obligatoire pour un échec)"  
                  value={statusNote}  
                  onChange={(e) => setStatusNote(e.target.value)}  
                ></textarea>  
              </div>  
            </div>
  
            <div className="nom-modal-actions">
              <button
                className="nom-btn nom-btn-secondary"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                className={`nom-btn ${statusAction === 'delivered' ? 'nom-btn-success' : 'nom-btn-danger'}`}
                onClick={() => handleStatusChange(selectedOrder, statusAction, statusNote)}
                disabled={loading || (statusAction === 'failed' && !statusNote.trim())}
              >
                {loading ? (
                  <>
                    <Loader2 className="nom-btn-icon nom-spinner" />
                    Envoi...
                  </>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}