import { useState } from "react";

export const useNotification = () => {
    const [notification, setNotification] = useState(null);
  
    const showNotification = (message, type = 'info', duration = 5000) => {
      setNotification({ message, type });
      
      if (duration > 0) {
        setTimeout(() => {
          setNotification(null);
        }, duration);
      }
    };
  
    const hideNotification = () => {
      setNotification(null);
    };
  
    return {
      notification,
      showNotification,
      hideNotification
    };
  };