import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Truck, XCircle, CheckSquare, CalendarClock } from 'lucide-react';
import axios from 'axios';

const StatisticsBar = ({ customerId }) => {
  const [stats, setStats] = useState({ 
    total: 0, 
    livree: 0,
    en_cours: 0,
    planifiee: 0,
    confirmee: 0,
    annulee: 0,
    totalPrix: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/commands/customer/${customerId}/stats`);
        if (res.data.success) {
          const rawStats = res.data.data.repartitionParStatut;
          
          // Transformer le tableau en objet avec les bonnes clés
          const statusMap = {
            livree: 0,
            en_cours: 0,
            planifiee: 0,
            confirmee: 0,
            annulee: 0,
            totalPrix: res.data.data.chiffreAffaires || 0
          };

          rawStats.forEach(item => {
            const code = item.statut.code.toLowerCase(); // ex: "livree", "en_cours"
            if (statusMap.hasOwnProperty(code)) {
              statusMap[code] = item.count;
            }
          });

          // Calculer "en cours" comme la somme des statuts actifs
          statusMap.en_cours = (statusMap.planifiee || 0) + (statusMap.confirmee || 0);

          setStats(statusMap);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des stats:', err);
      }
    };

    if (customerId) {
      fetchStats();
    }
  }, [customerId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <CheckCircle size={20} className="text-green-500" />
          <span className="text-sm text-gray-600">Livrées:</span>
          <span className="text-lg font-bold text-green-600">{stats.livree || 0}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Truck size={20} style={{color: '#4DAEBD'}} />
          <span className="text-sm text-gray-600">En cours:</span>
          <span className="text-lg font-bold" style={{color: '#4DAEBD'}}>{stats.en_cours || 0}</span>
        </div>

        <div className="flex items-center space-x-2">
          <CheckSquare size={20} className="text-blue-600" />
          <span className="text-sm text-gray-600">Confirmée:</span>
          <span className="text-lg font-bold" style={{color: '#4DAEBD'}}>{stats.confirmee || 0}</span>
        </div>

        <div className="flex items-center space-x-2">
          <CalendarClock size={20} className="text-blue-600" />
          <span className="text-sm text-perpule-600">Planifiée:</span>
          <span className="text-lg font-bold" style={{color: '#4DAEBD'}}>{stats.planifiee || 0}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <XCircle size={20} className="text-red-500" />
          <span className="text-sm text-gray-600">Annulées:</span>
          <span className="text-lg font-bold text-red-600">{stats.annulee || 0}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Package size={20} style={{color: '#1F55A3'}} />
          <span className="text-sm text-gray-600">Total prix:</span>
          <span className="text-lg font-bold" style={{color: '#1F55A3'}}>
            {stats.totalPrix ? stats.totalPrix.toLocaleString() : 0} DH
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatisticsBar;