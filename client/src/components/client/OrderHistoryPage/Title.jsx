import React, { useEffect, useState } from 'react';

const Title = ({ customerId }) => {
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalCommandes = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/commands/customer/${customerId}/stats`);
        const result = await response.json();

        if (result.success) {
          setTotal(result.data.totalCommandes);
        } else {
          setError('Échec de récupération des commandes');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    if (customerId) {
      fetchTotalCommandes();
    }
  }, [customerId]);

  return (
    <div
      className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #1F55A3 0%, #245FA6 100%)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes Commandes</h1>
        <div className="text-right">
          {error ? (
            <p className="text-red-300">Erreur : {error}</p>
          ) : total === null ? (
            <p className="text-sm">Chargement...</p>
          ) : (
            <>
              <p className="text-lg font-medium">{total} commandes</p>
              <p className="text-sm opacity-90">au total</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Title;
