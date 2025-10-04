import React from 'react';


const Title = ({ title }) => {
    return (
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 shadow-lg" 
           style={{background: 'linear-gradient(135deg, #1F55A3 0%, #245FA6 100%)'}}>
        <h1 className="text-3xl font-bold text-center">{title}</h1>
      </div>
    );
  };
export default Title;