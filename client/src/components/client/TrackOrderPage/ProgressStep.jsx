import React from "react";    
    
const ProgressStep = ({ step, isCompleted, isCurrent, isLast }) => {    
  const getIcon = (iconType) => {    
    const iconProps = { size: 24 };    
    switch(iconType) {    
      case 'check':    
        return <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;    
      case 'package':    
        return <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 3h4v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V5h4l3-3zm0 3L9.5 7.5h5L12 5zm-4 8.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5S10.3 12 9.5 12s-1.5.7-1.5 1.5zm7 0c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5-.7-1.5-1.5-1.5-1.5.7-1.5 1.5z"/></svg>;    
      case 'truck':    
        return <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>;    
      case 'warning':    
        return <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;    
      // ✅ SUPPRIMÉ: case 'partial'   
      case 'clock':    
        return <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/></svg>;    
      default:    
        return <div></div>;    
    }    
  };    
    
  // ✅ CORRIGÉ: Suppression de la gestion de 'PARTIELLE'  
  const getStepColors = () => {    
    if (step.status === 'ECHEC') {    
      return {    
        bg: '#DC2626', // Rouge pour échec    
        text: 'text-red-900',    
        time: 'text-red-600'    
      };    
    }  
    if (isCompleted) {    
      return {    
        bg: isCurrent ? '#4DAEBD' : '#1F55A3', // Dégradé bleu pour complété    
        text: 'text-gray-900',    
        time: 'text-gray-600'    
      };    
    }    
    return {    
      bg: '#e5e7eb', // Gris pour en attente    
      text: 'text-gray-400',    
      time: 'text-gray-400'    
    };    
  };    
    
  const colors = getStepColors();    
    
  return (    
    <div className="flex items-start">    
      {/* Icône de l'étape */}    
      <div className="flex flex-col items-center mr-4">    
        <div     
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"    
          style={{ backgroundColor: colors.bg }}    
        >    
          {getIcon(step.iconType)}    
        </div>    
        {!isLast && (    
          <div     
            className="w-0.5 h-12 mt-2"    
            style={{ backgroundColor: isCompleted ? colors.bg : '#e5e7eb' }}    
          />    
        )}    
      </div>    
    
      {/* Contenu de l'étape */}    
      <div className="flex-1 pb-8">    
        <div className="flex justify-between items-start">    
          <div>    
            <h4 className={`font-semibold text-lg ${colors.text}`}>    
              {step.title}    
            </h4>    
            <p className={`text-sm mt-1 ${colors.text}`}>    
              {step.description}    
            </p>    
            {step.failureReason && (    
              <p className="text-sm mt-2 text-red-600 bg-red-50 p-2 rounded">    
                Raison: {step.failureReason}    
              </p>    
            )}    
          </div>    
          <span className={`text-sm font-medium ${colors.time}`}>    
            {step.time}    
          </span>    
        </div>    
      </div>    
    </div>    
  );    
};    
    
export default ProgressStep;