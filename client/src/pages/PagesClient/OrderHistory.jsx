import React, { useState, useEffect, useCallback } from "react";  
import { useNavigate } from 'react-router-dom';  
import api from '../../services/api';  
import { authService } from '../../services/authService';  
import Title from "../../components/client/TrackOrderPage/Title";  
import OrderStatusCard from "../../components/client/TrackOrderPage/OrderStatusCard";  
import OrderSummary from "../../components/client/TrackOrderPage/OrderSummary";  
import { Package, Eye, Calendar, MapPin } from 'lucide-react';  
import './OrderHistory.css';  
  
const OrderHistory = () => {  
  const [orders, setOrders] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);  
  const [selectedOrder, setSelectedOrder] = useState(null);  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);  
  const [searchTerm, setSearchTerm] = useState('');  
  const [filterStatus, setFilterStatus] = useState('all');  
  
  const navigate = useNavigate();  
  
  // Charger l'historique des commandes du client  
  const fetchOrderHistory = useCallback(async () => {    
    try {    
      setLoading(true);    
      setError(null);    
      
      const user = authService.getUser();    
      if (!user) {    
        navigate('/login');    
        return;    
      }    
      
      // Récupérer le customer_id depuis le profil utilisateur    
      let customerId = user?.customer_id;    
          
      // Si pas de customer_id dans les données locales, le récupérer via l'API profile    
      if (!customerId) {    
        const token = authService.getToken();    
        const profileResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/profile`, {    
          headers: {    
            'Authorization': `Bearer ${token}`,    
            'Content-Type': 'application/json'    
          }    
        });    
            
        if (profileResponse.ok) {    
          const profileData = await profileResponse.json();    
              
          console.log("📊 Structure complète profileData:", profileData);    
          console.log("🏢 Type d'utilisateur:", profileData.data?.customer_info?.type_client);    
              
          // Chercher le Customer par user_id dans la liste des customers    
          if (profileData.data?.customer_info) {    
            const customerResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/customers`, {    
              headers: {    
                'Authorization': `Bearer ${token}`,    
                'Content-Type': 'application/json'    
              }    
            });    
                
            if (customerResponse.ok) {    
              const customersData = await customerResponse.json();    
              console.log("📊 Données customers reçues:", customersData);    
                  
              // Trouver le customer qui correspond à cet utilisateur    
              const customer = customersData.data?.find(c => {    
                // Pour les entreprises (MORAL)    
                if (c.type_client === 'MORAL' && c.user_info?.id === profileData.data.id) {    
                  return true;    
                }    
                // Pour les particuliers (PHYSIQUE)    
                if (c.type_client === 'PHYSIQUE' && c.user_info?.id === profileData.data.id) {    
                  return true;    
                }    
                return false;    
              });    
                  
              if (customer) {    
                customerId = customer.id; // Utiliser customer.id    
                console.log("✅ Customer trouvé:", customer);    
              } else {    
                console.log("❌ Aucun customer trouvé pour l'utilisateur:", profileData.data.id);    
              }    
            }    
          }    
              
          console.log("🆔 Customer ID trouvé:", customerId);    
              
          // Mettre à jour les données utilisateur locales avec le customer_id    
          if (customerId && user) {    
            const updatedUser = { ...user, customer_id: customerId };    
            authService.setUser(updatedUser);    
          }    
        }    
      }    
      
      if (!customerId) {    
        setError('Informations client non disponibles. Veuillez contacter l\'administrateur.');    
        return;    
      }    
      
      // Utiliser l'endpoint existant qui fonctionne    
      const response = await api.get(`/commands/customer/${customerId}`);    
      console.log('Historique des commandes:', response.data);    
      
      if (response.data.success) {    
        setOrders(response.data.data || []);    
      } else {    
        setError('Erreur lors du chargement de l\'historique');    
      }    
    } catch (error) {    
      console.error('Erreur lors du chargement de l\'historique:', error);    
      setError('Erreur de connexion au serveur');    
    } finally {    
      setLoading(false);    
    }    
  }, [navigate]);  
  
  useEffect(() => {  
    fetchOrderHistory();  
  }, [fetchOrderHistory]);  
  
  // Fonction pour voir les détails d'une commande  
  const handleViewDetails = async (order) => {  
    try {  
      const orderResponse = await api.get(`/commands/${order._id || order.id}`);  
        
      if (orderResponse.data.success) {  
        setSelectedOrder(orderResponse.data.data);  
        setIsDetailModalOpen(true);  
      } else {  
        setError('Erreur lors du chargement des détails');  
      }  
    } catch (error) {  
      console.error('Erreur lors du chargement des détails:', error);  
      setError('Erreur lors du chargement des détails');  
    }  
  };  
  
  // Fonction pour obtenir le badge de statut  
  const getStatusBadge = (status) => {  
    const statusConfig = {  
      'NOUVELLE': { class: 'status-new', text: 'Nouvelle' },  
      'CONFIRMEE': { class: 'status-confirmed', text: 'Confirmée' },  
      'ASSIGNEE': { class: 'status-assigned', text: 'Assignée' },  
      'EN_COURS': { class: 'status-in-progress', text: 'En cours' },  
      'LIVREE': { class: 'status-delivered', text: 'Livrée' },  
      'ANNULEE': { class: 'status-cancelled', text: 'Annulée' },  
      'ECHOUEE': { class: 'status-failed', text: 'Échouée' }  
    };  
  
    const config = statusConfig[status] || { class: 'status-default', text: status };  
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;  
  };  
  
  // Fonction pour formater la date  
  const formatDate = (dateString) => {  
    if (!dateString) return 'N/A';  
    return new Date(dateString).toLocaleDateString('fr-FR', {  
      day: '2-digit',  
      month: '2-digit',  
      year: 'numeric',  
      hour: '2-digit',  
      minute: '2-digit'  
    });  
  };  
  
  // Fonction pour obtenir la description du statut  
  const getStatusDescription = (order) => {  
    // ✅ Utiliser order.command.statut au lieu de order.statut  
    const status = order?.command?.statut;  
      
    if (status) {  
      switch(status) {  
        case 'CONFIRMEE': return "Commande confirmée avec succès";  
        case 'ASSIGNEE': return "Commande assignée à un livreur";  
        case 'EN_COURS': return "Livraison en cours";  
        case 'LIVREE': return "Commande livrée avec succès";  
        case 'ANNULEE': return "Commande annulée";  
        case 'ECHOUEE': return "Échec de la livraison";  
        default: return "Statut inconnu";  
      }  
    }  
    return "Statut non disponible";  
  };  
  
  // Filtrer les commandes (suppression de la recherche par numéro)  
  const filteredOrders = orders.filter(order => {  
    const matchesStatus = filterStatus === 'all' ||   
                         order.statut === filterStatus ||   
                         order.command?.statut === filterStatus;  
      
    return matchesStatus;  
  });  
  
  // Calculer les statistiques  
  const stats = {  
    total: orders.length,  
    delivered: orders.filter(order =>   
      order.statut === 'LIVREE' || order.command?.statut === 'LIVREE'  
    ).length,  
    inProgress: orders.filter(order =>   
      order.statut === 'EN_COURS' || order.command?.statut === 'EN_COURS'  
    ).length,  
    cancelled: orders.filter(order =>   
      order.statut === 'ANNULEE' || order.command?.statut === 'ANNULEE'  
    ).length  
  };  
  
  if (loading) {  
    return (  
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">  
        <div className="text-center">  
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>  
          <div className="text-lg">Chargement de l'historique...</div>  
        </div>  
      </div>  
    );  
  }  
  
  if (error) {  
    return (  
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">  
        <div className="text-center">  
          <div className="text-red-500 mb-4">  
            <Package className="w-16 h-16 mx-auto mb-4" />  
          </div>  
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h3>  
          <p className="text-gray-600 mb-4">{error}</p>  
          <button   
            onClick={fetchOrderHistory}  
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"  
          >  
            Réessayer  
          </button>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="order-wrapper">  
      <div className="order-container">  
        <div className="order-content">  
          <div className="order-page-content">  
            <div className="min-h-screen bg-gray-50">  
              <Title title="Historique de mes Commandes" />  
  
              <div className="max-w-6xl mx-auto p-6">  
                {/* Statistiques */}  
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">  
                  <div className="bg-white rounded-lg shadow-md p-6">  
                    <div className="flex items-center">  
                      <Package className="w-8 h-8 text-blue-600 mr-3" />  
                      <div>  
                        <p className="text-sm text-gray-600">Total</p>  
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>  
                      </div>  
                    </div>  
                  </div>  
                    
                  <div className="bg-white rounded-lg shadow-md p-6">  
                    <div className="flex items-center">  
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">  
                        <div className="w-4 h-4 bg-green-600 rounded-full"></div>  
                      </div>  
                      <div>  
                        <p className="text-sm text-gray-600">Livrées</p>  
                        <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>  
                      </div>  
                    </div>  
                  </div>  
  
                  <div className="bg-white rounded-lg shadow-md p-6">  
                    <div className="flex items-center">  
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">  
                        <div className="w-4 h-4 bg-orange-600 rounded-full"></div>  
                      </div>  
                      <div>  
                        <p className="text-sm text-gray-600">En cours</p>  
                        <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>  
                      </div>  
                    </div>  
                  </div>  
  
                  <div className="bg-white rounded-lg shadow-md p-6">  
                    <div className="flex items-center">  
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">  
                        <div className="w-4 h-4 bg-red-600 rounded-full"></div>  
                      </div>  
                      <div>  
                        <p className="text-sm text-gray-600">Annulées</p>  
                        <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>  
                      </div>  
                    </div>  
                  </div>  
                </div>  
  
                {/* Filtres (suppression de la recherche par numéro) */}  
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">  
                  <div className="flex flex-col md:flex-row gap-4">  
                    <div>  
                      <select  
                        value={filterStatus}  
                        onChange={(e) => setFilterStatus(e.target.value)}  
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"  
                      >  
                        <option value="all">Tous les statuts</option>  
                        <option value="CONFIRMEE">Confirmée</option>  
                        <option value="ASSIGNEE">Assignée</option>  
                        <option value="EN_COURS">En cours</option>  
                        <option value="LIVREE">Livrée</option>  
                        <option value="ANNULEE">Annulée</option>  
                      </select>  
                    </div>  
                  </div>  
                </div>  
  
                {/* Liste des commandes */}  
                <div className="space-y-4">  
                  {filteredOrders.length === 0 ? (  
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">  
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />  
                      <p className="text-gray-600">  
                        {orders.length === 0 ? 'Aucune commande trouvée' : 'Aucune commande ne correspond aux critères de recherche'}  
                      </p>  
                    </div>  
                  ) : (  
                    filteredOrders.map((order) => (  
                      <div key={order._id || order.id} className="bg-white rounded-lg shadow-md p-6">  
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">  
                          <div className="flex-1">  
                            <div className="flex items-center gap-4 mb-2">  
                              <h3 className="text-lg font-semibold text-gray-900">  
                                Détails de la commande  
                              </h3>  
                            </div> 
                              
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">  
                              <div className="flex items-center">  
                                <Calendar className="w-4 h-4 mr-2" />  
                                <span>  
                                  {new Date(order.date_commande || order.command?.date_commande || order.createdAt).toLocaleDateString('fr-FR')}  
                                </span>  
                              </div>  
                             
                                
                              <div className="font-medium text-gray-900">  
                                Total: {order.montant_total || order.command?.total_ttc || 0} DH  
                              </div>  
                            </div>  
                          </div>  
                            
                          <div className="mt-4 md:mt-0">  
                            <button  
                              onClick={() => handleViewDetails(order)}  
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"  
                            >    
                              <Eye className="w-4 h-4 mr-2" />    
                              Voir les détails    
                            </button>    
                          </div>    
                        </div>    
                      </div>    
                    ))    
                  )}    
                </div>    
    
                {/* Modal de détails de commande */}    
                {isDetailModalOpen && selectedOrder && (    
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">    
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">    
                      <div className="p-6">    
                        {/* En-tête du modal */}    
                        <div className="flex justify-between items-center mb-6">    
                          <h2 className="text-2xl font-bold text-gray-900">    
                            Détails de la commande  
                          </h2>    
                          <button    
                            onClick={() => setIsDetailModalOpen(false)}    
                            className="text-gray-400 hover:text-gray-600"    
                          >    
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">    
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />    
                            </svg>    
                          </button>    
                        </div>    
    
  
    
                        {/* Informations de la commande */}    
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">    
                          {/* Informations générales */}    
                          <div className="bg-gray-50 rounded-lg p-4">    
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations générales</h3>    
                            <div className="space-y-2 text-sm">    
                              <div className="flex justify-between">  
                                <span className="text-gray-600">Date de commande:</span>  
                                <span className="font-medium">  
                                  {selectedOrder.command?.date_commande ?   
                                    new Date(selectedOrder.command.date_commande).toLocaleDateString('fr-FR') :   
                                    'Date non disponible'  
                                  }  
                                </span>  
                              </div>  
                                
                              <div className="flex justify-between">  
                                <span className="text-gray-600">Statut:</span>  
                                <span>{getStatusBadge(selectedOrder.command?.statut)}</span>  
                              </div>
                              {selectedOrder.notes && (    
                                <div className="mt-3">    
                                  <span className="text-gray-600">Notes:</span>    
                                  <p className="text-gray-900 mt-1">{selectedOrder.notes}</p>    
                                </div>    
                              )}    
                            </div>    
                          </div>    
    
                            
                        </div>    
    
                        {/* Détails de la commande avec OrderSummary */}    
                        <div className="mb-6">    
                          <OrderSummary orderData={selectedOrder} />    
                        </div>    
    
                        {/* Actions du modal */}    
                        <div className="mt-6 flex justify-end space-x-3">    
                          <button    
                            onClick={() => setIsDetailModalOpen(false)}    
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"    
                          >    
                            Fermer    
                          </button>    
                          {selectedOrder.statut === 'LIVREE' && (    
                            <button    
                              onClick={() => navigate('/service-evaluation', {     
                                state: { orderId: selectedOrder._id }     
                              })}    
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"    
                            >    
                              Évaluer le service    
                            </button>    
                          )}    
                        </div>    
                      </div>    
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
};    
    
export default OrderHistory;