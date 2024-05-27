require('dotenv').config();  // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Product = require('./models/product');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage engine for Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Static folder for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the upload form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Route to handle image uploads
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { header, price } = req.body;
        const { path: imagePath, originalname, mimetype, size } = req.file;

        const newProduct = new Product({
            header,
            price,
            image: {
                path: imagePath,
                originalName: originalname,
                mimeType: mimetype,
                size,
                uploadDate: new Date()
            }
        });

        await newProduct.save();
        res.redirect('/'); // Redirect to the upload form page
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).send('Server Error');
    }
});

// Serve the index.html page
app.get('/n', (req, res) => {
    res.sendFile(path.join(__dirname, 'n', 'index.html'));
});

// Endpoint to fetch all images
app.get('/api/images', async (req, res) => {
    try {
        // Query the database for all products
        const products = await Product.find();

        // Extract necessary information from each product
        const productData = products.map(product => ({
            header: product.header,
            price: product.price,
            imagePath: product.image.path
        }));

        // Send the product data as JSON response
        res.json(productData);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
