import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Star, 
  StarOff, 
  Phone, 
  MapPin, 
  Calendar,
  Truck,
  User,
  Package,
  X,
  RotateCcw
} from 'lucide-react';
import { orderService } from '../../../services/orderService';
import truckService from '../../../services/truckService';
import { planificationService } from '../../../services/planificationService';
import { livraisonService } from '../../../services/livraisonService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Pagination from '../../../components/common/Pagination';
import "./suiviCommande.css";

export default function OrderTrackingManagement() {
  // États pour les données
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // État pour les villes
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    clientType: 'all',
    ville: 'all',
    date:''
  });

  // États pour la modal et pagination
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Refs pour la gestion des timeouts
  const searchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Charger les villes depuis l'API
  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/locations/cities`);
      const data = await response.json();
      
      if (data.success) {
        setCities(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  // Fonction fetchOrders avec filtrage cohérent
  const fetchOrders = useCallback(async (currentFilters = null, currentPage = null) => {  
    if (!isMountedRef.current) return;  
        
    try {  
      setLoading(true);  
      setError('');  
          
      const filtersToUse = currentFilters || filters;  
      const pageToUse = currentPage || pagination.page;  
        
      console.log('🔍 [DEBUG] Filtres appliqués:', filtersToUse);  
          
      // ✅ CORRIGÉ: Mapping des statuts cohérent avec la nouvelle architecture
      let statusFilter = undefined;  
      if (filtersToUse.status && filtersToUse.status !== 'all') {  
        const statusMapping = {  
          'EN_ATTENTE': 'pending',  
          'PLANIFIE': 'assigned',   
          'EN_COURS': 'in_progress',  
          'LIVRE': 'delivered',  
          'ANNULE': 'cancelled'  
        };  
        statusFilter = statusMapping[filtersToUse.status] || filtersToUse.status;  
      }  
        
      console.log('🎯 [DEBUG] Status mappé pour API:', statusFilter);  
        
      // Logique pour filtrer par date du jour  
      let dateFromFilter, dateToFilter;  
      if (filtersToUse.date) {  
        const selectedDate = new Date(filtersToUse.date);  
        dateFromFilter = new Date(selectedDate.setHours(0, 0, 0, 0)).toISOString();  
        dateToFilter = new Date(selectedDate.setHours(23, 59, 59, 999)).toISOString();  
        console.log('📅 [DEBUG] Plage de dates:', { dateFromFilter, dateToFilter });  
      }  
          
      const response = await orderService.getOrders({  
        page: pageToUse,  
        limit: pagination.limit,  
        search: filtersToUse.search,  
        status: statusFilter,  
        dateFrom: dateFromFilter,  
        dateTo: dateToFilter  
      });  
    
      console.log('📊 [DEBUG] Réponse API:', response);  
    
      if (isMountedRef.current) {  
        let filteredData = response.data || [];  
          
        // Filtre par type de client  
        if (filtersToUse.clientType && filtersToUse.clientType !== 'all') {  
          filteredData = filteredData.filter((order) => {  
            const customerType = order.customer?.type ||   
                                (order.customer?.id ? 'PHYSIQUE' : 'MORAL');  
            return customerType.toLowerCase() === filtersToUse.clientType.toLowerCase();  
          });  
          console.log('🔍 [DEBUG] Après filtre clientType:', filteredData.length);  
        }  
          
        // Filtre par ville
        if (filtersToUse.ville && filtersToUse.ville !== 'all') {  
          filteredData = filteredData.filter((order) => {  
            const city = order.deliveryAddress?.city || '';  
            return city.toLowerCase() === filtersToUse.ville.toLowerCase();  
          });  
          console.log('🔍 [DEBUG] Après filtre ville:', filteredData.length);  
        }  
          
        setOrders(filteredData);  
        setPagination(prev => ({  
          ...prev,  
          page: pageToUse,  
          total: filteredData.length,  
          totalPages: Math.ceil(filteredData.length / pagination.limit)  
        }));  
          
        console.log('✅ [DEBUG] Données finales:', filteredData.length, 'commandes');  
      }  
    } catch (err) {  
      console.error('💥 [ERROR] Erreur lors du chargement des commandes:', err);  
      if (isMountedRef.current) {  
        setError(err.message);  
      }  
    } finally {  
      if (isMountedRef.current) {  
        setLoading(false);  
      }  
    }  
  }, [filters, pagination.page, pagination.limit]);

  // Effet pour charger les données
  useEffect(() => {
    loadCities();
    fetchOrders(filters, pagination.page);
  }, [filters, pagination.page]);

  // Debounce pour la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
        
    if (filters.search.length >= 2 || filters.search === '') {
      searchTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        fetchOrders({ ...filters }, 1);
      }, 500);
    }
        
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search, fetchOrders]);

  // Gestionnaires d'événements
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    if (filterType !== 'search') {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchOrders(filters, pagination.page);
  }, [fetchOrders, filters, pagination.page]);

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const filteredOrders = orders;

  // ✅ CORRIGÉ: Fonction pour obtenir l'état réel basée sur la nouvelle architecture
  const getRealOrderState = (order) => {  
    // Priorité 1: Status transformé par le service (nouveau)  
    if (order.status) {  
      // Mapper les statuts transformés vers les statuts backend  
      const statusMapping = {  
        'pending': 'CONFIRMEE',  
        'assigned': 'ASSIGNEE',   
        'in_progress': 'EN_COURS',  
        'delivered': 'LIVREE',  
        'cancelled': 'ANNULEE'  
      };  
      return statusMapping[order.status] || order.status;  
    }  
      
    // Priorité 2: État de la commande (fallback)  
    if (order.command?.statut) {  
      return order.command.statut;  
    }  
      
    // Priorité 3: État de livraison  
    if (order.livraison?.etat) {  
      return order.livraison.etat;  
    }  
      
    // Priorité 4: État de planification  
    if (order.planification?.etat) {  
      return order.planification.etat;  
    }  
      
    return 'EN_ATTENTE';  
  };

  // ✅ CORRIGÉ: Suppression de l'état PARTIELLE
  const getStateText = (state) => {
    const stateTexts = {
      'CONFIRMEE': 'Confirmée',
      'ASSIGNEE': 'Assignée', 
      'EN_COURS': 'En cours',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée',
      'ECHOUEE': 'Échec',
      // États de planification
      'PLANIFIE': 'Assignée',
      // États de livraison
      'LIVRE': 'Livrée',
      'ECHEC': 'Échec',
      'ANNULE': 'Annulée',
      // État par défaut
      'EN_ATTENTE': 'En attente'
    };
    return stateTexts[state] || state;
  };

  // ✅ CORRIGÉ: Suppression de l'état PARTIELLE
  const getStateBadgeClass = (state) => {
    const badgeClasses = {
      'CONFIRMEE': 'tracking-badge-pending',
      'ASSIGNEE': 'tracking-badge-assigned',
      'EN_COURS': 'tracking-badge-in-progress', 
      'LIVREE': 'tracking-badge-delivered',
      'ANNULEE': 'tracking-badge-cancelled',
      'ECHOUEE': 'tracking-badge-failed',
      // États de planification
      'PLANIFIE': 'tracking-badge-assigned',
      // États de livraison
      'LIVRE': 'tracking-badge-delivered',
      'ECHEC': 'tracking-badge-failed',
      'ANNULE': 'tracking-badge-cancelled',
      // État par défaut
      'EN_ATTENTE': 'tracking-badge-pending'
    };
    return badgeClasses[state] || 'tracking-badge-default';
  };

  const getTotalAmount = (order) => {  
    // Priorité 1: Montant calculé lors de la création de commande  
    if (order.montant_total) return order.montant_total;  
      
    // Priorité 2: Calculer depuis les lignes de commande (products)  
    if (order.products && order.products.length > 0) {  
      const calculatedTotal = order.products.reduce((total, product) => {  
        const quantity = product.quantity || product.quantite || 0;  
        const price = product.price || product.prix_unitaire || 0;  
        return total + (quantity * price);  
      }, 0);  
        
      // Ajouter les frais de livraison si pas déjà inclus  
      return calculatedTotal > 0 ? calculatedTotal + 20 : calculatedTotal;  
    }  
      
    // Priorité 3: Montant depuis planification/livraison (après assignation)  
    if (order.livraison?.total) return order.livraison.total;  
    if (order.planification?.total) return order.planification.total;  
      
    return 0;  
  };

  const getTruckInfo = (order) => {
    // 1. Priorité: Camion assigné directement
    if (order.assignedTruck) {
      return order.assignedTruck;
    }
    
    // 2. Priorité: Camion depuis la planification
    if (order.planification?.trucks_id) {
      return {
        plateNumber: order.planification.trucks_id.matricule || 'N/A',
        model: order.planification.trucks_id.brand && order.planification.trucks_id.modele ? 
          `${order.planification.trucks_id.brand} ${order.planification.trucks_id.modele}` : 'N/A',
        capacity: order.planification.trucks_id.capacite || 'N/A'
      };
    }
    
    // 3. Priorité: Camion depuis la livraison
    if (order.livraison?.trucks_id) {
      return {
        plateNumber: order.livraison.trucks_id.matricule || 'N/A',
        model: order.livraison.trucks_id.brand && order.livraison.trucks_id.modele ? 
          `${order.livraison.trucks_id.brand} ${order.livraison.trucks_id.modele}` : 'N/A',
        capacity: order.livraison.trucks_id.capacite || 'N/A'
      };
    }
    
    return null;
  };

  const getDriverInfo = (order) => {  
    // 1. Priorité: Chauffeur depuis la planification (structure complète)  
    if (order.planification?.livreur_employee_id?.physical_user_id) {  
      const driver = order.planification.livreur_employee_id.physical_user_id;  
      return {  
        name: `${driver.first_name} ${driver.last_name}`,  
        phone: driver.telephone_principal || 'N/A'  
      };  
    }  
      
    // 2. Priorité: Chauffeur depuis la livraison  
    if (order.livraison?.livreur_employee_id?.physical_user_id) {  
      const driver = order.livraison.livreur_employee_id.physical_user_id;  
      return {  
        name: `${driver.first_name} ${driver.last_name}`,  
        phone: driver.telephone_principal || 'N/A'  
      };  
    }  
      
    // 3. Fallback: Chauffeur depuis le camion assigné  
    if (order.assignedTruck?.driverName) {  
      return {  
        name: order.assignedTruck.driverName,  
        phone: 'N/A'  
      };  
    }  
      
    return { name: 'Non assigné', phone: 'N/A' };  
  };

  const getAccompagnantInfo = (order) => {  
    // 1. Priorité: Accompagnant depuis la planification  
    if (order.planification?.accompagnateur_id?.physical_user_id) {  
      const accompagnant = order.planification.accompagnateur_id.physical_user_id;  
      return {  
        name: `${accompagnant.first_name} ${accompagnant.last_name}`,  
        phone: accompagnant.telephone_principal || 'N/A'  
      };  
    }  
      
    // 2. Priorité: Accompagnant depuis la livraison  
    if (order.livraison?.accompagnateur_id?.physical_user_id) {  
      const accompagnant = order.livraison.accompagnateur_id.physical_user_id;  
      return {  
        name: `${accompagnant.first_name} ${accompagnant.last_name}`,  
        phone: accompagnant.telephone_principal || 'N/A'  
      };  
    }  
      
    // 3. Fallback: Accompagnant depuis le camion assigné  
    if (order.assignedTruck?.accompagnateur) {  
      return {  
        name: order.assignedTruck.accompagnateur.name || 'Accompagnant du camion',  
        phone: order.assignedTruck.accompagnateur.phone || 'N/A'  
      };  
    }  
      
    return { name: 'Aucun', phone: 'N/A' };  
  };


  const getDriverNotes = (order) => {
    if (order.livraison?.commentaires_livreur) {
      return order.livraison.commentaires_livreur;
    }
    if (order.livraison?.details) {
      return order.livraison.details;
    }
    return 'Aucune note';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const generateOrderHistory = (order) => {
    const history = [];
    
    if (order.orderDate) {
      history.push({
        id: 'hist-1',
        action: 'Commande créée',
        date: order.orderDate
      });
    }
    
    if (order.planification?.createdAt) {
      history.push({
        id: 'hist-2',
        action: 'Camion assigné',
        date: order.planification.createdAt
      });
    }
    
    if (order.livraison?.createdAt) {
      history.push({
        id: 'hist-3',
        action: 'Livraison démarrée',
        date: order.livraison.createdAt
      });
    }
    
    if (order.livraison?.updatedAt && order.livraison.etat === 'LIVRE') {
      history.push({
        id: 'hist-4',
        action: 'Livraison terminée',
        date: order.livraison.updatedAt
      });
    }
    
    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Fonction handleViewDetails avec mapping des données
  const handleViewDetails = async (order) => {  
    try {  
      setLoading(true);  
        
      // LOG 1: Vérifier les données d'évaluation dans l'ordre initial  
      console.log('🔍 [MODAL DEBUG] Ordre sélectionné:', order);  
      console.log('🔍 [MODAL DEBUG] Évaluation dans ordre initial:', order.evaluation);  
        
      const orderId = order.id || order._id;  
        
      if (!orderId) {  
        setError('Impossible de charger les détails: ID manquant');  
        return;  
      }  
        
      const detailedOrder = await orderService.getOrder(orderId);  
        
      // LOG 2: Vérifier les données détaillées de l'API  
      console.log('🔍 [MODAL DEBUG] Réponse API détaillée:', detailedOrder);  
      console.log('🔍 [MODAL DEBUG] Évaluation dans réponse API:', detailedOrder?.data?.evaluation || detailedOrder?.evaluation);  
        
      if (!detailedOrder) {  
        setError('Aucune donnée reçue pour cette commande');  
        return;  
      }  
        
      const orderData = detailedOrder.data || detailedOrder;  
      
      // Récupérer les données complètes du camion si disponible
      let truckDetails = null;
      if (order.planification?.trucks_id?._id || order.assignedTruckId) {
        const truckId = order.planification?.trucks_id?._id || order.assignedTruckId;
        try {
          const truckResponse = await truckService.getTruckById(truckId);
          if (truckResponse && truckResponse.data) {
            truckDetails = truckResponse.data;
            

          }
        } catch (truckError) {
          console.warn('Impossible de récupérer les détails du camion:', truckError);
        }
      }
      
      // Mapper les données de la commande originale vers la structure attendue
      const enrichedOrder = {
        ...orderData,
        // Mapper les données de planification depuis la commande originale
        planification: order.planification ? {  
          ...order.planification,  
          trucks_id: order.planification.trucks_id || order.assignedTruck,  
          livreur_employee_id: order.planification.livreur_employee_id,  
          accompagnateur_id: order.planification.accompagnateur_id,  
          total: order.planification.total || order.livraison?.total || 0  
        } : null,  
          
        // Mapper les données de livraison depuis la commande originale    
        livraison: order.livraison ? {  
          ...order.livraison,  
          commentaires_livreur: order.livraison.commentaires_livreur || order.livraison.details,  
          total: order.livraison.total || order.livraison.total_ttc || 0  
        } : null,  

        evaluation: order.evaluation || orderData.evaluation,
          
        // S'assurer que les champs essentiels existent  
        customer: orderData.customer || order.customer || { name: 'Client inconnu' },  
        deliveryAddress: orderData.deliveryAddress || order.deliveryAddress || {   
          city: 'Ville inconnue',   
          address: 'Adresse inconnue'   
        },  
        products: orderData.products || order.products || [],  
        orderNumber: orderData.orderNumber || order.orderNumber || order.numero_commande || 'N/A',  
        orderDate: orderData.orderDate || order.orderDate || order.createdAt,  
          
        // Mapper assignedTruck avec les détails complets du camion
        assignedTruck: truckDetails ? {
          id: truckDetails._id,
          plateNumber: truckDetails.matricule,
          model: truckDetails.brand && truckDetails.modele ? 
            `${truckDetails.brand} ${truckDetails.modele}` : 'N/A',
          capacity: truckDetails.capacite,
          driver: truckDetails.driver ? {
            name: `${truckDetails.driver.physical_user_id?.first_name || ''} ${truckDetails.driver.physical_user_id?.last_name || ''}`.trim(),
            matricule: truckDetails.driver.matricule,
            phone: truckDetails.driver.physical_user_id?.telephone_principal || 'N/A'
          } : null,
          accompagnateur: truckDetails.accompagnant ? {
            name: `${truckDetails.accompagnant.physical_user_id?.first_name || ''} ${truckDetails.accompagnant.physical_user_id?.last_name || ''}`.trim(),
            matricule: truckDetails.accompagnant.matricule,
            phone: truckDetails.accompagnant.physical_user_id?.telephone_principal || 'N/A'
          } : null
        } : (orderData.assignedTruck || order.assignedTruck)
      };

      console.log('🔍 [MODAL DEBUG] Ordre enrichi final:', enrichedOrder);  
      console.log('🔍 [MODAL DEBUG] Évaluation dans ordre enrichi:', enrichedOrder.evaluation);  
        
      setSelectedOrder(enrichedOrder);  
      setIsDetailsModalOpen(true);  
        
    } catch (error) {  
       console.error('💥 [MODAL ERROR] Erreur:', error);  
        setError(`Erreur lors du chargement des détails: ${error.message}`);    
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const renderStars = (rating) => {  
    const stars = [];  
    const numRating = Number(rating) || 0;  
    for (let i = 1; i <= 5; i++) {  
      stars.push(  
        i <= numRating ?   
        <Star key={i} className="tracking-star-filled" /> :   
        <StarOff key={i} className="tracking-star-empty" />  
      );  
    }  
    return stars;  
  };  
  
  // Cleanup au démontage  
  useEffect(() => {  
    isMountedRef.current = true;  
    return () => {  
      isMountedRef.current = false;  
      if (searchTimeoutRef.current) {  
        clearTimeout(searchTimeoutRef.current);  
      }  
    };  
  }, []);  
  
  return (  
    <div className="tracking-management-layout">  
      <div className="tracking-management-wrapper">  
        <div className="tracking-management-container">  
          <div className="tracking-management-content">  
            {/* En-tête avec bouton refresh */}  
            <div className="tracking-page-header">  
              <div>  
                <h1 className="tracking-page-title">Suivi des Commandes</h1>  
                <p className="tracking-page-subtitle">Suivez l'état de toutes les commandes en temps réel</p>  
              </div>  
              <button  
                onClick={handleRefresh}  
                className="tracking-refresh-button"  
                disabled={loading}  
                title="Actualiser"  
              >  
                <RotateCcw className={`tracking-refresh-icon ${loading ? 'tracking-spinning' : ''}`} />  
                Actualiser  
              </button>  
            </div>  
  
            {/* Section des filtres avancés */}  
            <div className="tracking-filters-card">  
              <div className="tracking-filters-header">  
                <h3 className="tracking-filters-title">  
                  <Filter className="tracking-filter-icon" />  
                  Filtres et Recherche  
                </h3>  
              </div>  
              <div className="tracking-filters-content">  
                <div className="tracking-filters-grid">  
                  {/* Recherche */}  
                  <div className="tracking-form-group">  
                    <label className="tracking-label">Recherche</label>  
                    <div className="tracking-search-container">  
                      <Search className="tracking-search-icon" />  
                      <input  
                        type="text"  
                        placeholder="N° commande, client, ville..."  
                        value={filters.search}  
                        onChange={(e) => handleFilterChange('search', e.target.value)}  
                        className="tracking-search-input"  
                      />  
                    </div>  
                  </div>  
  
                  {/* Filtre par statut */}  
                  <div className="tracking-form-group">  
                    <label className="tracking-label">État</label>  
                    <select  
                      value={filters.status}  
                      onChange={(e) => handleFilterChange('status', e.target.value
                      )}    
                      className="tracking-select"    
                    >    
                      <option value="all">Tous les états</option>    
                      <option value="EN_ATTENTE">En attente</option>    
                      <option value="PLANIFIE">Assignée</option>    
                      <option value="EN_COURS">En cours</option>    
                      <option value="LIVRE">Livrée</option>    
                      <option value="ANNULE">Annulée</option>    
                    </select>    
                  </div>    
    
                   
    
                  {/* Filtre par ville */}    
                  <div className="tracking-form-group">    
                    <label className="tracking-label">Ville</label>    
                    <select    
                      value={filters.ville}    
                      onChange={(e) => handleFilterChange('ville', e.target.value)}    
                      className="tracking-select"    
                      disabled={loadingCities}    
                    >    
                      <option value="all">Toutes les villes</option>    
                      {cities.map(city => (    
                        <option key={city._id} value={city.name}>    
                          {city.name}    
                        </option>    
                      ))}    
                    </select>    
                  </div>    
    
                  {/* Filtre par date */}    
                  <div className="tracking-form-group">    
                    <label className="tracking-label">Date</label>    
                    <input    
                      type="date"    
                      value={filters.date}    
                      onChange={(e) => handleFilterChange('date', e.target.value)}    
                      className="tracking-input"    
                      title="Filtrer les commandes de cette date"    
                    />    
                  </div>  
                </div>    
              </div>    
            </div>    
    
            {/* Affichage des erreurs */}    
            {error && (    
              <div className="tracking-error-alert">    
                <span>Erreur: {error}</span>    
                <button onClick={handleRefresh}>Réessayer</button>    
              </div>    
            )}    
    
            {/* Tableau des commandes */}    
            <div className="tracking-table-card">    
              <div className="tracking-table-header">    
                <h3 className="tracking-table-title">    
                  Liste des Commandes ({filteredOrders.length})    
                </h3>    
                {loading && <LoadingSpinner size="small" />}    
              </div>    
              <div className="tracking-table-content">    
                <div className="tracking-table-container">    
                  <table className="tracking-orders-table">    
                    <thead>    
                      <tr>    
                        <th>N° Cmd</th>    
                        <th>Client</th>    
                        <th>Ville</th>    
                        <th>Date</th>    
                        <th>Total (DH)</th>    
                        <th>État</th>    
                        <th>Camion</th>    
                        <th>Détails</th>    
                      </tr>    
                    </thead>    
                    <tbody>    
                      {filteredOrders.length === 0 ? (    
                        <tr>    
                          <td colSpan={8} className="tracking-no-results">    
                            {loading ? 'Chargement...' : 'Aucune commande trouvée pour vos critères.'}    
                          </td>    
                        </tr>    
                      ) : (    
                        filteredOrders.map((order) => {    
                          const realState = getRealOrderState(order);    
                          const totalAmount = getTotalAmount(order);    
                          const truckInfo = getTruckInfo(order);    
                                
                          return (    
                            <tr key={order.id}>    
                              <td className="tracking-font-medium">{order.orderNumber || order.numero_commande}</td>    
                              <td>{order.customer?.name || 'N/A'}</td>    
                              <td>{order.deliveryAddress?.city || 'N/A'}</td>    
                              <td>{formatDate(order.orderDate || order.date_commande)}</td>    
                              <td className="tracking-font-medium">    
                                {totalAmount ? `${totalAmount.toFixed(2)} DH` : 'N/A'}    
                              </td>    
                              <td>    
                                <span className={`tracking-badge ${getStateBadgeClass(realState)}`}>    
                                  {getStateText(realState)}    
                                </span>    
                              </td>    
                              <td>{truckInfo?.plateNumber || 'Non assigné'}</td>    
                              <td>    
                                <button     
                                  className="tracking-details-button"    
                                  onClick={() => handleViewDetails(order)}    
                                >    
                                  <Eye className="tracking-details-icon" />    
                                </button>    
                              </td>    
                            </tr>    
                          );    
                        })    
                      )}    
                    </tbody>    
                  </table>    
                </div>    
    
                {/* Pagination */}    
                {pagination.totalPages > 1 && (    
                  <Pagination    
                    currentPage={pagination.page}    
                    totalPages={pagination.totalPages}    
                    totalItems={pagination.total}    
                    itemsPerPage={pagination.limit}    
                    onPageChange={handlePageChange}    
                  />    
                )}    
              </div>    
            </div>    
          </div>    
        </div>    
      </div>    
    
      {/* Modal de détails de commande */}    
      {isDetailsModalOpen && selectedOrder && (    
        <div className="tracking-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>    
          <div className="tracking-modal-content" onClick={(e) => e.stopPropagation()}>    
            <div className="tracking-modal-header">    
              <h2 className="tracking-modal-title">    
                Détails de la commande {selectedOrder.orderNumber || selectedOrder.numero_commande}    
              </h2>    
              <button className="tracking-modal-close" onClick={() => setIsDetailsModalOpen(false)}>    
                <X className="tracking-close-icon" />    
              </button>    
            </div>    
                    
            <div className="tracking-modal-body">    
              <div className="tracking-details-grid">    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">Nom du client</label>    
                  <span className="tracking-detail-value">{selectedOrder.customer?.name || 'N/A'}</span>    
                </div>    
    
                  
    
                <div className="tracking-detail-item tracking-full-width">    
                  <label className="tracking-detail-label">Adresse complète</label>    
                  <span className="tracking-detail-value">    
                    {selectedOrder.deliveryAddress ?     
                      `${selectedOrder.deliveryAddress.address}, ${selectedOrder.deliveryAddress.city}` :     
                      'N/A'    
                    }    
                  </span>    
                </div>    
    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">Ville</label>    
                  <span className="tracking-detail-value">{selectedOrder.deliveryAddress?.city || 'N/A'}</span>    
                </div>    
    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">Produits</label>    
                  <div className="tracking-detail-value">    
                    {selectedOrder.products?.length > 0 ? (    
                      <ul className="tracking-products-list">    
                        {selectedOrder.products.map((product, index) => (    
                          <li key={index}>    
                            {product.product_id?.long_name || 'Produit'} {product.UM_id?.unitemesure || ''} -     
                            Qté: {product.quantity}    
                          </li>    
                        ))}    
                      </ul>    
                    ) : 'Aucun produit'}    
                  </div>    
                </div>    
    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">Total</label>    
                  <span className="tracking-detail-value tracking-total-highlight">    
                    {getTotalAmount(selectedOrder).toFixed(2)} DH    
                  </span>    
                </div>    
    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">Date de commande</label>    
                  <span className="tracking-detail-value">    
                    {formatDate(selectedOrder.orderDate || selectedOrder.date_commande)}    
                  </span>    
                </div>    
    
                {/* Informations complètes du camion */}    
                {getTruckInfo(selectedOrder) && (    
                  <>    
                    <div className="tracking-detail-item">    
                      <label className="tracking-detail-label">Camion assigné</label>    
                      <span className="tracking-detail-value">    
                        {getTruckInfo(selectedOrder).plateNumber} - {getTruckInfo(selectedOrder).model}    
                      </span>    
                    </div>    
    
                    <div className="tracking-detail-item">    
                      <label className="tracking-detail-label">Capacité camion</label>    
                      <span className="tracking-detail-value">    
                        {getTruckInfo(selectedOrder).capacity} tonnes    
                      </span>    
                    </div>    
                  </>    
                )}    
    
                {/* Informations du chauffeur */}    
                {getDriverInfo(selectedOrder) && (    
                  <>    
                    <div className="tracking-detail-item">    
                      <label className="tracking-detail-label">Chauffeur</label>    
                      <span className="tracking-detail-value">    
                        {getDriverInfo(selectedOrder).name}    
                      </span>    
                    </div>     
    
                    <div className="tracking-detail-item">    
                      <label className="tracking-detail-label">Téléphone chauffeur</label>    
                      <span className="tracking-detail-value">    
                        {getDriverInfo(selectedOrder).phone}    
                      </span>    
                    </div>    
                  </>    
                )}    
    
                <div className="tracking-detail-item">    
                  <label className="tracking-detail-label">État de la commande</label>    
                  <span className={`tracking-badge ${getStateBadgeClass(getRealOrderState(selectedOrder))}`}>    
                    {getStateText(getRealOrderState(selectedOrder))}    
                  </span>    
                </div>    
    
                {/* Note du livreur */}    
                <div className="tracking-detail-item tracking-full-width">    
                  <label className="tracking-detail-label">Note du livreur</label>    
                  <span className="tracking-detail-value">    
                    {getDriverNotes(selectedOrder)}    
                  </span>    
                </div>    
    
   
    
                {/* Historique avec dates valides */}    
                <div className="tracking-detail-item tracking-full-width">    
                  <label className="tracking-detail-label">Historique</label>    
                  <div className="tracking-history-list">    
                    {generateOrderHistory(selectedOrder).map((event) => (    
                      <div key={event.id} className="tracking-history-item">    
                        <span className="tracking-history-date">    
                          {formatDate(event.date)}    
                        </span>    
                        <span className="tracking-history-action">{event.action}</span>    
                      </div>    
                    ))}    
                  </div>    
                </div>    
    
                  {/* Section Évaluation Client - Corrigée */}  
                  {selectedOrder?.evaluation && (  
                    <div className="tracking-detail-item tracking-full-width">  
                      <h4 className="tracking-detail-title">Évaluation Client</h4>  
                      <div className="tracking-details-grid">  
                        <div className="tracking-detail-item">  
                          <label className="tracking-detail-label">Note moyenne:</label>  
                          <span className="tracking-detail-value">  
                            {selectedOrder.evaluation.note_moyenne}/5 ⭐  
                          </span>  
                        </div>  
                        <div className="tracking-detail-item">  
                          <label className="tracking-detail-label">Date d'évaluation:</label>  
                          <span className="tracking-detail-value">  
                            {new Date(selectedOrder.evaluation.createdAt).toLocaleDateString("fr-FR")}  
                          </span>  
                        </div>  
                        {selectedOrder.evaluation.commentaire && (  
                          <div className="tracking-detail-item">  
                            <label className="tracking-detail-label">Commentaire:</label>  
                            <p className="tracking-detail-value">  
                              {selectedOrder.evaluation.commentaire}  
                            </p>  
                          </div>  
                        )}  
                      </div>  
                    </div>  
                  )}
              </div>    
            </div>    
          </div>    
        </div>    
      )}    
    </div>    
  );    
}
  

