require('dotenv').config();  // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Product = require('./models/product');
const bodyParser = require('body-parser');
const User = require('./models/user');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcryptjs = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Allow external connections

// Ensure MONGODB_URI and SECRET_KEY are set
if (!process.env.MONGODB_URI || !process.env.SECRET_KEY) {
  console.error('MONGODB_URI and SECRET_KEY must be set in the .env file.');
  process.exit(1);
}

const connectionURL = process.env.MONGODB_URI;
const secretKey = process.env.SECRET_KEY;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: secretKey, // Use the secret key from .env
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: connectionURL }),
    cookie: { secure: false }
  }));

// Passport initialization
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error('User not found:', username); // Log for debugging
      return done(null, false);
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      console.error('Invalid password for user:', username); // Log for debugging
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    console.error('Error during local authentication:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
    try {
      const user = await User.findById(userId);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

app.use(passport.initialize());
app.use(passport.session());

// Login route with debugging
app.post('/', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
  }));

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    console.log('User logged in:', req.user.username); // Log for debugging
    return next();
  }
  res.redirect('/'); // Redirect to signin if not logged in
}


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


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'n', 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'n', 'signup.html'));
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
    res.redirect('/upload'); // Redirect to the upload form page
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).send('Server Error');
  }
});

// Serve the index.html page
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'n', 'index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'n', 'upload.html'));
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





































// Check if the user is authenticated and an admin
function isAdmin(req) {
    return req.isAuthenticated() && req.user.isAdmin;
  }
  
  // Middleware to check if user is authenticated and an admin
  function isAdminLoggedIn(req, res, next) {
    if (isAdmin(req)) {
      console.log('Admin logged in:', req.user.username);
      return next();
    }
    console.log('Admin not logged in or not authorized');
    res.redirect('/');
  }
  
  // Dashboard route
  app.get('/dashboard', isAdminLoggedIn, (req, res) => {
    res.redirect('/upload');
  });

















// Route to handle sign-in requests
// Sign-in Route
app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(401).send('Invalid credentials');
      }
  
      const isValidPassword = await bcryptjs.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).send('Invalid credentials');
      }
  
      if (user.isAdmin) {
        req.login(user, err => {
          if (err) {
            console.error('Error during login:', err);
            return res.status(500).send('Server Error');
          }
          return res.redirect('/dashboard'); // Redirect admin users to /dashboard
        });
      } else {
        req.login(user, err => {
          if (err) {
            console.error('Error during login:', err);
            return res.status(500).send('Server Error');
          }
          return res.redirect('/index'); // Redirect regular users to /index
        });
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      res.status(500).send('Server Error');
    }
  });
  
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const existingUser = await User.findOne({ username });
  
      if (existingUser) {
        return res.status(400).send('Username already exists');
      }
  
      const hashedPassword = await bcryptjs.hash(password, 10);
  
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
  
      res.redirect('/');
    } catch (error) {
      console.error('Error during sign-up:', error);
      res.status(500).send('Server Error');
    }
  });
  



  app.get('/dashboard', isLoggedIn, (req, res) => {
    if (req.user.isAdmin) {
      res.redirect('/upload'); // Redirect admin users to /upload
    } else {
      res.redirect('/index'); // Redirect regular users to /index
    }
  });




// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
