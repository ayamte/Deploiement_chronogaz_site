const mongoose = require('mongoose');

const ProductLoadedSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  product_code: {
    type: String
  },
  unit: {
    type: String,
    required: true
  },
  quantity_loaded: {
    type: Number,
    required: true,
    min: 0
  },
  total_weight: {
    type: Number,
    default: 0
  },
  total_volume: {
    type: Number,
    default: 0
  },
  batch_number: {
    type: String
  },
  expiry_date: {
    type: Date
  },
  notes: {
    type: String
  }
});

const TruckLoadingSessionSchema = new mongoose.Schema({
  truck_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    required: true
  },
  depot_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true
  },
  chauffeur_id: {
    type: String,
    required: true
  },
  loading_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'unloaded'],
    default: 'in-progress'
  },
  products: [ProductLoadedSchema],
  total_weight: {
    type: Number,
    default: 0
  },
  total_volume: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  stock_depot_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockDepot'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  unloaded_at: {
    type: Date
  }
});

// Index pour optimiser les recherches
TruckLoadingSessionSchema.index({ truck_id: 1, status: 1 });
TruckLoadingSessionSchema.index({ depot_id: 1, loading_date: -1 });

module.exports = mongoose.model('TruckLoadingSession', TruckLoadingSessionSchema);
