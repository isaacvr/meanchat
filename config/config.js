var path = require('path');
var rootPath = path.normalize(__dirname + '/..');
var env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root : rootPath,
    app  : {
      name: 'sitio'
    },
    port : process.env.PORT || 3000,
  },

  test: {
    root : rootPath,
    app  : {
      name: 'sitio'
    },
    port : process.env.PORT || 80,
  },

  production: {
    root : rootPath,
    app  : {
      name: 'sitio'
    },
    port : process.env.PORT || 80,
  }
};

module.exports = config[env];