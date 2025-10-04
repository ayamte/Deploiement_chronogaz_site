import React from "react";    
import ProgressStep from '../TrackOrderPage/ProgressStep';    
    
const generateCustomStatusSteps = (deliveryData, orderData) => {    
  const formatTime = (date) => {    
    if (!date) return "En attente";    
    try {    
      return new Date(date).toLocaleString('fr-FR', {     
        day: '2-digit',    
        month: '2-digit',     
        year: 'numeric',    
        hour: '2-digit',     
        minute: '2-digit'     
      });    
    } catch (error) {    
      return "En attente";    
    }    
  };    
    
  const steps = [    
    {    
      id: 0,    
      title: "Commande confirmée",    
      iconType: "check",    
      time: formatTime(orderData?.command?.date_commande || orderData?.command?.createdAt),    
      description: "Votre commande a été confirmée avec succès",    
      status: 'COMPLETED'    
    }    
  ];    
    
  const hasAssignment = orderData?.planification || deliveryData?.planification_id;    
  steps.push({    
    id: 1,    
    title: "Préparation terminée",    
    iconType: "package",    
    time: hasAssignment ? formatTime(orderData?.planification?.createdAt || deliveryData?.planification_id?.createdAt) : "En attente",    
    description: hasAssignment ? "Votre commande est prête et un camion a été assigné" : "Préparation de votre commande en cours",    
    status: hasAssignment ? 'COMPLETED' : 'PENDING'    
  });    
    
  // ✅ NOUVEAU: Utiliser le statut de la commande comme source de vérité
  const commandStatus = orderData?.command?.statut;
  const isDeliveryStarted = deliveryData?.etat === 'EN_COURS' || commandStatus === 'EN_COURS';    
  const isDeliveryCompleted = deliveryData?.etat === 'LIVRE' || commandStatus === 'LIVREE';    
  const isDeliveryFailed = deliveryData?.etat === 'ECHEC' || commandStatus === 'ECHOUEE';     
    
  if (isDeliveryStarted || isDeliveryCompleted || isDeliveryFailed) {    
    steps.push({    
      id: 2,    
      title: "Livraison en cours",    
      iconType: "truck",    
      time: formatTime(deliveryData?.createdAt || orderData?.command?.updatedAt),    
      description: "Le chauffeur est en route vers votre adresse",    
      status: isDeliveryStarted && !isDeliveryCompleted ? 'CURRENT' : 'COMPLETED'    
    });    
  } else if (hasAssignment) {    
    steps.push({    
      id: 2,    
      title: "Livraison en cours",    
      iconType: "truck",    
      time: "En attente",    
      description: "En attente du démarrage de la livraison",    
      status: 'PENDING'    
    });    
  }    
    
  if (isDeliveryCompleted) {    
    steps.push({    
      id: 3,    
      title: "Commande livrée",    
      iconType: "check",    
      time: formatTime(deliveryData?.updatedAt || orderData?.command?.updatedAt),    
      description: "Votre commande a été livrée avec succès",    
      status: 'COMPLETED'    
    });    
  } else if (isDeliveryFailed) {    
    steps.push({    
      id: 3,    
      title: "Commande annulée",    
      iconType: "warning",    
      time: formatTime(deliveryData?.updatedAt || orderData?.command?.updatedAt),    
      description: "Livraison annulée - Contactez le service client",    
      status: 'ECHEC'    
    });    
  }  
    
  return steps;    
};    
  
const OrderProgress = ({ orderStatus, deliveryData, orderData }) => {    
  const statusSteps = generateCustomStatusSteps(deliveryData, orderData);    
    
  return (    
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">    
      <h3 className="text-xl font-bold mb-6" style={{color: '#245FA6'}}>    
        Progression de votre commande    
      </h3>    
          
      <div className="space-y-4">    
        {statusSteps.map((step, index) => {    
          const isCompleted = step.status === 'COMPLETED';    
          const isCurrent = step.status === 'CURRENT';    
          const isLast = index === statusSteps.length - 1;    
    
          return (    
            <ProgressStep    
              key={step.id}    
              step={step}    
              isCompleted={isCompleted || isCurrent}    
              isCurrent={isCurrent}    
              isLast={isLast}    
            />    
          );    
        })}    
      </div>    
    </div>    
  );    
};    
    
export default OrderProgress;