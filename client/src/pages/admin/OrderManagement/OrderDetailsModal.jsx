import React from 'react';    
import {    
  MdClose as X,    
  MdDescription as ClipboardList,    
  MdPerson as User,    
  MdCalendarToday as Calendar,    
  MdInventory as Package,    
  MdHistory as History,    
  MdLocationOn as MapPin,    
  MdLocalShipping as Truck,  
  MdFlag as Flag  
} from 'react-icons/md';    
    
const OrderDetailsModal = ({ order, onClose }) => {    
  const getStatusColor = (status) => {    
    const statusColors = {    
      pending: 'bg-yellow-100 text-yellow-800',    
      assigned: 'bg-blue-100 text-blue-800',    
      in_progress: 'bg-purple-100 text-purple-800',    
      delivered: 'bg-green-100 text-green-800',    
      cancelled: 'bg-red-100 text-red-800'    
    };    
    return statusColors[status] || 'bg-gray-100 text-gray-800';    
  };    
    
  const getStatusText = (status) => {    
    const statusTexts = {    
      pending: 'En attente',    
      assigned: 'Assignée',    
      in_progress: 'En cours',    
      delivered: 'Livrée',    
      cancelled: 'Annulée'    
    };    
    return statusTexts[status] || status;    
  };    
    
  const getPriorityColor = (priority) => {    
    const priorityColors = {    
      urgent: 'bg-red-100 text-red-800',    
      high: 'bg-orange-100 text-orange-800',    
      medium: 'bg-yellow-100 text-yellow-800',    
      low: 'bg-green-100 text-green-800'    
    };    
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';    
  };    
    
  const getPriorityText = (priority) => {    
    const priorityTexts = {    
      urgent: 'Urgente',    
      high: 'Haute',    
      medium: 'Moyenne',    
      low: 'Basse'    
    };    
    return priorityTexts[priority] || priority;    
  };    
  
  const getPriorityIcon = (priority) => {  
    const icons = {  
      urgent: '🔴',  
      high: '🟠',   
      medium: '🟡',  
      low: '🟢'  
    };  
    return icons[priority] || '⚪';  
  };  
    
  // Calculer le total si pas disponible    
  const calculateTotal = () => {    
    if (order?.montant_total) return order.montant_total;    
    if (order?.total_ttc) return order.total_ttc;    
        
    if (order?.products && order.products.length > 0) {    
      return order.products.reduce((total, product) => {    
        const quantity = product.quantite || product.quantity || 0;    
        const price = product.prix_unitaire || product.price || 0;    
        return total + (quantity * price);    
      }, 0);    
    }    
        
    return 0;    
  };    
    
  const formatCurrency = (amount) => {    
    return new Intl.NumberFormat('fr-FR', {    
      style: 'currency',    
      currency: 'MAD',    
      minimumFractionDigits: 2    
    }).format(amount);    
  };    
    
  return (    
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">    
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>    
          
      <div className="relative w-full max-w-4xl mx-auto my-6">    
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-xl outline-none focus:outline-none max-h-[90vh] overflow-hidden">    
          {/* Header */}    
          <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t-lg">    
            <div className="flex items-center">    
              <ClipboardList className="w-6 h-6 mr-2 text-blue-500" />    
              <div>    
                <h2 className="text-xl font-semibold text-gray-800">    
                  Détails de la Commande <span className="text-blue-600">{order?.orderNumber || order?.numero_commande}</span>    
                </h2>    
                {order?.priority && (    
                  <div className="flex items-center mt-1">  
                    <Flag className="w-4 h-4 mr-1 text-gray-500" />  
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>    
                      {getPriorityIcon(order.priority)} {getPriorityText(order.priority)}    
                    </span>    
                  </div>  
                )}    
              </div>    
            </div>    
            <button    
              className="p-1 ml-auto bg-transparent border-0 text-gray-500 hover:text-gray-900 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"    
              onClick={onClose}    
            >    
              <X className="w-6 h-6" />    
            </button>    
          </div>    
    
          {/* Body - Scrollable */}    
          <div className="relative p-6 flex-auto overflow-y-auto">    
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">    
              {/* Informations Client */}    
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">    
                <h3 className="flex items-center text-lg font-bold text-gray-700 mb-3 border-b pb-2">    
                  <User className="w-5 h-5 mr-2 text-blue-500" />    
                  Informations Client    
                </h3>    
                <div className="space-y-2">    
                  <div className="flex justify-between">    
                    <label className="text-sm font-medium text-gray-500">Nom</label>    
                    <span className="text-sm text-gray-900 font-semibold">{order?.customer?.name || 'N/A'}</span>    
                  </div>    
                  <div className="flex justify-between">    
                    <label className="text-sm font-medium text-gray-500">Téléphone</label>    
                    <span className="text-sm text-gray-900 font-semibold">{order?.customer?.phone || 'N/A'}</span>    
                  </div>    
                  {order?.customer?.email && (    
                    <div className="flex justify-between">    
                      <label className="text-sm font-medium text-gray-500">Email</label>    
                      <span className="text-sm text-gray-900">{order.customer.email}</span>    
                    </div>    
                  )}    
                  <div className="flex justify-between">    
                    <label className="text-sm font-medium text-gray-500">Type</label>    
                    <span className="text-sm text-gray-900">{order?.customer?.type || 'Particulier'}</span>    
                  </div>    
                </div>    
              </div>    
    
              {/* Statut & Dates */}    
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">    
                <h3 className="flex items-center text-lg font-bold text-gray-700 mb-3 border-b pb-2">    
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />    
                  Statut & Dates    
                </h3>    
                <div className="space-y-2">    
                  <div className="flex justify-between items-center">    
                    <label className="text-sm font-medium text-gray-500">Statut</label>    
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order?.status)}`}>    
                      {getStatusText(order?.status)}    
                    </span>    
                  </div>    
                  <div className="flex justify-between">    
                    <label className="text-sm font-medium text-gray-500">Date de commande</label>    
                    <span className="text-sm text-gray-900 font-semibold">    
                      {order?.orderDate ? new Date(order.orderDate).toLocaleDateString("fr-FR") : 'N/A'}    
                    </span>    
                  </div>    
                  <div className="flex justify-between">    
                    <label className="text-sm font-medium text-gray-500">Livraison souhaitée</label>    
                    <span className="text-sm text-gray-900 font-semibold">    
                      {order?.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString("fr-FR") : 'N/A'}    
                    </span>    
                  </div>    
                  {order?.createdAt && (    
                    <div className="flex justify-between">    
                      <label className="text-sm font-medium text-gray-500">Créée le</label>    
                      <span className="text-sm text-gray-900">    
                        {new Date(order.createdAt).toLocaleString("fr-FR")}    
                      </span>    
                    </div>    
                  )}    
                </div>    
              </div>    
    
              {/* Détails de livraison */}    
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm lg:col-span-2">    
                <h3 className="flex items-center text-lg font-bold text-gray-700 mb-3 border-b pb-2">    
                  <MapPin className="w-5 h-5 mr-2 text-blue-500" />    
                  Détails de Livraison    
                </h3>    
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">    
                  <div className="space-y-2">    
                    <div className="flex justify-between">    
                      <label className="text-sm font-medium text-gray-500">Adresse</label>    
                      <span className="text-sm text-gray-900 text-right font-semibold">    
                        {order?.deliveryAddress ? (    
                          <>    
                            {order.deliveryAddress.address || order.deliveryAddress.street}, {order.deliveryAddress.city}    
                            {order.deliveryAddress.postalCode && `, ${order.deliveryAddress.postalCode}`}    
                          </>    
                        ) : 'N/A'}    
                      </span>    
                    </div>    
                    {order?.deliveryAddress?.quartier && (    
                      <div className="flex justify-between">    
                        <label className="text-sm font-medium text-gray-500">Quartier</label>    
                        <span className="text-sm text-gray-900">{order.deliveryAddress.quartier}</span>    
                      </div>    
                    )}    
                  </div>    
                  <div className="space-y-2">    
                    {order?.deliveryAddress?.latitude && order?.deliveryAddress?.longitude && (    
                      <div className="flex justify-between">    
                        <label className="text-sm font-medium text-gray-500">Coordonnées</label>    
                        <span className="text-sm text-gray-900">    
                          {order.deliveryAddress.latitude.toFixed(6)}, {order.deliveryAddress.longitude.toFixed(6)}    
                        </span>    
                      </div>    
                    )}    
                    {order?.customerNotes && (    
                      <div className="flex justify-between">    
                        <label className="text-sm font-medium text-gray-500">Commentaires</label>    
                        <p className="text-sm text-gray-900 text-right max-w-xs">{order.customerNotes}</p>    
                      </div>    
                    )}    
                  </div>    
                </div>    
              </div>    
    
              {/* Assignation camion - Affichage amélioré */}    
              {order?.assignedTruck && (    
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm lg:col-span-2 border-l-4 border-blue-500">    
                  <h3 className="flex items-center text-lg font-bold text-blue-700 mb-3 border-b border-blue-200 pb-2">    
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />    
                    Assignation Camion    
                  </h3>    
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">    
                    <div className="space-y-2">  
                      <div className="flex justify-between">    
                        <label className="text-sm font-medium text-blue-600">Camion</label>    
                        <span className="text-sm text-blue-900 font-semibold">    
                          {order.assignedTruck.plateNumber} - {order.assignedTruck.model}    
                        </span>    
                      </div>    
                      {order.assignedTruck.capacity && (  
                        <div className="flex justify-between">    
                          <label className="text-sm font-medium text-blue-600">Capacité</label>    
                          <span className="text-sm text-blue-900">{order.assignedTruck.capacity}</span>    
                        </div>    
                      )}  
                    </div>  
                    <div className="space-y-2">  
                      <div className="flex justify-between">    
                        <label className="text-sm font-medium text-blue-600">Chauffeur</label>    
                        <span className="text-sm text-blue-900 font-semibold">  
                          {order.assignedTruck.driverName || 'Non assigné'}  
                        </span>    
                      </div>    
                      {order.assignedTruck.accompagnateur && (    
                        <div className="flex justify-between">    
                          <label className="text-sm font-medium text-blue-600">Accompagnateur</label>    
                          <span className="text-sm text-blue-900">{order.assignedTruck.accompagnateur}</span>    
                        </div>    
                      )}    
                    </div>  
                  </div>    
                </div>    
              )}    

              {/* Lignes de commande */}    
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm lg:col-span-2">    
                <h3 className="flex items-center text-lg font-bold text-gray-700 mb-3 border-b pb-2">    
                  <Package className="w-5 h-5 mr-2 text-blue-500" />    
                  Produits commandés    
                </h3>    
                <div className="space-y-2">    
                  {order?.products && order.products.length > 0 ? (    
                    <>    
                      <div className="overflow-x-auto">    
                        <table className="min-w-full">    
                          <thead>    
                            <tr className="border-b border-gray-200">    
                              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Produit</th>    
                              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Qté</th>    
                              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Prix Unit.</th>    
                              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Total</th>    
                            </tr>    
                          </thead>    
                          <tbody>    
                            {order.products.map((product, index) => {    
                              const quantity = product.quantite || product.quantity || 0;    
                              const unitPrice = product.prix_unitaire || product.price || 0;    
                              const lineTotal = product.total_ligne || (quantity * unitPrice);    
                                  
                              return (    
                                <tr key={product._id || index} className="border-b border-gray-100 last:border-b-0">    
                                  <td className="text-sm text-gray-700 py-2">    
                                    {product.product_id?.nom_long || product.productName || product.name || 'Produit'}    
                                  </td>    
                                  <td className="text-sm text-gray-900 text-right py-2">{quantity}</td>    
                                  <td className="text-sm text-gray-900 text-right py-2">{unitPrice.toFixed(2)} DH</td>    
                                  <td className="text-sm text-gray-900 font-semibold text-right py-2">    
                                    {lineTotal.toFixed(2)} DH    
                                  </td>    
                                </tr>    
                              );    
                            })}    
                          </tbody>    
                        </table>    
                      </div>    
                          
                      {/* Totaux */}    
                      <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">    
                        <div className="flex justify-between text-sm">    
                          <span className="font-medium text-gray-700">Sous-total</span>    
                          <span className="font-semibold text-gray-900">    
                            {calculateTotal().toFixed(2)} DH    
                          </span>    
                        </div>    
                        <div className="flex justify-between text-sm">    
                          <span className="font-medium text-gray-700">Frais de livraison</span>    
                          <span className="font-semibold text-gray-900">20.00 DH</span>    
                        </div>    
                        <div className="flex justify-between text-lg font-bold border-t pt-2">    
                          <span className="text-gray-900">Total TTC</span>    
                          <span className="text-blue-600">    
                            {(calculateTotal() + 20).toFixed(2)} DH    
                          </span>    
                        </div>    
                      </div>    
                    </>    
                  ) : (    
                    <p className="text-sm text-gray-500 italic text-center py-4">Aucun produit listé.</p>    
                  )}    
                </div>    
              </div>    
    
              {/* Historique */}    
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm lg:col-span-2">    
                <h3 className="flex items-center text-lg font-bold text-gray-700 mb-3 border-b pb-2">    
                  <History className="w-5 h-5 mr-2 text-blue-500" />    
                  Historique    
                </h3>    
                <div className="space-y-2">    
                  {order?.history && order.history.length > 0 ? (    
                    <div className="max-h-32 overflow-y-auto">    
                      {order.history.map((event, index) => (    
                        <div key={event.id || index} className="flex items-start gap-3 py-2">    
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>    
                          <div className="flex-1">    
                            <div className="flex justify-between items-start">    
                              <h5 className="text-sm font-semibold text-gray-900">{event.action}</h5>    
                              <span className="text-xs text-gray-500">    
                                {new Date(event.timestamp).toLocaleString("fr-FR")}    
                              </span>    
                            </div>    
                            <p className="text-xs text-gray-600 mt-1">{event.details}</p>    
                            {event.userName && (    
                              <p className="text-xs text-gray-500 mt-1">Par: {event.userName}</p>    
                            )}    
                          </div>    
                        </div>    
                      ))}    
                    </div>    
                  ) : (    
                    <p className="text-sm text-gray-500 italic text-center py-4">Aucun historique disponible.</p>    
                  )}    
                </div>    
              </div>    
            </div>    
          </div>    
              
          {/* Footer */}    
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b-lg">    
            <button    
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"    
              onClick={onClose}    
            >    
              Fermer    
            </button>    
          </div>    
        </div>    
      </div>    
    </div>    
  );    
};    
    
export default OrderDetailsModal;