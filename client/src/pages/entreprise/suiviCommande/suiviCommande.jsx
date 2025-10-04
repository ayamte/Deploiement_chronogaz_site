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
  User,    
  Package,    
  X,    
  RotateCcw    
} from 'lucide-react';    
import { orderService } from '../../../services/orderService'; 
import { planificationService } from '../../../services/planificationService';    
import { livraisonService } from '../../../services/livraisonService';    
import LoadingSpinner from '../../../components/common/LoadingSpinner';    
import Pagination from '../../../components/common/Pagination';    
import { authService } from '../../../services/authService';   
import "./suiviCommande.css";    
    
export default function EntrepriseOrderTrackingManagement() {    
  const user = authService.getUser();  
      
  // États pour les données    
  const [orders, setOrders] = useState([]);    
  const [loading, setLoading] = useState(true);    
  const [error, setError] = useState('');    
      
  // État pour les villes    
  const [cities, setCities] = useState([]);    
  const [loadingCities, setLoadingCities] = useState(false);    
    
  // ✅ MODIFIÉ: États pour les filtres (suppression de clientType)  
  const [filters, setFilters] = useState({    
    search: '',    
    status: 'all',    
    ville: 'all',    
    date: ''    
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
    
  // ✅ MODIFIÉ: Fonction pour récupérer les clients de l'entreprise avec détails complets  
  const getCompanyClients = async () => {      
    try {      
      console.log('🔍 [DEBUG] Utilisateur connecté:', user);      
      console.log('🔍 [DEBUG] moral_user_id:', user.moral_user_id);      
            
      
    if (!user.id) {  
      console.log('❌ [ERROR] Aucun identifiant valide pour l\'utilisateur:', user);  
      return [];  
    }  
  
            
      console.log('📡 [API] Appel API pour récupérer les clients de l\'entreprise...');      
        
      // ✅ NOUVEAU: Détecter si c'est une entreprise OAuth et utiliser la route appropriée  
      const isOAuthCompany = !user.moral_user_id || user.moral_user_id === 'undefined';

      const apiUrl = isOAuthCompany   
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/company/oauth/${user.id}`  
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers/company/${user.moral_user_id}`;  
        
      console.log('🔍 [DEBUG] Route utilisée:', apiUrl);  
        
      const response = await fetch(apiUrl, {      
        headers: {      
          'Authorization': `Bearer ${localStorage.getItem('token')}`,      
          'Content-Type': 'application/json'      
        }      
      });     
          
      console.log('📡 [API] Réponse brute:', response.status, response.statusText);    
      const data = await response.json();    
      console.log('📊 [DATA] Données clients reçues:', data);  
      console.log('🔍 Format des clients OAuth:', data.data);  
      console.log('🔍 IDs extraits:', data.data.map(client => client.id));  
          
      if (data.success) {    
        console.log('✅ [SUCCESS] Clients complets extraits:', data.data);    
        console.log('📋 [DETAIL] Détail des clients:', data.data.map(client => ({    
          id: client.id,    
          name: client.customer_code,    
          user_info: client.user_info    
        })));    
        console.log('🔍 Comparaison IDs:', data.data.map(client => ({  
          id: client.id,  
          _id: client._id,  
          customer_code: client.customer_code  
        })));
        return data.data;  
      } else {    
        console.log('❌ [ERROR] Réponse API non successful:', data);    
      }    
      return [];    
    } catch (error) {    
      console.error('💥 [ERROR] Erreur lors du chargement des clients de l\'entreprise:', error);    
      return [];    
    }    
  };   
    
  // ✅ SOLUTION: Fonction fetchOrders modifiée pour récupérer directement les commandes par client  
  const fetchOrders = useCallback(async (currentFilters = null, currentPage = null) => {    
    if (!isMountedRef.current || (!user?.moral_user_id && !user?.id)) return;
  
            
    try {      
      setLoading(true);      
      setError('');      
              
      const filtersToUse = currentFilters || filters;      
      const pageToUse = currentPage || pagination.page;      
            
      console.log('🔍 [ENTREPRISE] Filtres appliqués:', filtersToUse);      
      console.log('🔍 [ENTREPRISE] Utilisateur connecté:', user);  
              
      // Récupérer les clients de l'entreprise avec détails complets  
      const companyClientsData = await getCompanyClients();    
      console.log('👥 [ENTREPRISE] Clients de l\'entreprise avec détails:', companyClientsData);    
        
      if (companyClientsData.length === 0) {  
        console.log('⚠️ [WARNING] Aucun client trouvé pour cette entreprise');  
        setOrders([]);  
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));  
        return;  
      }  
  
      // Créer une map des clients pour un accès rapide  
      const clientsMap = new Map();  
      companyClientsData.forEach(client => {  
        clientsMap.set(client._id || client.id, client);
      });  
      console.log('🗺️ [MAP] Map des clients créée:', clientsMap);  
  
      // ✅ NOUVELLE APPROCHE: Récupérer les commandes de chaque client individuellement  
      console.log('📡 [API] Récupération des commandes pour chaque client...');  
      const allOrders = [];  
        
      for (const client of companyClientsData) {  
        try {  
          console.log(`📡 [API] Récupération commandes pour client: ${client._id || client.id}`);    
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/commands/customer/${client._id || client.id}`, {  
            headers: {  
              'Authorization': `Bearer ${localStorage.getItem('token')}`,  
              'Content-Type': 'application/json'  
            }  
          });  

            
          const data = await response.json();  
          console.log(`📊 [DATA] Commandes reçues pour client ${client.id}:`, data);  
            
          if (data.success && data.data) {  
            console.log('🔍 Format des commandes:', data.data.slice(0, 1)); // Premier élément    
            console.log('🔍 Customer IDs dans les commandes:', data.data.map(order => order.customer_id));   
            const transformedOrders = data.data.map(order => {  
              const clientDetails = clientsMap.get(order.customer_id);  
                
              return {  
                id: order._id,  
                orderNumber: order.numero_commande,  
                customer: {  
                  id: order.customer_id,  
                  name: clientDetails ? `${clientDetails.user_info?.first_name || ''} ${clientDetails.user_info?.last_name || ''}`.trim() : 'Client inconnu',
                  email: clientDetails?.user_info?.email,  
                  phone: clientDetails?.user_info?.telephone_principal,  
                  first_name: clientDetails?.user_info?.first_name,  
                  last_name: clientDetails?.user_info?.last_name,  
                  telephone_principal: clientDetails?.user_info?.telephone_principal  
                },  
                deliveryAddress: {  
                  city: order.address_id?.city_id?.name || 'N/A',  
                  street: order.address_id?.street || 'N/A'  
                },  
                createdAt: order.date_commande,  
                date_creation: order.date_commande,  
                totalAmount: order.montant_total,  
                montant_total: order.montant_total,  
                statut: order.statut,  
                planification: order.planification,  
                livraison: order.livraison,  
                // ✅ MODIFIÉ: Informations chauffeur seulement (pas de camion)  
                assignedDriver: order.planification?.livreur_employee_id?.physical_user_id ? {  
                  name: `${order.planification.livreur_employee_id.physical_user_id.first_name || ''} ${order.planification.livreur_employee_id.physical_user_id.last_name || ''}`.trim(),  
                  phone: order.planification.livreur_employee_id.physical_user_id.telephone_principal || 'N/A'  
                } : null
              };  
            });  
              
            allOrders.push(...transformedOrders);  
            console.log(`✅ [SUCCESS] ${transformedOrders.length} commandes ajoutées pour client ${client.id}`);  
          }  
        } catch (clientError) {  
          console.error(`💥 [ERROR] Erreur pour client ${client.id}:`, clientError);  
        }  
      }  
        
      console.log('📊 [TOTAL] Nombre total de commandes récupérées:', allOrders.length);  
      console.log('📋 [SAMPLE] Échantillon des commandes:', allOrders.slice(0, 3));  
        
      if (isMountedRef.current) {      
        let filteredData = allOrders;      
          
        // Appliquer les filtres côté frontend  
        console.log('🔍 [FILTER] Application des filtres...');  
          
        // Filtre par recherche  
        if (filtersToUse.search && filtersToUse.search.trim() !== '') {  
          const searchTerm = filtersToUse.search.toLowerCase();  
          filteredData = filteredData.filter(order =>   
            order.orderNumber?.toLowerCase().includes(searchTerm) ||  
            order.customer?.name?.toLowerCase().includes(searchTerm) ||  
            order.deliveryAddress?.city?.toLowerCase().includes(searchTerm)  
          );  
          console.log('🔍 [FILTER] Après filtre recherche:', filteredData.length);  
        }  
          
        // Filtre par statut  
        if (filtersToUse.status && filtersToUse.status !== 'all') {  
          filteredData = filteredData.filter(order => {  
            const orderStatus = order.statut;  
            return orderStatus === filtersToUse.status;  
          });  
          console.log('🔍 [FILTER] Après filtre statut:', filteredData.length);  
        }  
              
        // Filtre par ville    
        if (filtersToUse.ville && filtersToUse.ville !== 'all') {      
          filteredData = filteredData.filter((order) => {      
            const city = order.deliveryAddress?.city || '';      
            return city.toLowerCase() === filtersToUse.ville.toLowerCase();      
          });      
          console.log('🔍 [FILTER] Après filtre ville:', filteredData.length);      
        }      
          
        // Filtre par date  
        if (filtersToUse.date) {  
          const selectedDate = new Date(filtersToUse.date);  
          const dateFrom = new Date(selectedDate.setHours(0, 0, 0, 0));  
          const dateTo = new Date(selectedDate.setHours(23, 59, 59, 999));  
            
          filteredData = filteredData.filter(order => {  
            const orderDate = new Date(order.createdAt);  
            return orderDate >= dateFrom && orderDate <= dateTo;  
          });  
          console.log('🔍 [FILTER] Après filtre date:', filteredData.length);  
        }  
              
        setOrders(filteredData);      
        setPagination(prev => ({      
          ...prev,      
          page: pageToUse,      
          total: filteredData.length,      
          totalPages: Math.ceil(filteredData.length / pagination.limit)      
        }));      
              
        console.log('✅ [ENTREPRISE] Données finales:', filteredData.length, 'commandes');      
        console.log('📋 [FINAL] Commandes finales:',   
          filteredData.map(order => ({  
            orderNumber: order.orderNumber,  
            customerId: order.customer?.id,  
            customerName: order.customer?.name,  
            status: order.statut  
          }))  
        );  
      }      
    } catch (err) {      
      console.error('💥 [ENTREPRISE] Erreur lors du chargement des commandes:', err);      
      if (isMountedRef.current) {      
        setError(err.message);      
      }      
    } finally {      
      if (isMountedRef.current) {      
        setLoading(false);      
      }      
    }      
  }, [filters, pagination.page, pagination.limit, user?.moral_user_id]);    
    
  // Effet pour charger les données    
  useEffect(() => {    
    if (user?.moral_user_id || user?.id) {  
      loadCities();    
      fetchOrders(filters, pagination.page);    
    }    
  }, [filters, pagination.page, user?.moral_user_id]);    
    
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
  
// Fonctions utilitaires reprises de la page admin    
const getRealOrderState = (order) => {    
  // Priorité 1: Statut direct de la commande  
  if (order.statut) {    
    return order.statut;    
  }  
    
  if (order.command?.statut) {    
    return order.command.statut;    
  }    
      
  if (order.livraison?.etat) {    
    return order.livraison.etat;    
  }    
      
  if (order.planification?.etat) {    
    return order.planification.etat;    
  }    
      
  return 'EN_ATTENTE';    
};
  
const getTotalAmount = (order) => {    
  return order.totalAmount || order.montant_total || 0;    
};    
  
// ✅ SUPPRIMÉ: getTruckInfo - plus besoin des informations camion  
  
const getDriverInfo = (order) => {    
  // 1. Priorité: Chauffeur depuis assignedDriver (déjà transformé)  
  if (order.assignedDriver?.name) {    
    return {    
      name: order.assignedDriver.name,    
      phone: order.assignedDriver.phone !== 'N/A' ? order.assignedDriver.phone : 'N/A'    
    };    
  }    
    
  // 2. Priorité: Chauffeur depuis la planification (structure complète)    
  if (order.planification?.livreur_employee_id?.physical_user_id) {    
    const driver = order.planification.livreur_employee_id.physical_user_id;    
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
        
  return null;    
};   
  
const getStateText = (state) => {    
  const stateMapping = {    
    'EN_ATTENTE': 'En attente',    
    'PLANIFIE': 'Assignée',    
    'EN_COURS': 'En cours',    
    'LIVRE': 'Livrée',    
    'ANNULE': 'Annulée',    
    'pending': 'En attente',    
    'assigned': 'Assignée',    
    'in_progress': 'En cours',    
    'delivered': 'Livrée',    
    'cancelled': 'Annulée'    
  };    
  return stateMapping[state] || state;    
};    
  
const getStateBadgeClass = (state) => {    
  const classMapping = {    
    'EN_ATTENTE': 'tracking-badge-pending',    
    'PLANIFIE': 'tracking-badge-assigned',    
    'EN_COURS': 'tracking-badge-in-progress',    
    'LIVRE': 'tracking-badge-delivered',    
    'ANNULE': 'tracking-badge-cancelled',    
    'pending': 'tracking-badge-pending',    
    'assigned': 'tracking-badge-assigned',    
    'in_progress': 'tracking-badge-in-progress',    
    'delivered': 'tracking-badge-delivered',    
    'cancelled': 'tracking-badge-cancelled'    
  };    
  return classMapping[state] || 'tracking-badge-default';    
};    
  
const formatDate = (dateString) => {    
  if (!dateString) return 'N/A';    
  return new Date(dateString).toLocaleDateString('fr-FR');    
};    
  
const handleViewDetails = async (order) => {    
  try {    
    setSelectedOrder(order);    
    setIsDetailsModalOpen(true);    
  } catch (err) {    
    console.error('Erreur lors du chargement des détails:', err);    
    setError('Impossible de charger les détails: ID manquant');    
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
              <p className="tracking-page-subtitle">Suivez l'état de toutes les commandes de vos clients en temps réel</p>    
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
  
          {/* Section des filtres avancés - ✅ SUPPRIMÉ: Filtre type de client */}    
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
                    onChange={(e) => handleFilterChange('status', e.target.value)}    
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
                    {cities.map((city) => (    
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
                    className="tracking-date-input"    
                  />    
                </div>    
              </div>    
            </div>    
          </div>    
  
          {/* Affichage des erreurs */}    
          {error && (    
            <div className="tracking-error-message">    
              <X className="tracking-error-icon" />    
              {error}    
            </div>    
          )}    
  
          {/* Tableau des commandes */}    
          <div className="tracking-table-card">    
            <div className="tracking-table-header">    
              <h3 className="tracking-table-title">    
                Commandes de vos clients ({filteredOrders.length})    
              </h3>    
            </div>    
            <div className="tracking-table-content">    
              {loading ? (    
                <LoadingSpinner />    
              ) : (    
                <div className="tracking-table-container">    
                  <table className="tracking-orders-table">    
                    <thead>    
                      <tr>    
                        <th>N° Commande</th>    
                        <th>Client</th>    
                        <th>Ville</th>    
                        <th>Date</th>    
                        <th>Montant</th>    
                        <th>État</th>    
                        <th>Actions</th>    
                      </tr>    
                    </thead>    
                    <tbody>    
                      {filteredOrders.map((order) => {    
                        const orderState = getRealOrderState(order);    
                        const totalAmount = getTotalAmount(order);    
  
                        return (    
                          <tr key={order.id}>    
                            <td className="tracking-font-medium">    
                              {order.orderNumber || order.numero_commande || 'N/A'}    
                            </td>    
                            <td>    
                              <div className="tracking-client-info">    
                                <span className="tracking-client-name">    
                                  {order.customer?.name ||     
                                   `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() ||    
                                   'Client inconnu'}    
                                </span>    
                                {/* ✅ SUPPRIMÉ: Type de client */}  
                              </div>    
                            </td>    
                            <td>{order.deliveryAddress?.city || 'N/A'}</td>    
                            <td>{formatDate(order.createdAt || order.date_creation)}</td>    
                            <td className="tracking-font-medium">    
                              {totalAmount.toFixed(2)} MAD    
                            </td>    
                            <td>    
                              <span className={`tracking-badge ${getStateBadgeClass(orderState)}`}>    
                                {getStateText(orderState)}    
                              </span>    
                            </td>    
                            <td>    
                              <button    
                                onClick={() => handleViewDetails(order)}    
                                className="tracking-details-button"    
                                title="Voir les détails"    
                              >    
                                <Eye className="tracking-details-icon" />    
                              </button>    
                            </td>    
                          </tr>    
                        );    
                      })}    
                    </tbody>    
                  </table>    
  
                  {filteredOrders.length === 0 && !loading && (    
                    <div className="tracking-no-results">    
                      <Package className="tracking-no-results-icon" />    
                      <h3>Aucune commande trouvée</h3>    
                      <p>Aucune commande ne correspond à vos critères de recherche.</p>    
                    </div>    
                  )}    
                </div>    
              )}    
            </div>    
          </div>    
  
          {/* Pagination */}    
          {filteredOrders.length > 0 && (    
            <Pagination    
              currentPage={pagination.page}    
              totalPages={pagination.totalPages}    
              onPageChange={handlePageChange}    
              totalItems={pagination.total}    
              itemsPerPage={pagination.limit}    
            />    
          )}    
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
            <button     
              className="tracking-modal-close"     
              onClick={() => setIsDetailsModalOpen(false)}    
            >    
              <X className="tracking-close-icon" />    
            </button>    
          </div>    
  
          <div className="tracking-modal-body">    
            <div className="tracking-details-grid">    
              {/* Informations client */}    
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">Client</label>    
                <span className="tracking-detail-value">    
                  {selectedOrder.customer?.name ||     
                   `${selectedOrder.customer?.first_name || ''} ${selectedOrder.customer?.last_name || ''}`.trim() ||    
                   'Client inconnu'}    
                </span>    
              </div>    
  
              {/* ✅ SUPPRIMÉ: Type de client */}  
  
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">Téléphone</label>    
                <span className="tracking-detail-value">    
                  {selectedOrder.customer?.phone || selectedOrder.customer?.telephone_principal || 'N/A'}    
                </span>    
              </div>    
  
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">Email</label>    
                <span className="tracking-detail-value">    
                  {selectedOrder.customer?.email || 'N/A'}    
                </span>  
              </div>    
  
              {/* Adresse de livraison */}    
              <div className="tracking-detail-item tracking-full-width">    
                <label className="tracking-detail-label">Adresse de livraison</label>    
                <span className="tracking-detail-value">    
                  {selectedOrder.deliveryAddress ? (    
                    `${selectedOrder.deliveryAddress.street || ''}, ${selectedOrder.deliveryAddress.city || ''}`    
                  ) : 'N/A'}    
                </span>    
              </div>    
  
              {/* Informations commande */}    
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">Date de commande</label>    
                <span className="tracking-detail-value">    
                  {formatDate(selectedOrder.createdAt || selectedOrder.date_creation)}    
                </span>    
              </div>    
  
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">État</label>    
                <span className={`tracking-badge ${getStateBadgeClass(getRealOrderState(selectedOrder))}`}>    
                  {getStateText(getRealOrderState(selectedOrder))}    
                </span>    
              </div>    
  
              <div className="tracking-detail-item">    
                <label className="tracking-detail-label">Montant total</label>    
                <span className="tracking-detail-value tracking-total-highlight">    
                  {getTotalAmount(selectedOrder).toFixed(2)} MAD    
                </span>    
              </div>    
  
              
  
              {/* Évaluation si disponible */}    
              {selectedOrder.evaluation && (    
                <div className="tracking-detail-item tracking-full-width">    
                  <label className="tracking-detail-label">Évaluation</label>    
                  <div className="tracking-rating">    
                    {renderStars(selectedOrder.evaluation.rating || 0)}    
                    <span className="tracking-rating-text">    
                      ({selectedOrder.evaluation.rating || 0}/5)    
                    </span>    
                  </div>    
                </div>    
              )}    
  
              {/* Commentaires */}    
              {selectedOrder.comments && (    
                <div className="tracking-detail-item tracking-full-width">    
                  <label className="tracking-detail-label">Commentaires</label>    
                  <span className="tracking-detail-value">    
                    {selectedOrder.comments}    
                  </span>    
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