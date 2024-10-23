const express = require('express');
const app = express();
const path = require('path');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const { formatDate, generateDate, select, ifEquals} = require('./helpers/handlebars-helpers');
const { breaklines } = require('./helpers/breakline-helpers');
const methodOverride = require('method-override');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const flash = require('connect-flash');
const {mongoDbUrl} = require('./config/database')
const passport = require('passport');
const authenticateUser = require('./helpers/authentication');
const axios = require('axios');
// Handlebars configuration
app.engine('handlebars', engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: 'home',
    helpers: {
        formatDate: formatDate,
        generateDate: generateDate,
        select: select,
        breaklines: breaklines,
        ifEquals: ifEquals
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(mongoDbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());  // Note the parentheses - this initializes the middleware
app.use(methodOverride('_method'));
app.use(session({
    secret:'edwindiaz123ilovecoding',
    resave: false,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//Local variables using Middleware
app.use((req,res,next) => {
    res.locals.user = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.warn = req.flash('warn');
    next();
});

// Load Routes
const home = require('./routes/home/main');
const admin = require('./routes/admin/index');
const posts = require('./routes/admin/posts');
const categories = require('./routes/admin/categories');

// Use Routes
app.use((req, res, next) => {
    console.log('User session:', req.user); // Should log `null` or `undefined` after logout
    next();
});
app.use('/', home);
app.use('/admin', admin);
app.use('/admin/posts', posts);
app.use('/admin/categories', categories);
// Add a route to handle chat requests
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const response = await axios.post('http://localhost:5000/llm', {
            message: userMessage
        });
        const botReply = response.data.reply;
        res.json({ reply: botReply });
    } catch (error) {
        console.error('Error communicating with the LLM service:', error);
        res.status(500).json({ reply: 'Sorry, I cannot process your request right now.' });
    }
});
// Start Server
app.listen(4500, () => {
    console.log('Server running on port 4500');
});
