import { useState, useEffect, useCallback } from 'react';
import truckService from '../services/truckService';

export const useTrucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrucks = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await truckService.getTrucks(filters);
      setTrucks(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  return { trucks, loading, error, fetchTrucks };
};
