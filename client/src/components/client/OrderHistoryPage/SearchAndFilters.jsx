import React from 'react';
import { Search } from 'lucide-react';


const SearchAndFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
    const filterButtons = [
      { value: 'toutes', label: 'Toutes', color: '#6B7280' },
      { value: 'Livrée', label: 'Livrées', color: '#10B981' },
    //  { value: 'en_route', label: 'En route', color: '#4DAEBD' },
      { value: 'En cours', label: 'En cours', color: '#F59E0B' },
      { value: 'Annulée', label: 'Annulées', color: '#EF4444' },
      { value: 'Confirmée', label: 'Confirmées', color: '#DBEAFE' },
      { value: 'Planifiée', label: 'Planifiées', color: '#D1FAFA' },
      { value: 'Nouvelle', label: 'Nouvelles', color: '#F3E8FF' }

    ];
  
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro de commande ou produit..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
  
          {/* Boutons de filtre */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((button) => (
              <button
                key={button.value}
                onClick={() => setFilterStatus(button.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === button.value
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: filterStatus === button.value ? button.color : undefined
                }}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
export default SearchAndFilters;