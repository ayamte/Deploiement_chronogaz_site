import { useState, useCallback } from 'react';
import { orderService } from '../services/orderService';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // ✅ SOLUTION PRINCIPALE : Fonction stable sans dépendances sur pagination
  const fetchOrders = useCallback(async (filters = {}, page = null, limit = null) => {
    // Utiliser les paramètres explicites ou les valeurs courantes de state
    const currentPage = page ?? pagination.page;
    const currentLimit = limit ?? pagination.limit;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching orders with:', { ...filters, page: currentPage, limit: currentLimit });
      
      const response = await orderService.getOrders({
        page: currentPage,
        limit: currentLimit,
        ...filters
      });
      
      setOrders(response.data);
      setPagination(prev => ({
        ...prev,
        page: currentPage,
        limit: currentLimit,
        total: response.total,
        totalPages: response.totalPages
      }));
      
      console.log('✅ Orders fetched successfully:', response.data.length, 'items');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du chargement des commandes';
      setError(errorMessage);
      console.error('❌ Erreur fetchOrders:', err);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Pas de dépendances - fonction complètement stable

  const updateOrder = useCallback(async (orderId, updateData) => {
    setLoading(true);
    try {
      console.log('🔄 Updating order:', orderId, updateData);
      
      const updatedOrder = await orderService.updateOrder(orderId, updateData);
      
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, ...updatedOrder } : order
      ));
      
      console.log('✅ Order updated successfully');
      return updatedOrder;
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error('❌ Erreur updateOrder:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTruck = useCallback(async (orderId, assignmentData, trucks, drivers) => {
    try {
      console.log('🚛 Assigning truck:', { orderId, assignmentData });
      
      const updatedOrder = await orderService.assignTruck(orderId, assignmentData);
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const assignedTruck = trucks.find(t => t.id === assignmentData.truck_id);
          const assignedDriver = drivers.find(d => d.id === assignmentData.livreur_id);
          
          return {
            ...order,
            status: 'assigned',
            assignedTruckId: assignmentData.truckId,
            assignedTruck: {
              id: assignedTruck?.id,
              plateNumber: assignedTruck?.plateNumber,
              model: assignedTruck?.model,
              driverName: assignedDriver?.name
            },
            priority: assignmentData.priority || order.priority,
            internalNotes: assignmentData.notes,
            assignedDriverId: assignmentData.driverId,
            assignedAccompagnateurId: assignmentData.accompagnateurId,
            scheduledDate: assignmentData.scheduledDate
          };
        }
        return order;
      }));
      
      console.log('✅ Truck assigned successfully');
      return updatedOrder;
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error('❌ Erreur assignTruck:', err);
      throw err;
    }
  }, []);

  const cancelAssignment = useCallback(async (orderId) => {
    try {
      console.log('❌ Canceling assignment for order:', orderId);
      
      await orderService.cancelAssignment(orderId);
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'pending',
            assignedTruckId: null,
            assignedTruck: null
          };
        }
        return order;
      }));
      
      console.log('✅ Assignment canceled successfully');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error('❌ Erreur cancelAssignment:', err);
      throw err;
    }
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    updateOrder,
    assignTruck,
    cancelAssignment,
    setPagination
  };
};