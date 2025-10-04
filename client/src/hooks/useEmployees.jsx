import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useEmployees = () => {
  const [drivers, setDrivers] = useState([]);
  const [accompagnateurs, setAccompagnateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployeesByFunction = useCallback(async (fonction) => {
    try {
      const response = await axios.get(`${API_URL}/employees/${fonction}`);
      const data = response.data.data;
      console.log(`Data for ${fonction}:`, data);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`Erreur lors de la récupération des employés de fonction ${fonction}:`, err);
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const driversResult = await fetchEmployeesByFunction('CHAUFFEUR');
        const accompagnateursResult = await fetchEmployeesByFunction('ACCOMPAGNANT');

        console.log('Final results:', { driversResult, accompagnateursResult });

        setDrivers(driversResult);
        setAccompagnateurs(accompagnateursResult);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchEmployeesByFunction]);

  return { drivers, accompagnateurs, loading, error };
};