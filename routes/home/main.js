const express = require('express');
const router = express.Router();

router.all('/*', (req, res,next) => {
    req.app.locals.layout = 'home';
    next();
});

router.get('/', (req, res) => {
    // req.session.edwin = 'Edwin Diaz';  // Correct session usage
    // if (req.session.edwin && req.session.edwin !== '') {
    //     console.log(`we found ${req.session.edwin}`);
    // }
    // res.send('Session set. Check the console.');
    res.render('home/index');
});
router.get('/about', (req, res) => {
    res.render('home/about');
});
router.get('/login', (req, res) => {
    res.render('home/login');
});
router.get('/register', (req, res) => {
    res.render('home/register');
});

module.exports = router;