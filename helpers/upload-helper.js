const path = require('path');
module.exports = {
    uploadDir: path.join(__dirname, '../public/uploads/'),
    isEmpty: function (obj) {
        if (obj == null || typeof obj !== 'object') return true;

        // Use a for loop to check for properties since hasOwnProperty won't work on null prototypes
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
};
