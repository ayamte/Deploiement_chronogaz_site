import { MapPin, Phone, Eye, Truck } from 'lucide-react';
import React from 'react';
import DriverInfo from '../OrderHistoryPage/DriverInfo';
import StatusBadge from '../OrderHistoryPage/StatusBadge';

const OrderCard = ({ order }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer le total des articles
  const calculateItemsTotal = () => {
    return order.items?.reduce((total, item) => total + (item.total || item.price * item.quantity), 0) || 0;
  };

  const itemsTotal = calculateItemsTotal();
  const deliveryFee = order.deliveryFee || 0;
  const finalTotal = order.total_ttc || (itemsTotal + deliveryFee);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Header de la carte */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{color: '#1F55A3'}}>
              {order.numero_commande}
            </h3>
            <p className="text-gray-600 text-sm">
              {formatDate(order.date_souhaite)} à {formatTime(order.date_souhaite)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <StatusBadge status={order.statut_id.nom} />
            <span className="text-xl font-bold" style={{color: '#1F55A3'}}>
              {finalTotal?.toLocaleString()} DH
            </span>
          </div>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className="p-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Items de la commande */}
          <div>
            <h4 className="font-semibold mb-3" style={{color: '#245FA6'}}>
              Articles commandés ({order.lignes?.length || 0})
            </h4>
            <div className="space-y-2">
              {order.lignes?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product_id.nom_long} x {item.quantite}
                  </span>
                  <span className="font-medium">
                    {(item.total_ligne || item.prix_unitaire * item.quantite)?.toLocaleString()} DH
                  </span>
                </div>
              )) || (
                <div className="text-sm text-gray-500 italic">
                  Aucun article disponible
                </div>
              )}
              
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-700">Frais de livraison</span>
                  <span className="font-medium">{deliveryFee.toLocaleString()} DH</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span className="text-gray-900">Total</span>
                <span className="font-bold" style={{color: '#1F55A3'}}>
                  {finalTotal?.toLocaleString()} DH
                </span>
              </div>
            </div>
          </div>

          {/* Informations de livraison et livreur */}
          <div>
            <h4 className="font-semibold mb-3" style={{color: '#245FA6'}}>
              Informations de livraison
            </h4>
            
            {/* Adresse de livraison */}
            {order.address_livraison_id && (
              <div className="mb-3 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin size={16} className="text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">Adresse de livraison</div>
                    <div className="text-gray-600">
                      {order.address_livraison_id.rue}<br />
                      {order.address_livraison_id.ville} {order.address_livraison_id.code_postal}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Informations du livreur */}
            {order.planification && order.planification.livreur_id ? (
              <DriverInfo 
                driver={{
                  firstName: order.planification.livreur_id.physical_user_id.first_name,
                  lastName: order.planification.livreur_id.physical_user_id.last_name,
                  matricule: order.planification.livreur_id.matricule
                }} 
                driverPhone={order.planification.livreur_id.physical_user_id.telephone_principal} 
              />
            ) : (
              <div className="text-sm text-gray-500 italic">
                Livreur non encore assigné
              </div>
            )}

            {/* Informations du camion */}
            {order.planification && order.planification.truck_id && (
              <div className="mt-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Truck size={16} className="text-gray-500" />
                  <div>
                    <div className="font-medium">Véhicule</div>
                    <div className="text-gray-600">
                      {order.planification.truck_id.marque} - {order.planification.truck_id.matricule}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>Livraison à domicile</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {(order.statut_id.nom === 'Planifiée' || order.statut_id.nom === 'En cours') && (
              <button
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-80 transition-opacity"
                style={{backgroundColor: '#4DAEBD'}}
                onClick={() => {
                  // Logique pour suivre la commande
                  console.log('Suivre la commande:', order.id);
                }}
              >
                <Eye size={16} className="inline mr-2" />
                Suivre
              </button>
            )}
            
            {order.planification && order.planification.livreur_id.physical_user_id.telephone_principal && (order.statut_id.nom === 'Planifiée' || order.statut_id.nom === 'En cours') && (
              <button
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-80 transition-opacity"
                style={{backgroundColor: '#1F55A3'}}
                onClick={() => window.open(`tel:${order.planification.livreur_id.physical_user_id.telephone_principal}`)}
              >
                <Phone size={16} className="inline mr-2" />
                Appeler
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;