import React from "react";  
  
const OrderStatusCard = ({ orderNumber, statusDescription, estimatedTime }) => {  
  return (  
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">  
      <div className="text-center">  
        <h2 className="text-2xl font-bold mb-2" style={{color: '#1F55A3'}}>  
          Commande #{orderNumber || 'N/A'}  
        </h2>  
        <p className="text-lg text-gray-600 mb-4">  
          {statusDescription || 'Suivi de votre commande'}  
        </p>  
      </div>  
    </div>  
  );  
};  
  
export default OrderStatusCard;
