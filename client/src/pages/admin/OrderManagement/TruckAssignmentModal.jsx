import React, { useState } from 'react';      
import {      
  MdClose as X,      
  MdLocalShipping as TruckIcon,      
  MdSave as Save,      
  MdWarning as AlertTriangle,    
  MdFlag as Flag    
} from 'react-icons/md';      
      
const TruckAssignmentModal = ({ order, trucks, loading, onSave, onClose }) => {      
  const [assignmentData, setAssignmentData] = useState({      
    truckId: '',      
    priority: order?.priority || 'medium',    
    scheduledDate: new Date().toISOString().slice(0, 10),      
  });      
      
  const [errors, setErrors] = useState({});      
      
  const validateForm = () => {      
    const newErrors = {};      
          
    if (!assignmentData.truckId) {      
      newErrors.truckId = 'Veuillez sélectionner un camion';      
    }      
          
    if (!assignmentData.scheduledDate) {      
      newErrors.scheduledDate = 'Veuillez sélectionner une date';      
    }      
      
    // Vérifier que la date n'est pas dans le passé      
    const selectedDate = new Date(assignmentData.scheduledDate);      
    const today = new Date();      
    today.setHours(0, 0, 0, 0);      
          
    if (selectedDate < today) {      
      newErrors.scheduledDate = 'La date ne peut pas être dans le passé';      
    }      
      
    setErrors(newErrors);      
    return Object.keys(newErrors).length === 0;      
  };      
      
  const handleSave = () => {      
    if (validateForm()) {      
      onSave(assignmentData);      
    }      
  };      
      
  const handleChange = (e) => {      
    const { name, value } = e.target;      
    setAssignmentData(prev => ({ ...prev, [name]: value }));      
          
    // Effacer l'erreur pour ce champ      
    if (errors[name]) {      
      setErrors(prev => ({ ...prev, [name]: '' }));      
    }      
  };      
      
  // ✅ MODIFIÉ: Filtrer les camions disponibles selon les nouveaux critères  
  const availableTrucks = trucks.filter(truck =>     
    truck.status === 'Disponible' ||     
    truck.status === 'DISPONIBLE' ||     
    truck.status === 'disponible' ||    
    truck.status === 'En mission' // Permettre aussi les camions en mission    
  );  
    
  const getPriorityColor = (priority) => {    
    const colors = {    
      urgent: 'text-red-600',    
      high: 'text-orange-600',     
      medium: 'text-yellow-600',    
      low: 'text-green-600'    
    };    
    return colors[priority] || 'text-gray-600';    
  };    
    
  const getPriorityText = (priority) => {    
    const texts = {    
      urgent: 'Urgente',    
      high: 'Haute',    
      medium: 'Moyenne',     
      low: 'Basse'    
    };    
    return texts[priority] || priority;    
  };    
      
  return (      
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">      
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose}></div>      
            
      <div className="relative w-full max-w-lg mx-auto my-6">      
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-xl outline-none focus:outline-none">      
          {/* Header */}      
          <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t-lg">      
            <h2 className="flex items-center text-xl font-semibold text-gray-800">      
              <TruckIcon className="w-6 h-6 mr-2 text-blue-500" />      
              Planifier la Commande #{order?.orderNumber || order?.numero_commande}      
            </h2>      
            <button      
              className="p-1 ml-auto bg-transparent border-0 text-gray-500 hover:text-gray-900 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"      
              onClick={onClose}      
            >      
              <X className="w-6 h-6" />      
            </button>      
          </div>      
      
          {/* Body */}      
          <div className="relative p-6 flex-auto">      
            {loading ? (      
              <div className="flex justify-center items-center h-48">      
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>      
                <p className="ml-3 text-gray-500">Chargement des données...</p>      
              </div>      
            ) : (      
              <div className="space-y-4">      
                {/* Informations de la commande */}      
                <div className="bg-blue-50 p-3 rounded-lg">      
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Informations de la commande</h4>      
                  <p className="text-xs text-blue-600">      
                    Client: {order?.customer?.name} |       
                    Date: {order?.orderDate ? new Date(order.orderDate).toLocaleDateString('fr-FR') : 'N/A'}      
                  </p>      
                </div>      
    
                {/* Sélecteur de priorité */}    
                <div className="flex flex-col">    
                  <label htmlFor="priority" className="text-sm font-medium text-gray-700 mb-1">    
                    <Flag className="w-4 h-4 inline mr-1" />    
                    Priorité de la livraison    
                  </label>    
                  <select    
                    id="priority"    
                    name="priority"    
                    value={assignmentData.priority}    
                    onChange={handleChange}    
                    className="block w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"    
                  >    
                    <option value="low">🟢 Basse</option>    
                    <option value="medium">🟡 Moyenne</option>    
                    <option value="high">🟠 Haute</option>    
                    <option value="urgent">🔴 Urgente</option>    
                  </select>    
                  <p className="mt-1 text-xs text-gray-500">    
                    Priorité sélectionnée: <span className={getPriorityColor(assignmentData.priority)}>    
                      {getPriorityText(assignmentData.priority)}    
                    </span>    
                  </p>    
                </div>    
      
                {/* Sélecteur de camion */}      
                <div className="flex flex-col">      
                  <label htmlFor="truckId" className="text-sm font-medium text-gray-700 mb-1">      
                    Sélectionner un camion *      
                  </label>      
                  <select      
                    id="truckId"      
                    name="truckId"      
                    value={assignmentData.truckId}      
                    onChange={handleChange}      
                    className={`block w-full px-3 py-2 text-sm text-gray-900 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${      
                      errors.truckId ? 'border-red-300' : 'border-gray-300'      
                    }`}      
                  >      
                    <option value="">-- Choisir un camion --</option>      
                    {trucks.map(truck => (      
                      <option     
                        key={truck.id}     
                        value={truck.id}    
                        disabled={truck.status === 'Hors service' || truck.status === 'En maintenance'}    
                      >      
                        {truck.plateNumber} - {truck.model} ({truck.status}) - Capacité: {truck.capacity || 'N/A'}    
                        {truck.driver && ` - Chauffeur: ${truck.driver.name}`}    
                      </option>      
                    ))}      
                  </select>     
                  {errors.truckId && (      
                    <p className="mt-1 text-xs text-red-600 flex items-center">      
                      <AlertTriangle className="w-3 h-3 mr-1" />      
                      {errors.truckId}      
                    </p>      
                  )}      
                  {availableTrucks.length === 0 && (      
                    <p className="mt-1 text-xs text-amber-600">Aucun camion disponible.</p>      
                  )}      
                </div>      
      
                {/* Champ de date */}      
                <div className="flex flex-col">      
                  <label htmlFor="scheduledDate" className="text-sm font-medium text-gray-700 mb-1">      
                    Date de livraison prévue *      
                  </label>      
                  <input      
                    id="scheduledDate"      
                    name="scheduledDate"      
                    type="date"      
                    value={assignmentData.scheduledDate}      
                    onChange={handleChange}      
                    min={new Date().toISOString().slice(0, 10)}      
                    className={`block w-full px-3 py-2 text-sm text-gray-900 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${      
                      errors.scheduledDate ? 'border-red-300' : 'border-gray-300'      
                    }`}      
                  />      
                  {errors.scheduledDate && (      
                    <p className="mt-1 text-xs text-red-600 flex items-center">      
                      <AlertTriangle className="w-3 h-3 mr-1" />      
                      {errors.scheduledDate}      
                    </p>      
                  )}      
                </div>    
    
                {/* ✅ MODIFIÉ: Note d'information mise à jour */}    
                <div className="bg-gray-50 p-3 rounded-lg">    
                  <p className="text-xs text-gray-600">    
                    ℹ️ Cette action créera une planification pour la commande. Le chauffeur et l'accompagnant peuvent être assignés ultérieurement via la gestion des camions.    
                  </p>    
                </div>    
              </div>      
            )}      
          </div>      
                
          {/* Footer */}      
          <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b-lg">      
            <button      
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 mr-2"      
              onClick={onClose}      
            >      
              Annuler      
            </button>      
            <button      
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"      
              onClick={handleSave}      
              disabled={loading || availableTrucks.length === 0}      
            >      
              <Save className="w-4 h-4 mr-2" />      
              Planifier      
            </button>      
          </div>      
        </div>      
      </div>      
    </div>      
  );      
};      
      
export default TruckAssignmentModal;