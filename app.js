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
mongoose.connect('mongodb://localhost:27017/cms', { useNewUrlParser: true, useUnifiedTopology: true })
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
app.use(flash());
//Local variables using Middleware
app.use((req,res,next) => {
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
app.use('/', home);
app.use('/admin', admin);
app.use('/admin/posts', posts);
app.use('/admin/categories', categories);
// Start Server
app.listen(4500, () => {
    console.log('Server running on port 4500');
});
