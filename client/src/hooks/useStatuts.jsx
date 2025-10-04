import { useState, useEffect } from 'react';
import api from '../services/api'; // ← Utilisez votre API configurée

export const useStatuts = () => {
  const [statuts, setStatuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatuts = async () => {
      try {
        console.log('🔄 Début fetchStatuts...');
        setLoading(true);
        setError(null);
        
        // Utilisez votre instance api configurée
        const response = await api.get('/statuts');
        
        console.log('📊 Réponse statuts:', response.data);
        
        if (response.data.success && response.data.data) {
          setStatuts(response.data.data);
          console.log('✅ Statuts chargés:', response.data.data.length, 'éléments');
        } else {
          throw new Error('Format de réponse inattendu');
        }
        
      } catch (error) {
        console.error('❌ Erreur fetchStatuts:', error);
        setError(error.message || 'Erreur lors du chargement des statuts');
        setStatuts([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchStatuts();
  }, []);

  const getStatutByCode = (code) => {
    const statut = statuts.find(s => s.code === code);
    console.log(`🔍 Recherche statut "${code}":`, statut ? '✅ Trouvé' : '❌ Non trouvé');
    return statut || null;
  };

  return { 
    statuts, 
    loading, 
    error,
    getStatutByCode 
  };
};