/**
 *  @author: Isaac Vega Rodriguez          <isaacvega1996@gmail.com>
 */

var express = require('express');
var io      = require('socket.io');

var app = express();

var ROOT = require('path').normalize(__dirname + '/public/');

app.get('/', (req, res) => {

  res.sendFile('index.html', {
    root: ROOT
  });

});

app.get('/sender', (req, res) => {

  res.sendFile('sender.html', {
    root: ROOT
  });

});

app.get('/receiver', (req, res) => {

  res.sendFile('receiver.html', {
    root: ROOT
  });

});

app.get('/js/:ar', (req, res) => {

  res.sendFile(req.params.ar, {
    root: ROOT + '/js'
  });

});

var server = app.listen(80, function () {
  console.log('Express server listening on port ' + 80);
});

var changedIds = {};

/// SOCKET.IO SERVER

io = io(server);

io.on('connection', function(socket) {

  console.log('New Connection!!!');

  socket.on('videoChat', function(d) {
    //console.log('Received data at', (new Date()).getTime());
    io.emit('videoChat', d);
  }); 

});