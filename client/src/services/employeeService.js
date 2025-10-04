import { authService } from './authService';  
  
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';  
  
export const employeeService = {  
  getAll: async () => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/employees`, {  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        }  
      });  
      return response.json();  
    } catch (error) {  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  },  
  
  create: async (employeeData) => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/employees`, {  
        method: 'POST',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(employeeData)  
      });  
      return response.json();  
    } catch (error) {  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  },  
  
  update: async (id, employeeData) => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {  
        method: 'PUT',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify(employeeData)  
      });  
      return response.json();  
    } catch (error) {  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  },  
  
  delete: async (id) => {  
    try {  
      const token = authService.getToken();  
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {  
        method: 'DELETE',  
        headers: {  
          'Authorization': `Bearer ${token}`,  
          'Content-Type': 'application/json'  
        }  
      });  
      return response.json();  
    } catch (error) {  
      return { success: false, message: 'Erreur de connexion' };  
    }  
  }  
};