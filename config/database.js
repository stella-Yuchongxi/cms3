if(process.env.NODE_ENV === 'production') {
    module.exports = require('./pro-database');
}else{
    module.exports = require('./dev-database');
}