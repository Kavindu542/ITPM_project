const mongoose = require('mongoose');

const LaundryShopSchema = new mongoose.Schema(
  {
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    logoUrl: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    contactNumber: { type: String, required: true, trim: true },
    availableServices: {
      type: [String],
      enum: ['washing', 'dry-cleaning', 'ironing'],
      default: [],
    },
    priceInformation: { type: String, default: '', trim: true },
    openingHours: { type: String, default: '', trim: true },
    pickupDeliveryAvailable: { type: Boolean, default: false },
    shortDescription: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('LaundryShop', LaundryShopSchema);
