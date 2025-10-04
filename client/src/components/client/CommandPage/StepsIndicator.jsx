import React from 'react';  
import { Check } from 'lucide-react';  
  
const StepsIndicator = ({ currentStep }) => {  
  const steps = [  
    { number: 1, title: 'Produits', description: 'Choisissez vos produits' },  
    { number: 2, title: 'Adresse', description: 'Adresse de livraison' },  
    { number: 3, title: 'Résumé', description: 'Confirmez votre commande' }  
  ];  
  
  return (  
    <div className="max-w-4xl mx-auto p-6">  
      <div className="flex items-center justify-between">  
        {steps.map((step, index) => (  
          <React.Fragment key={step.number}>  
            <div className="flex flex-col items-center">  
              <div  
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${  
                  currentStep > step.number  
                    ? 'bg-green-600 text-white'  
                    : currentStep === step.number  
                    ? 'bg-blue-600 text-white'  
                    : 'bg-gray-300 text-gray-600'  
                }`}  
              >  
                {currentStep > step.number ? (  
                  <Check size={20} />  
                ) : (  
                  step.number  
                )}  
              </div>  
              <div className="mt-2 text-center">  
                <div  
                  className={`font-medium ${  
                    currentStep >= step.number ? 'text-blue-900' : 'text-gray-500'  
                  }`}  
                >  
                  {step.title}  
                </div>  
                <div className="text-sm text-gray-500">{step.description}</div>  
              </div>  
            </div>  
            {index < steps.length - 1 && (  
              <div  
                className={`flex-1 h-1 mx-4 transition-colors ${  
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'  
                }`}  
              />  
            )}  
          </React.Fragment>  
        ))}  
      </div>  
    </div>  
  );  
};  
  
export default StepsIndicator;