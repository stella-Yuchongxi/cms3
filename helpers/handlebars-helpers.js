const moment = require('moment');
module.exports = {
    formatDate: function (date, format) {
        return moment(date).format(format);
    },
    generateDate: function (date, format) {
        return moment(date).format(format);
    },
    select: function(selected, options) {
        console.log('Selected:', selected);
        return options.fn(this).replace(new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"');
    },
    ifEquals: function(arg1, arg2, options) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    }
};
