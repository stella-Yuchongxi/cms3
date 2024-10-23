const passport = require('passport');
module.exports = {
    authenticateUser: function (req, res, next) {
        if(req.isAuthenticated()){
            return next();
        }
        res.redirect('/login');
    }
};



