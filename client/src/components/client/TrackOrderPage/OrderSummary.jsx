import React, { useEffect, useState } from "react";  
  
const OrderSummary = ({ orderData, loading = false, error = null }) => {  
  const [processedOrderData, setProcessedOrderData] = useState({  
    products: [],  
    deliveryFee: 20,  
    total: 0,  
    subtotal: 0,  
    totalTva: 0,  
    orderInfo: null  
  });  
  
  useEffect(() => {  
    if (orderData && orderData.command) {  
      // Traiter les données de la commande  
      const products = orderData.lignes?.map(ligne => ({  
        id: ligne.product_id?._id || ligne.product_id || `product-${Math.random()}`,  
        nom_court: ligne.product_id?.long_name || ligne.product_id?.short_name || 'Produit',
        reference: ligne.product_id?.ref || 'N/A',     
        quantity: ligne.quantity || 0,                   
        unit_price: ligne.price || 0,          
        total_ligne: ligne.total_ligne || (ligne.quantite * ligne.prix_unitaire),  
        um: ligne.um_id?.nom || 'Unité'  
      })) || [];  
  
      const subtotal = orderData.command.total_ht || 0;  
      const totalTva = orderData.command.total_tva || 0;  
      const deliveryFee = 20; // Frais de livraison fixes  
      const total = orderData.command.total_ttc || orderData.command.montant_total || (subtotal + deliveryFee);  
  
      setProcessedOrderData({  
        products,  
        deliveryFee,  
        subtotal,  
        totalTva,  
        total,  
        orderInfo: {  
          numero_commande: orderData.command.numero_commande,  
          date_commande: orderData.command.date_commande,  
          customer: orderData.command.customer_id?.physical_user_id?.first_name ||  
                   orderData.command.customer_id?.moral_user_id?.raison_sociale ||  
                   orderData.command.customer_id?.nom_commercial ||   
                   orderData.command.customer_id?.customer_code || 'Client',  
          statut: orderData.command.statut_id?.nom || 'En cours',  
          address: orderData.command.address_id || orderData.command.address_livraison_id,  
          planification: orderData.planification  
        }  
      });  
    } else {  
      // Fallback vers localStorage si pas de données  
      const savedOrder = localStorage.getItem("lastOrder");  
      if (savedOrder) {  
        try {  
          const parsedOrder = JSON.parse(savedOrder);  
          const detailedProducts = parsedOrder.products  
            ?.map((product) => {  
              const quantity = parsedOrder.quantities?.[product.id] || 0;  
              const unit_price = parsedOrder.prices?.[product.id] || 0;  
              return {  
                ...product,  
                id: product.id || `product-${Math.random()}`,  
                quantity,  
                unit_price,  
                nom_court: product.short_name || product.name || 'Produit',  
                reference: product.ref || 'N/A',  
                um: 'Unité'  
              };  
            })  
            .filter(p => p.quantity > 0) || [];  
  
          const subtotal = detailedProducts.reduce(  
            (sum, item) => sum + (item.unit_price * item.quantity),  
            0  
          );  
          const total = subtotal + (parsedOrder.deliveryFee || 20);  
  
          setProcessedOrderData({  
            products: detailedProducts,  
            deliveryFee: parsedOrder.deliveryFee || 20,  
            subtotal,  
            total,  
            totalTva: 0,  
            orderInfo: null  
          });  
        } catch (parseError) {  
          console.error('Erreur parsing localStorage:', parseError);  
          setProcessedOrderData({  
            products: [],  
            deliveryFee: 20,  
            total: 0,  
            subtotal: 0,  
            totalTva: 0,  
            orderInfo: null  
          });  
        }  
      }  
    }  
  }, [orderData]);  
  
  // Composant de chargement  
  if (loading) {  
    return (  
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">  
        <div className="animate-pulse">  
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>  
          <div className="space-y-3">  
            {[1, 2, 3].map(i => (  
              <div key={i} className="flex justify-between items-center py-2">  
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>  
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>  
              </div>  
            ))}  
          </div>  
        </div>  
      </div>  
    );  
  }  
  
  // Composant d'erreur  
  if (error && !processedOrderData.orderInfo && processedOrderData.products.length === 0) {  
    return (  
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">  
        <div className="text-center py-8">  
          <div className="text-red-500 mb-2">  
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">  
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />  
            </svg>  
          </div>  
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>  
          <p className="text-gray-600">{error}</p>  
        </div>  
      </div>  
    );  
  }  
  
  return (  
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">  
      {/* En-tête avec informations de commande */}  
      {processedOrderData.orderInfo && (  
        <div className="mb-6 pb-4 border-b border-gray-200">  
          <div className="flex justify-between items-start mb-2">  
            <h3 className="text-xl font-bold" style={{ color: "#245FA6" }}>  
              Commande   
            </h3> 
          </div>  
          <div className="text-sm text-gray-600 space-y-1">  
            <p><strong>Client:</strong> {processedOrderData.orderInfo.customer}</p>  
            <p><strong>Date:</strong> {processedOrderData.orderInfo.date_commande ?   
              new Date(processedOrderData.orderInfo.date_commande).toLocaleDateString('fr-FR') : 'N/A'}</p>  
            {processedOrderData.orderInfo.address && (  
              <p><strong>Adresse:</strong> {  
                processedOrderData.orderInfo.address.street || processedOrderData.orderInfo.address.rue || 'Adresse'  
              }, {  
                processedOrderData.orderInfo.address.city_id?.name || processedOrderData.orderInfo.address.ville || 'Ville'  
              }</p>  
            )}  
            {processedOrderData.orderInfo.planification?.date_planifiee && (  
              <p><strong>Livraison prévue:</strong> {new Date(processedOrderData.orderInfo.planification.date_planifiee).toLocaleDateString('fr-FR')}</p>  
            )}  
          </div>  
        </div>  
      )}  
  
      {/* Titre pour les détails */}  
      <h3 className="text-xl font-bold mb-4" style={{ color: "#245FA6" }}>  
        Détails de la commande  
      </h3>  
  
      {/* Liste des produits */}  
      <div className="space-y-3">  
        {processedOrderData.products.length > 0 ? (  
          processedOrderData.products.map((item) => (  
            <div  
              key={item.id}  
              className="flex justify-between items-center py-3 border-b border-gray-100"  
            >  
              <div className="flex-1">  
                <div className="font-medium text-gray-900">{item.nom_court}</div>  
                <div className="text-sm text-gray-600">  
                  Produit: {item.product_id?.long_name || item.nom_court} | Quantité: {item.quantity} 
                </div>
              </div>  
              <div className="text-right ml-4">  
                <div className="font-bold text-gray-900">  
                  {(item.total_ligne || (item.quantity * item.unit_price)).toFixed(2)} DH  
                </div>  
                <div className="text-sm text-gray-600">  
                  {item.unit_price.toFixed(2)} DH/{item.um}  
                </div>  
              </div>  
            </div>  
          ))  
        ) : (  
          <div className="text-center py-8 text-gray-500">  
            Aucun produit dans cette commande  
          </div>  
        )}  
  
        {/* Sous-total */}  
        {processedOrderData.subtotal > 0 && (  
          <div className="flex justify-between items-center py-2 border-b">  
            <span className="font-medium">Sous-total (HT)</span>  
            <span className="font-bold">{processedOrderData.subtotal.toFixed(2)} DH</span>  
          </div>  
        )}  
  
        {processedOrderData.totalTva > 0 && (  
          <div className="flex justify-between items-center py-2 border-b">  
            <span className="font-medium">TVA</span>  
            <span className="font-bold">{processedOrderData.totalTva.toFixed(2)} DH</span>  
          </div>  
        )}  
  
        {/* Frais de livraison */}  
        <div className="flex justify-between items-center py-2 border-b">  
          <span className="font-medium">Frais de livraison</span>  
          <span className="font-bold">{processedOrderData.deliveryFee.toFixed(2)} DH</span>  
        </div>  
  
        {/* Total */}  
        <div  
          className="flex justify-between items-center py-3 text-xl font-bold"  
          style={{ color: "#1F55A3" }}  
        >  
          <span>Total TTC</span>  
          <span>{processedOrderData.total.toFixed(2)} DH</span>  
        </div>  
  
        {/* Message d'erreur en bas si données de fallback */}  
        {error && processedOrderData.products.length > 0 && (  
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">  
            <p className="text-sm text-yellow-800">  
              <strong>Note:</strong> Certaines données n'ont pu être chargées. Affichage des données disponibles.  
            </p>  
          </div>  
        )}  
      </div>  
    </div>  
  );  
};  
  
export default OrderSummary;