const Customer = require('../models/Customer');  
  
const generateCustomerCode = async (type_client) => {  
  const prefix = type_client === 'PHYSIQUE' ? 'CLI-P' : 'CLI-M';  
    
  // Trouver le dernier numéro utilisé  
  const lastCustomer = await Customer.findOne({  
    customer_code: { $regex: `^${prefix}` }  
  }).sort({ customer_code: -1 });  
    
  let nextNumber = 1;  
  if (lastCustomer) {  
    const lastNumber = parseInt(lastCustomer.customer_code.substring(5));  
    nextNumber = lastNumber + 1;  
  }  
    
  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;  
};  
  
module.exports = { generateCustomerCode };