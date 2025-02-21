const moment = require('moment');
const Handlebars = require('handlebars');

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
    paginate: function(options) {
        let output = '';
        const current = options.hash.current;
        const pages = options.hash.pages;

        if (pages <= 1) return ''; // No pagination if only 1 page

        // First Page Button
        if (current === 1) {
            output += `<li class="page-item disabled"><a class="page-link">First</a></li>`;
        } else {
            output += `<li class="page-item"><a href="?page=1" class="page-link">First</a></li>`;
        }

        // Previous Page Button
        if (current > 1) {
            output += `<li class="page-item"><a href="?page=${current - 1}" class="page-link">&larr; Prev</a></li>`;
        } else {
            output += `<li class="page-item disabled"><a class="page-link">&larr; Prev</a></li>`;
        }

        // Page Numbers (showing up to 5 pages around the current page)
        let startPage = Math.max(1, current - 2);
        let endPage = Math.min(pages, current + 2);

        for (let i = startPage; i <= endPage; i++) {
            if (i === current) {
                output += `<li class="page-item active"><a class="page-link">${i}</a></li>`;
            } else {
                output += `<li class="page-item"><a href="?page=${i}" class="page-link">${i}</a></li>`;
            }
        }

        // Next Page Button
        if (current < pages) {
            output += `<li class="page-item"><a href="?page=${current + 1}" class="page-link">Next &rarr;</a></li>`;
        } else {
            output += `<li class="page-item disabled"><a class="page-link">Next &rarr;</a></li>`;
        }

        // Last Page Button
        if (current === pages) {
            output += `<li class="page-item disabled"><a class="page-link">Last</a></li>`;
        } else {
            output += `<li class="page-item"><a href="?page=${pages}" class="page-link">Last</a></li>`;
        }

        return new Handlebars.SafeString(output);
    },
    ifEquals: function(arg1, arg2, options) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    }
};
