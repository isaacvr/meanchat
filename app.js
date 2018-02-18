/**
 *  @author: Isaac Vega Rodriguez         <isaacvega1996@gmail.com>
 */

'use strict';

/// CONSTANTS
var CONFIGURABLE_USER_DATA = ['username', 'avatar', 'color'];
var SYSTEM_AVATAR          = require('./siteConstants/systemAvatar');

/// MODULES
var express = require('express');
var config  = require('./config/config');
var io      = require('socket.io');

/// EXPRESS SERVER

var app = express();

/// ROUTES
module.exports = require('./config/express')(app, config);

var server = app.listen(config.port, function () {
  console.log('Express server listening on port ' + config.port);
});


/// USER EVENT HANDLERS

function USER_DATA(data) {

  // console.log('Server got userdata: ', data);

  for (var i = 0; i < CONFIGURABLE_USER_DATA.length; i += 1) {
    if (CONFIGURABLE_USER_DATA[i] in data) {
      this.userData[ CONFIGURABLE_USER_DATA[i] ] = data[ CONFIGURABLE_USER_DATA[i] ];
    }
  }

  if (this.userData.isConfig === false) {

    this.userData.isConfig = socketConfig(this);

    if (this.userData.isConfig === true) {
      this.broadcast.emit('USER_DATA', this.userData);
    }

  } else {
    this.broadcast.emit('USER_DATA', this.userData);
  }

}

function MESSAGE(data) {

  console.log(data);

  if (data.to in io.sockets.sockets) {
    io.sockets.sockets[ data.to ].emit('MESSAGE', data);
  } else if (data.to === 'public-room') {
    this.broadcast.emit('MESSAGE', data);
  }

}

function WRITING(data) {

  if (data.to in io.sockets.sockets) {
    io.sockets.sockets[ data.to ].emit('WRITING', {
      id: data.from
    });
  }

}

function STOP_WRITING(data) {

  if (data.to in io.sockets.sockets) {
    io.sockets.sockets[ data.to ].emit('STOP_WRITING', {
      id: data.from
    });
  }

}

function LOGIN_AS_ADMIN(data) {
  /* code goes here */
}

function BAN_USER(data) {
  /* code goes here */
}

function BROADCAST(data) {

  this.userData.isAdmin = !this.userData.isAdmin;

  if ( this.userData.isAdmin === true ) {
    io.emit('MESSAGE', {
      message : data.message,
      from    : 'SYSTEM',
      avatar  : SYSTEM_AVATAR,
      color   : '#ffffff',
      fcolor  : '#555'
    });
  }

}

function RESTORE_SESSION(data) {

  for (var i = 0; i < CONFIGURABLE_USER_DATA.length; i += 1) {
    if (CONFIGURABLE_USER_DATA[i] in data) {
      this.userData[ CONFIGURABLE_USER_DATA[i] ] = data[ CONFIGURABLE_USER_DATA[i] ];
    }
  }

  this.emit('SESSION_RESTORED');

  this.broadcast.emit('USER_DATA', this.userData);

}

function UPDATE_ID(data) {

  updatedIds[ data.lastId ] = data.newId;

  this.emit('UPDATED_ID');

  this.broadcast.emit('UPDATED_ID', data);

}

function FIND_USER(data) {

  if ( data.id in io.sockets.sockets ) {
    this.emit('UPDATED_ID', {
      lastId: data.id,
      newId: data.id
    });
  } else if ( data.id in updatedIds ) {
    this.emit('UPDATED_ID', {
      lastId: data.id,
      newId: updatedIds[ data.id ]
    });
  }

}

function LOGOUT(data) {

  this.broadcast.emit('LOGOUT', {
    id: this.userData.id
  });

  this.disconnect();

}

function socketConfig(s) {

  for (var i = 0; i < CONFIGURABLE_USER_DATA.length; i += 1) {
    if (!(CONFIGURABLE_USER_DATA[i] in s.userData)) {
      return false;
    }
  }

  return true;

}

var changedIds = {};

/// SOCKET.IO SERVER

io = io(server);

io.on('connection', function(socket) {

  socket.userData = {
    id       : socket.id,
    isConfig : false
  };

  console.log(`Socket ${socket.id} connected`);

  Object.defineProperty(socket.userData, 'isConfig', {
    enumerable: false,
    configurable: true
  });

  socket.emit('MY_ID', {
    id: socket.id
  });

  for (let i in io.sockets.sockets) {
    if (io.sockets.sockets[i].userData.isConfig === true) {
      socket.emit('USER_DATA', io.sockets.sockets[i].userData);
    }
  }

  socket.on('USER_DATA'      , USER_DATA);
  socket.on('MESSAGE'        , MESSAGE);
  socket.on('WRITING'        , WRITING);
  socket.on('STOP_WRITING'   , STOP_WRITING);
  socket.on('LOGIN_AS_ADMIN' , LOGIN_AS_ADMIN);
  socket.on('BAN_USER'       , BAN_USER);
  socket.on('BROADCAST'      , BROADCAST);
  socket.on('RESTORE_SESSION', RESTORE_SESSION);
  socket.on('UPDATE_ID'      , UPDATE_ID);
  socket.on('FIND_USER'      , FIND_USER);
  socket.on('LOGOUT'         , LOGOUT);

  socket.on('disconnect', function() {
    io.emit('DISCONNECTED', {
      id: this.id
    });
    console.log(`Socket ${this.id} Disconnected`);
  });

});