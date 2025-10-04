import { CheckCircle } from 'lucide-react';


const DriverInfo = ({ driver, driverPhone, orderId }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Livraison terminée
          </h2>
          <p className="text-gray-600 mb-6">
            Merci de votre confiance
          </p>
          
          <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white"
              style={{backgroundColor: '#4DAEBD'}}
            >
              <span className="text-lg font-bold">
                {driver.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-gray-800">{driver}</p>
              <p className="text-lg font-bold text-gray-800">{driverPhone}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
export default DriverInfo;  