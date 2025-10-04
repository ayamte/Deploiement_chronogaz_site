import React from 'react';  
import { X, Info } from 'lucide-react';  
  
const ProductDetailModal = ({ product, prices, isOpen, onClose, apiBaseUrl }) => {  
  if (!isOpen || !product) return null;  
  
  return (  
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">  
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">  
        {/* Header */}  
        <div className="flex justify-between items-center p-6 border-b border-gray-200">  
          <h2 className="text-2xl font-bold text-blue-900">Détails du produit</h2>  
          <button  
            onClick={onClose}  
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"  
            aria-label="Fermer"  
          >  
            <X size={24} className="text-gray-600" />  
          </button>  
        </div>  
  
        {/* Content */}  
        <div className="p-6">  
          {/* Image et informations principales */}  
          <div className="flex flex-col md:flex-row gap-6 mb-6">  
            <div className="flex-shrink-0">  
              <div className="w-48 h-48 rounded-xl shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-tr from-blue-400 to-cyan-400 mx-auto">  
                {product.image ? (  
                  <img  
                    src={`${apiBaseUrl}/api/products/${product._id}/image`}  
                    alt={product.short_name}  
                    className="max-h-full max-w-full object-cover"  
                  />  
                ) : (  
                  <div className="text-white text-center">  
                    <Info size={48} />  
                    <p className="mt-2">Pas d'image</p>  
                  </div>  
                )}  
              </div>  
            </div>  
              
            <div className="flex-1 space-y-4">  
              <div>  
                <h3 className="text-3xl font-bold text-blue-900 mb-2">  
                  {product.long_name || product.short_name}  
                </h3>  
                <p className="text-xl text-blue-700 font-semibold">  
                  {prices[product._id] ? `${prices[product._id]} MAD` : 'Prix non disponible'}  
                </p>  
              </div>  
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">  
                <div className="bg-gray-50 p-3 rounded-lg">  
                  <span className="text-sm font-medium text-gray-600">Référence</span>  
                  <p className="text-lg font-semibold text-gray-900">{product.ref}</p>  
                </div>  
                  
                <div className="bg-gray-50 p-3 rounded-lg">  
                  <span className="text-sm font-medium text-gray-600">Marque</span>  
                  <p className="text-lg font-semibold text-gray-900">{product.brand || 'Non spécifié'}</p>  
                </div>  
                  
                <div className="bg-gray-50 p-3 rounded-lg">  
                  <span className="text-sm font-medium text-gray-600">Gamme</span>  
                  <p className="text-lg font-semibold text-gray-900">{product.gamme || 'Non spécifié'}</p>  
                </div>  
                  
                <div className="bg-gray-50 p-3 rounded-lg">  
                  <span className="text-sm font-medium text-gray-600">Disponibilité</span>  
                  <p className={`font-semibold ${product.actif ? 'text-green-600' : 'text-red-600'}`}>  
                    {product.actif ? 'Disponible' : 'Non disponible'}  
                  </p>  
                </div>  
              </div>  
            </div>  
          </div>  
  
          {/* Description */}  
          {product.description && (  
            <div className="bg-gray-50 p-4 rounded-lg mb-4">  
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>  
              <p className="text-gray-700 leading-relaxed">{product.description}</p>  
            </div>  
          )}  
  
          {/* Unités de mesure */}  
          {product.unites_mesure && product.unites_mesure.length > 0 && (  
            <div className="bg-blue-50 p-4 rounded-lg">  
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Unités de mesure disponibles</h4>  
              <div className="flex flex-wrap gap-2">  
                {product.unites_mesure.map((unite, index) => (  
                  <span   
                    key={index}  
                    className={`px-3 py-1 rounded-full text-sm font-medium ${  
                      unite.is_principal   
                        ? 'bg-blue-600 text-white'   
                        : 'bg-blue-200 text-blue-800'  
                    }`}  
                  >  
                    {unite.UM_id?.unitemesure || 'Unité inconnue'}  
                    {unite.is_principal && ' (Principal)'}  
                  </span>  
                ))}  
              </div>  
            </div>  
          )}  
        </div>  
  
        {/* Footer */}  
        <div className="flex justify-end p-6 border-t border-gray-200">  
          <button  
            onClick={onClose}  
            className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"  
          >  
            Fermer  
          </button>  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default ProductDetailModal;