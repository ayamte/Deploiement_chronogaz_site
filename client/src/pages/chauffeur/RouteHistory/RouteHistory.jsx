import React, { useState, useEffect } from 'react'  
import {  
  MdLocalShipping as TruckIcon,  
  MdCheckCircle as CheckCircle,  
  MdCancel as XCircle,  
  MdWarning as AlertTriangle,  
  MdInventory as Package,  
  MdDescription as FileText,  
  MdAccessTime as Clock,  
  MdLocationOn as MapPin,  
  MdCalendarToday as Calendar,  
} from 'react-icons/md'  
import './RouteHistory.css'  
import { authService } from '../../../services/authService'  
import livraisonService from '../../../services/livraisonService'  
  
export default function RouteHistoryPage() {  
  const [routeHistories, setRouteHistories] = useState([])  
  const [selectedRoute, setSelectedRoute] = useState(null)  
  const [loading, setLoading] = useState(true)  
  const [currentUser, setCurrentUser] = useState(null)  
  const [error, setError] = useState(null)  
  
  // Récupérer l'utilisateur connecté avec employee_id  
  useEffect(() => {  
    const fetchCurrentUser = async () => {  
      try {  
        console.log('🔍 DÉBUT - Récupération utilisateur connecté')  
        const token = authService.getToken()  
          
        if (!token) {  
          console.error('❌ ERREUR: Aucun token trouvé')  
          setError('Session expirée - veuillez vous reconnecter')  
          return  
        }  
          
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/profile`, {  
          headers: {  
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json'  
          }  
        })  
          
        if (!response.ok) {  
          console.error('❌ ERREUR API:', response.status, response.statusText)  
          return  
        }  
          
        const data = await response.json()  
          
        if (!data.success || !data.data) {  
          console.error('❌ ERREUR: Données utilisateur manquantes')  
          return  
        }  
          
        const userData = {  
          ...data.data,  
          employee_id: data.data.employee_info?._id  
        }  
          
        if (!userData.employee_id) {  
          console.error('❌ ERREUR: employee_id manquant dans userData')  
          setError('ID employé manquant - contactez l\'administrateur')  
          return  
        }  
          
        console.log('✅ Employee ID trouvé:', userData.employee_id)  
        setCurrentUser(userData)  
          
      } catch (error) {  
        console.error('💥 EXCEPTION lors de la récupération utilisateur:', error)  
        setError(`Erreur technique: ${error.message}`)  
      }  
    }  
    fetchCurrentUser()  
  }, [])  
  
  // Charger les données au montage du composant  
  useEffect(() => {  
    if (currentUser?.employee_id) {  
      console.log('🚀 Déclenchement du chargement pour employee_id:', currentUser.employee_id)  
      loadRouteHistories()  
    } else {  
      console.log('⏳ En attente de l\'employee_id...')  
    }  
  }, [currentUser])  
  
  const loadRouteHistories = async () => {  
    setLoading(true)  
    setError(null)  
        
    try {  
      console.log('🔍 Début chargement historique pour employé:', currentUser?.employee_id)  
          
      const deliveriesData = await livraisonService.getLivraisons({  
        livreur_employee_id: currentUser.employee_id,  
        etat: 'all'  
      })  
          
      console.log('📦 Données reçues de l\'API:', deliveriesData)  
      console.log('📊 Nombre de livraisons:', deliveriesData.total)  
          
      if (!deliveriesData.data) {  
        throw new Error('Données invalides reçues de l\'API')  
      }  
      
      const routeHistoriesMap = new Map()  
          
      // ✅ MODIFICATION: Utiliser for...of pour supporter async/await  
      for (const delivery of deliveriesData.data) {  
        console.log(`🚚 Traitement livraison:`, {  
          id: delivery.id,  
          commande: delivery.commande_id?.numero_commande,  
          statut: delivery.commande_id?.statut,  
          date: delivery.delivery_date  
        })  
            
        const deliveryDate = delivery.delivery_date  
        if (!deliveryDate) {  
          console.warn('⚠️ Date de livraison manquante pour:', delivery.id)  
          continue  
        }  
            
        const routeDate = new Date(deliveryDate).toISOString().split('T')[0]  
            
        if (!routeHistoriesMap.has(routeDate)) {  
          routeHistoriesMap.set(routeDate, {  
            routeId: `route-${routeDate}`,  
            chauffeurId: currentUser.employee_id,  
            truckId: delivery.trucks_id?._id,  
            routeDate: routeDate,  
            startTime: "08:00",  
            endTime: "18:00",  
            totalDeliveries: 0,  
            successfulDeliveries: 0,  
            failedDeliveries: 0,  
            partialDeliveries: 0,  
            totalDistance: 0,  
            fuelUsed: 0,  
            status: "finalized",  
            deliveries: [],  
            truck: delivery.trucks_id || { matricule: 'Camion' }  
          })  
        }  
      
        const routeHistory = routeHistoriesMap.get(routeDate)  
            
        // ✅ MODIFICATION: Fonction async pour récupérer les vraies données  
        const transformedDelivery = await transformLivraisonServiceToHistoryFormat(delivery)  
        console.log('✅ Livraison transformée:', transformedDelivery)  
            
        if (transformedDelivery) {  
          routeHistory.deliveries.push(transformedDelivery)  
          routeHistory.totalDeliveries++  
              
          switch (transformedDelivery.status) {  
            case 'delivered':  
              routeHistory.successfulDeliveries++  
              break  
            case 'partial':  
              routeHistory.partialDeliveries++  
              break  
            case 'failed':  
              routeHistory.failedDeliveries++  
              break  
          }  
        }  
      }  
      
      const sortedRoutes = Array.from(routeHistoriesMap.values()).sort((a, b) =>  
        new Date(b.routeDate) - new Date(a.routeDate)  
      )  
      
      console.log('📋 Routes finales groupées:', sortedRoutes)  
      setRouteHistories(sortedRoutes)  
      if (sortedRoutes.length > 0) {  
        setSelectedRoute(sortedRoutes[0])  
      }  
    } catch (error) {  
      console.error("❌ Erreur lors du chargement de l'historique:", error)  
      setError('Impossible de charger l\'historique des tournées')  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // ✅ FONCTION CORRIGÉE: Récupération des vraies données de produits  
  const transformLivraisonServiceToHistoryFormat = async (delivery) => {  
    try {  
      const commande = delivery.commande_id  
      if (!commande) {  
        console.warn('⚠️ Commande manquante pour la livraison:', delivery.id)  
        return null  
      }  
  
      // Nom du client  
      let customerName = 'Client inconnu'  
      if (commande.customer_id?.physical_user_id) {  
        customerName = `${commande.customer_id.physical_user_id.first_name} ${commande.customer_id.physical_user_id.last_name}`  
      } else if (commande.customer_id?.customer_code) {  
        customerName = commande.customer_id.customer_code  
      }  
  
      // Adresse  
      let address = 'Adresse non disponible'  
      if (commande.address_id) {  
        const addr = commande.address_id  
        address = `${addr.numimmeuble || ''} ${addr.street || ''}, ${addr.city_id?.name || 'Ville'}`.trim()  
      }  
  
      const orderTotal = commande.montant_total || delivery.total || delivery.total_ttc || 0  
  
      // ✅ NOUVEAU: Récupérer les vraies lignes de produits  
      let products = []  
      try {  
        const livraisonDetails = await livraisonService.getLivraisonById(delivery.id)  
        products = livraisonDetails.lignes.map(ligne => ({  
          id: ligne.id,  
          productName: ligne.product?.nom || ligne.product?.long_name || 'Produit',  
          quantity: ligne.quantity,  
          unit: ligne.unite?.nom || 'unités',  
          price: ligne.price || 0,  
          total: ligne.total_ligne || (ligne.quantity * ligne.price)  
        }))  
      } catch (error) {  
        console.warn('⚠️ Impossible de récupérer les lignes pour la livraison:', delivery.id)  
        // Fallback vers les données statiques seulement si l'appel échoue  
        products = delivery.total ? [{  
          id: 'default',  
          productName: 'Produits de la commande',  
          quantity: 1,  
          unit: 'commande',  
          price: delivery.total,  
          total: delivery.total  
        }] : []  
      }  
  
      return {  
        id: delivery.id,  
        orderNumber: commande.numero_commande,  
        customerName: customerName,  
        address: address,  
        actualDeliveryTime: delivery.date ? new Date(delivery.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "Non spécifié",  
        status: mapLivraisonStatusToDeliveryStatus(delivery.etat),  
        products: products, // ✅ Utiliser les vraies données  
        orderTotal: orderTotal,  
        customerNotes: commande.details || delivery.details || ''  
      }  
    } catch (error) {  
      console.error('❌ Erreur transformation livraison:', error)  
      return null  
    }  
  }  
  
  const mapLivraisonStatusToDeliveryStatus = (etat) => {  
    switch (etat) {  
      case 'LIVRE': return 'delivered'  
      case 'ANNULE': return 'failed'  
      case 'ECHEC': return 'failed'  
      default: return 'delivered'  
    }  
  }  
  
  // Fonctions utilitaires  
  const formatDate = (dateString) => {  
    const date = new Date(dateString)  
    return date.toLocaleDateString('fr-FR', {  
      weekday: 'long',  
      year: 'numeric',  
      month: 'long',  
      day: 'numeric'  
    })  
  }  
  
  const formatShortDate = (dateString) => {  
    const date = new Date(dateString)  
    return date.toLocaleDateString('fr-FR', {  
      day: '2-digit',  
      month: '2-digit'  
    })  
  }  
  
  const getStatusText = (status) => {  
    switch (status) {  
      case "delivered": return "Livré"  
      case "partial": return "Partiel"  
      case "failed": return "Échec"  
      default: return status  
    }  
  }  
  
  const getStatusIcon = (status) => {  
    switch (status) {  
      case "delivered": return <CheckCircle className="rh-status-icon" />  
      case "partial": return <AlertTriangle className="rh-status-icon" />  
      case "failed": return <XCircle className="rh-status-icon" />  
      default: return null  
    }  
  }  
  
  const getStatusColor = (status) => {  
    switch (status) {  
      case "delivered": return "rh-status-delivered"  
      case "partial": return "rh-status-partial"  
      case "failed": return "rh-status-failed"  
      default: return "rh-status-default"  
    }  
  }  
  
  if (loading) {  
    return (  
      <div className="rh-layout">  
        <div className="rh-wrapper">  
          <div className="rh-loading">  
            <div className="rh-spinner" />  
            <p>Chargement de l'historique...</p>  
          </div>  
        </div>  
      </div>  
    )  
  }  
  
  if (error) {  
    return (  
      <div className="rh-layout">  
        <div className="rh-wrapper">  
          <div className="rh-error">  
            <XCircle className="rh-error-icon" />  
            <h3>Erreur</h3>  
            <p>{error}</p>  
            <button onClick={loadRouteHistories} className="rh-btn rh-btn-primary">  
              Réessayer  
            </button>  
          </div>  
        </div>  
      </div>  
    )  
  }  
  
  return (  
    <div className="rh-layout">  
      <div className="rh-wrapper">  
        <div className="rh-container">  
          <div className="rh-content">  
            {/* Header */}  
            <div className="rh-header">  
              <div className="rh-header-left">  
                <div className="rh-title-section">  
                  <FileText className="rh-title-icon" />  
                  <h1 className="rh-title">Historique des Tournées</h1>  
                </div>  
              </div>  
            </div>  
  
            {/* Main Content */}  
            <div className="rh-main-grid">  
              {/* Left Column - Routes List by Day */}  
              <div className="rh-routes-list">  
                <div className="rh-card">  
                  <div className="rh-card-header">  
                    <h3 className="rh-card-title">  
                      Tournées par jour ({routeHistories.length})  
                    </h3>  
                  </div>  
                  <div className="rh-card-content">  
                    {routeHistories.length === 0 ? (  
                      <div className="rh-empty-state">  
                        <FileText className="rh-empty-icon" />  
                        <h3 className="rh-empty-title">Aucune tournée trouvée</h3>  
                        <p className="rh-empty-message">Aucune tournée finalisée n'a été trouvée.</p>  
                      </div>  
                    ) : (  
                      <div className="rh-routes-items">  
                        {routeHistories.map((route) => (  
                          <div  
                            key={route.routeId}  
                            className={`rh-route-item ${selectedRoute?.routeId === route.routeId ? 'rh-route-item-selected' : ''}`}  
                            onClick={() => setSelectedRoute(route)}  
                          >  
                            <div className="rh-route-header">  
                              <div className="rh-route-date">  
                                <Calendar className="rh-route-date-icon" />  
                                <div className="rh-date-info">  
                                  <span className="rh-date-main">{formatShortDate(route.routeDate)}</span>  
                                  <span className="rh-date-day">{formatDate(route.routeDate).split(',')[0]}</span>  
                                </div>  
                              </div>  
                              <div className="rh-route-status rh-status-finalized">  
                                Finalisée  
                              </div>  
                            </div>  
                            <div className="rh-route-summary">
                              <div className="rh-route-stats">  
                                <span className="rh-stat">  
                                  <Package className="rh-stat-icon" />  
                                  {route.totalDeliveries} livraisons  
                                </span>   
                              </div>  
                            </div>  
                          </div>  
                        ))}  
                      </div>  
                    )}  
                  </div>  
                </div>  
              </div>  
  
              {/* Right Column - Route Details */}  
              <div className="rh-route-details">  
                {selectedRoute ? (  
                  <>  
                    {/* Route Overview */}  
                    <div className="rh-card">  
                      <div className="rh-card-header">  
                        <h3 className="rh-card-title">Détails de la Tournée</h3>  
                        <div className="rh-route-date-badge">  
                          {formatDate(selectedRoute.routeDate)}  
                        </div>  
                      </div>  
                    </div>  
  
                    {/* Statistics Cards */}  
                    <div className="rh-stats-grid">  
                      <div className="rh-stat-card">  
                        <div className="rh-stat-content">  
                          <div className="rh-stat-info">  
                            <p className="rh-stat-label">Total Livraisons</p>  
                            <p className="rh-stat-value">{selectedRoute.totalDeliveries}</p>  
                          </div>  
                          <Package className="rh-stat-icon-large rh-text-blue" />  
                        </div>  
                      </div>  
  
                      <div className="rh-stat-card">  
                        <div className="rh-stat-content">  
                          <div className="rh-stat-info">  
                            <p className="rh-stat-label">Réussies</p>  
                            <p className="rh-stat-value rh-text-green">{selectedRoute.successfulDeliveries}</p>  
                          </div>  
                          <CheckCircle className="rh-stat-icon-large rh-text-green" />  
                        </div>  
                      </div>  
  
                      <div className="rh-stat-card">  
                        <div className="rh-stat-content">  
                          <div className="rh-stat-info">  
                            <p className="rh-stat-label">Partielles</p>  
                            <p className="rh-stat-value rh-text-orange">{selectedRoute.partialDeliveries}</p>  
                          </div>  
                          <AlertTriangle className="rh-stat-icon-large rh-text-orange" />  
                        </div>  
                      </div>  
  
                      <div className="rh-stat-card">  
                        <div className="rh-stat-content">  
                          <div className="rh-stat-info">  
                            <p className="rh-stat-label">Échecs</p>  
                            <p className="rh-stat-value rh-text-red">{selectedRoute.failedDeliveries}</p>  
                          </div>  
                          <XCircle className="rh-stat-icon-large rh-text-red" />  
                        </div>  
                      </div>  
                    </div>  
  
                    {/* Delivery Details */}  
                    <div className="rh-card">  
                      <div className="rh-card-header">  
                        <h3 className="rh-card-title">Détails des Livraisons</h3>  
                      </div>  
                      <div className="rh-card-content">  
                        <div className="rh-deliveries-list">  
                          {selectedRoute.deliveries.map((delivery, index) => (  
                            <div key={delivery.id} className="rh-delivery-item">  
                              <div className="rh-delivery-header">  
                                <div className="rh-delivery-info">  
                                  <h4 className="rh-delivery-customer">{delivery.customerName}</h4>  
                                  <div className={`rh-delivery-status ${getStatusColor(delivery.status)}`}>  
                                    {getStatusIcon(delivery.status)}  
                                    <span className="rh-status-text">{getStatusText(delivery.status)}</span>  
                                  </div>  
                                </div>  
                                <div className="rh-delivery-order">  
                                  Commande: {delivery.orderNumber}  
                                </div>  
                              </div>  
  
                              <div className="rh-delivery-address">  
                                <MapPin className="rh-address-icon" />  
                                {delivery.address}  
                              </div>  
  
                              <div className="rh-delivery-times">  
                                <div className="rh-time-item">  
                                  <span className="rh-time-label">Heure de livraison:</span>  
                                  <span className="rh-time-value">{delivery.actualDeliveryTime || "Non livré"}</span>  
                                </div>  
                              </div>  
  
                              {/* ✅ SECTION PRODUITS CORRIGÉE - Style similaire à OrderHistory client */}  
                              <div className="rh-delivery-products">  
                                <h5 className="rh-products-title">Produits:</h5>  
                                <div className="rh-products-list">  
                                  {delivery.products && delivery.products.length > 0 ? (  
                                    delivery.products.map((product) => (  
                                      <div key={product.id} className="rh-product-item">  
                                        <div className="rh-product-info">  
                                          <span className="rh-product-name">  
                                            {product.productName}  
                                          </span>  
                                        </div>  
                                        <div className="rh-product-details">  
                                          <span className="rh-product-quantity">  
                                            Quantité: {product.quantity} {product.unit}  
                                          </span>  
                                          <span className="rh-product-price">  
                                            Prix unitaire: {product.price?.toFixed(2) || '0.00'} DH  
                                          </span>  
                                          <span className="rh-product-total">  
                                            Total: {product.total?.toFixed(2) || '0.00'} DH  
                                          </span>  
                                        </div>  
                                      </div>  
                                    ))  
                                  ) : (  
                                    <p className="text-gray-500">Aucun produit disponible</p>  
                                  )}  
                                </div>  
                                  
                                {/* ✅ PRIX TOTAL DE LA COMMANDE */}  
                                <div className="rh-order-total">  
                                  <div className="rh-total-line">  
                                    <span className="rh-total-label">Total commande:</span>  
                                    <span className="rh-total-value">  
                                      {delivery.orderTotal?.toFixed(2) || '0.00'} DH  
                                    </span>  
                                  </div>  
                                </div>  
                              </div>  
  
                              {/* Customer Notes */}  
                              {delivery.customerNotes && (  
                                <div className="rh-customer-notes">  
                                  <p className="rh-notes-label">Notes client:</p>  
                                  <p className="rh-notes-text">{delivery.customerNotes}</p>  
                                </div>  
                              )}  
                            </div>  
                          ))}  
                        </div>  
                      </div>  
                    </div>  
                  </>  
                ) : (  
                  <div className="rh-no-selection">  
                    <FileText className="rh-no-selection-icon" />  
                    <h3 className="rh-no-selection-title">Sélectionnez une tournée</h3>  
                    <p className="rh-no-selection-message">  
                      Choisissez une tournée dans la liste pour voir ses détails.  
                    </p>  
                  </div>  
                )}  
              </div>  
            </div>  
          </div>  
        </div>  
      </div>  
    </div>  
  )  
}
