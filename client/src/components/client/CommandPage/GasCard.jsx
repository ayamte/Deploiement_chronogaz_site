// components/GasCard.jsx
import React from 'react';
import { ShoppingCart, Plus, Minus, Info } from 'lucide-react';

const GasCard = ({ 
  title, 
  weight, 
  price, 
  quantity, 
  onQuantityChange, 
  gamme, 
  imageUrl, 
  productId, 
  actif,
  product,
  onShowDetails 
}) => {
  return (
    <div className="border border-gray-300 rounded-xl p-6 bg-white hover:shadow-xl transition-shadow duration-300 ease-in-out max-w-sm mx-auto relative">
      {/* Bouton d'information */}
      <button
        onClick={() => onShowDetails(product)}
        className="absolute top-4 right-4 p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200 group"
        aria-label="Voir les détails du produit"
        title="Cliquez pour voir les détails"
      >
        <Info size={18} className="text-blue-600 group-hover:text-blue-700" />
      </button>

      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full shadow-lg mb-5 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-blue-400 to-cyan-400">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-full max-w-full object-cover rounded-full"
          />
        </div>
        
        <h3 className="text-2xl font-extrabold text-blue-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-1 uppercase tracking-wide font-semibold">{weight}</p>
        <p className="text-gray-500 mb-1 tracking-wide font-semibold">{gamme}</p>
        <p className="text-3xl font-extrabold text-blue-700 mb-6">{price} DH</p>
        <p className={`text-gray-500 mb-1 tracking-wide font-semibold ${actif ? 'text-green-600' : 'text-red-600'}`}>
          {actif ? "Disponible" : "Pas disponible"}
        </p>
        
        <div className="flex items-center space-x-5">
          <button
            onClick={() => onQuantityChange(productId, 'decrement')}
            disabled={quantity === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-opacity duration-200
              ${quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}`}
            aria-label="Décrémenter quantité"
          >
            <Minus size={24} />
          </button>
          
          <span className="text-3xl font-bold w-12 text-center2 select-none">{quantity}</span>
          
          <button
            onClick={() => onQuantityChange(productId, 'increment')}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-200"
            aria-label="Incrémenter quantité"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GasCard;