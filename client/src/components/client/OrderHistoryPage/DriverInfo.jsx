const DriverInfo = ({ driver, driverPhone }) => {
    if (!driver) return null;
  
    return (
      <div>
        <h4 className="font-semibold mb-3" style={{color: '#245FA6'}}>
          Livreur assigné
        </h4>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{backgroundColor: '#4DAEBD'}}
            >
              <span className="text-l4 font-bold">
                {driver.firstName?.[0]} {driver.lastName?.[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
              <p className="text-sm text-gray-600">{driverPhone}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
export default DriverInfo;  