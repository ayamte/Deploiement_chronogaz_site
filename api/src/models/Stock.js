const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis']
  },
  depot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: [true, 'Le dépôt est requis']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0, 'La quantité ne peut pas être négative'],
    default: 0
  },
  minStock: {
    type: Number,
    default: 10,
    min: [0, 'Le stock minimum ne peut pas être négatif']
  },
  maxStock: {
    type: Number,
    default: 1000,
    min: [0, 'Le stock maximum ne peut pas être négatif']
  },
  lastRestockDate: {
    type: Date
  },
  location: {
    zone: String,
    rack: String,
    shelf: String
  }
}, {
  timestamps: true
});

// Index composé pour assurer l'unicité produit/dépôt
stockSchema.index({ product: 1, depot: 1 }, { unique: true });

// Méthode pour vérifier si le stock est bas
stockSchema.methods.isLowStock = function() {
  return this.quantity <= this.minStock;
};

// Méthode pour mettre à jour la quantité
stockSchema.methods.updateQuantity = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.quantity += quantity;
  } else if (operation === 'subtract') {
    if (this.quantity >= quantity) {
      this.quantity -= quantity;
    } else {
      throw new Error('Stock insuffisant');
    }
  } else if (operation === 'set') {
    this.quantity = quantity;
  }
  return this.save();
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
