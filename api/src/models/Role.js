const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  description: String,
  permissions: Object,
  niveau_acces: { type: Number, default: 1 },
  actif: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);


