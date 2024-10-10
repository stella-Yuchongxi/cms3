const Handlebars = require('handlebars');

module.exports = {
    breaklines: function (text) {
        text = Handlebars.escapeExpression(text);  // Use Handlebars' own utility
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');  // Matches all types of line breaks
        return new Handlebars.SafeString(text);  // Ensures the <br> tags are not escaped
    }
};
