const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Image Schema
const imageSchema = new Schema({
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, required: true }
}, { _id: false });

// Define the Product Schema
const productSchema = new Schema({
    header: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: imageSchema, required: true }
});

module.exports = mongoose.model('Product', productSchema);
