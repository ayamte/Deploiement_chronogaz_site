import api from './api';    
    
const productService = {    
  getAllProducts: async (params = {}) => {    
    try {    
      const response = await api.get('/products', { params });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la récupération des produits:', error);    
      throw error;    
    }    
  },    
    
  getProductById: async (id) => {    
    try {    
      const response = await api.get(`/products/${id}`);    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la récupération du produit:', error);    
      throw error;    
    }    
  },    
    
  createProduct: async (productData) => {    
    try {    
      const formData = new FormData();    
          
      // Ajouter les champs texte    
      formData.append('ref', productData.ref);    
      formData.append('short_name', productData.short_name);    
      formData.append('long_name', productData.long_name);    
      formData.append('description', productData.description);    
          
      if (productData.gamme) {    
        formData.append('gamme', productData.gamme);    
      }    
          
      if (productData.brand) {    
        formData.append('brand', productData.brand);    
      }    
          
      // Ajouter l'image si présente    
      if (productData.image) {    
        formData.append('image', productData.image);    
      }    

      if (productData.unites_mesure) {
        formData.append('unites_mesure', JSON.stringify(productData.unites_mesure));
    }
    
      const response = await api.post('/products', formData, {    
        headers: {    
          'Content-Type': 'multipart/form-data',    
        },    
      });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la création du produit:', error);    
      throw error;    
    }    
  },    
    
  updateProduct: async (id, productData) => {    
    try {    
      const formData = new FormData();    
          
      formData.append('ref', productData.ref);    
      formData.append('short_name', productData.short_name);    
      formData.append('long_name', productData.long_name);    
      formData.append('description', productData.description);    
          
      if (productData.gamme) {    
        formData.append('gamme', productData.gamme);    
      }    
          
      if (productData.brand) {    
        formData.append('brand', productData.brand);    
      }    
          
      if (productData.image) {    
        formData.append('image', productData.image);    
      }    
    
      const response = await api.put(`/products/${id}`, formData, {    
        headers: {    
          'Content-Type': 'multipart/form-data',    
        },    
      });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la mise à jour du produit:', error);    
      throw error;    
    }    
  },    
    
  deleteProduct: async (id) => {    
    try {    
      const response = await api.delete(`/products/${id}`);    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la suppression du produit:', error);    
      throw error;    
    }    
  },    
    
  getProductImageUrl: (id) => {    
    return `${api.defaults.baseURL}/products/${id}/image`;    
  },    
  
  updateProductUnits: async (id, unites_mesure) => {    
    try {    
      const response = await api.put(`/products/${id}/units`, { unites_mesure });    
      return response.data;    
    } catch (error) {    
      console.error('Erreur lors de la mise à jour des unités de mesure:', error);    
      throw error;    
    }    
  }  
};    
    
export default productService;