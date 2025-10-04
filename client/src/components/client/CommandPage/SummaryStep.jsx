import React from 'react';  
import { ArrowLeft, Check, MapPin, Package, CreditCard } from 'lucide-react';  
  
const SummaryStep = ({ orderData, onBack, onConfirm }) => {  
  const {  
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
  } = orderData;  
  
  // Filtrer les produits avec quantité > 0  
  const orderedProducts = products.filter(product => quantities[product._id] > 0);  
  
  return (  
    <div className="bg-white rounded-lg shadow-md p-8">  
      <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">  
        Résumé de votre commande  
      </h2>  
  
      <div className="space-y-8">  
        {/* Produits commandés */}  
        <div className="border border-gray-200 rounded-lg p-6">  
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">  
            <Package className="mr-2 text-blue-600" size={20} />  
            Produits commandés  
          </h3>  
              
          <div className="space-y-4">  
            {orderedProducts.map(product => (  
              <div key={product._id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">  
                <div className="flex items-center space-x-4">  
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">  
                    {product.image ? (  
                      <img  
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products/${product._id}/image`}  
                        alt={product.short_name}  
                        className="w-full h-full object-cover rounded-lg"  
                      />  
                    ) : (  
                      <Package className="text-white" size={24} />  
                    )}  
                  </div>  
                  <div>  
                    <h4 className="font-medium text-gray-900">  
                      {product.brand} {product.short_name}  
                    </h4>  
                    <p className="text-sm text-gray-600">{product.gamme}</p>  
                    <p className="text-sm font-medium text-blue-600">  
                      {prices[product._id]} MAD/unité  
                    </p>  
                  </div>  
                </div>  
                <div className="text-right">  
                  <p className="font-medium text-gray-900">  
                    Quantité: {quantities[product._id]}  
                  </p>  
                  <p className="text-lg font-bold text-blue-600">  
                    {(quantities[product._id] * prices[product._id]).toFixed(2)} MAD  
                  </p>  
                </div>  
              </div>  
            ))}  
          </div>  
        </div>  
  
        {/* ✅ Adresse de livraison corrigée */}  
        <div className="border border-gray-200 rounded-lg p-6">  
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">  
            <MapPin className="mr-2 text-blue-600" size={20} />  
            Adresse de livraison  
          </h3>  
              
          {useGPS && gpsLocation ? (  
            <div className="bg-blue-50 p-4 rounded-lg">  
              <p className="font-medium text-blue-900">Géolocalisation activée</p>  
              <p className="text-sm text-blue-700">    
                Position détectée automatiquement  
              </p>
            </div>  
          ) : selectedExistingAddress ? (  
            // ✅ Affichage de l'adresse existante sélectionnée  
            <div className="space-y-2">  
              <p className="font-medium text-gray-900">  
                {selectedExistingAddress.type_adresse || 'Adresse sauvegardée'}  
              </p>  
              <p className="text-gray-600">  
                {selectedExistingAddress.numimmeuble && `Imm. ${selectedExistingAddress.numimmeuble}, `}  
                {selectedExistingAddress.numappt && `Apt. ${selectedExistingAddress.numappt}, `}  
                {selectedExistingAddress.street}  
              </p>  
              {selectedExistingAddress.quartier && (  
                <p className="text-gray-600">{selectedExistingAddress.quartier}</p>  
              )}  
              <p className="text-gray-600">  
                {selectedExistingAddress.postal_code && `${selectedExistingAddress.postal_code}, `}  
                {selectedExistingAddress.city_id?.nom || selectedExistingAddress.city?.nom || 'Casablanca'}  
              </p>  
              <p className="text-gray-600">Tél: {selectedExistingAddress.telephone}</p>  
              {selectedExistingAddress.instructions_livraison && (  
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">  
                  <p className="text-sm font-medium text-yellow-800">Instructions:</p>  
                  <p className="text-sm text-yellow-700">{selectedExistingAddress.instructions_livraison}</p>  
                </div>  
              )}  
            </div>  
          ) : (  
            // ✅ Affichage de la nouvelle adresse (suppression des références aux régions)  
            <div className="space-y-2">  
              <p className="font-medium text-gray-900">  
                {address.numimmeuble && `Imm. ${address.numimmeuble}, `}  
                {address.numappt && `Apt. ${address.numappt}, `}  
                {address.street}  
              </p>  
              {address.quartier && (  
                <p className="text-gray-600">{address.quartier}</p>  
              )}  
              <p className="text-gray-600">  
                {address.postal_code && `${address.postal_code}, `}  
                Casablanca {/* ✅ Ville par défaut */}  
              </p>  
              <p className="text-gray-600">Tél: {address.telephone}</p>  
              {address.instructions_livraison && (  
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">  
                  <p className="text-sm font-medium text-yellow-800">Instructions:</p>  
                  <p className="text-sm text-yellow-700">{address.instructions_livraison}</p>  
                </div>  
              )}  
            </div>  
          )}  
        </div>  
  
        {/* Récapitulatif des prix */}  
        <div className="border border-gray-200 rounded-lg p-6">  
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">  
            <CreditCard className="mr-2 text-blue-600" size={20} />  
            Récapitulatif des prix  
          </h3>  
              
          <div className="space-y-3">  
            <div className="flex justify-between text-gray-600">  
              <span>Sous-total produits:</span>  
              <span>{subtotal.toFixed(2)} MAD</span>  
            </div>  
            <div className="flex justify-between text-gray-600">  
              <span>Frais de livraison:</span>  
              <span>{deliveryFee.toFixed(2)} MAD</span>  
            </div>  
            <div className="border-t border-gray-200 pt-3">  
              <div className="flex justify-between text-xl font-bold text-blue-900">  
                <span>Total:</span>  
                <span>{total.toFixed(2)} MAD</span>  
              </div>  
            </div>  
          </div>  
        </div>  
  
        {/* Mode de paiement */}  
        <div className="border border-gray-200 rounded-lg p-6">  
          <h3 className="text-lg font-semibold text-gray-900 mb-4">  
            Mode de paiement  
          </h3>  
          <div className="bg-green-50 p-4 rounded-lg">  
            <p className="font-medium text-green-800">Paiement à la livraison</p>  
            <p className="text-sm text-green-700">  
              Vous paierez en espèces lors de la réception de votre commande  
            </p>  
          </div>  
        </div>  
      </div>  
  
      {/* Navigation buttons */}  
      <div className="flex justify-between mt-8">  
        <button  
          onClick={onBack}  
          className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"  
        >  
          <ArrowLeft className="mr-2" size={20} />  
          Modifier l'adresse  
        </button>  
            
        <button  
          onClick={onConfirm}  
          className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"  
        >  
          <Check className="mr-2" size={20} />  
          Confirmer la commande  
        </button>  
      </div>  
    </div>  
  );  
};  
  
export default SummaryStep;