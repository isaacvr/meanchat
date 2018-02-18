/**
 *  @author: Isaac Vega Rodriguez          <isaacvega1996@gmail.com>
 */

'use strict';

if (typeof angular === 'undefined') {
  throw new ReferenceError(
    [
      'Angular is required.',
      'Please download it from',
      'https://www.angularjs.org/',
      'or include it from a cdn like this:',
      '<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.2/angular.min.js">'
    ].join(' ')
  );
}

var myChat = angular.module('isaacs-chat', ['socket-io']);

myChat.controller('mainController', [
  '$scope',
  '$window',
  'io',
  function($scope, $window, io) {

    /// CONSTANTS

    var CONFIGURABLE_USER_DATA = [ 'username', 'avatar', 'color' ];

    $scope.IN     = 'in';
    $scope.OUT    = 'out';
    $scope.COLORS = [
      '#6699ff', '#0078ff', '#954ef5', '#d04ef5', '#fb43d6',
      '#98ff44', '#ffe744', '#ffae44', '#ff5e48', '#ff386b',
      '#3bf150', '#2dc143', '#33cc99', '#0bd9be', '#0abaec',
      '#303131', '#4f5455', '#828788', '#96a9af', '#5ca9bf'
    ];

    $scope.DEFAULT_AVATAR    = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQYV2NMm/n/PwMDAwMjjAEAP7oF/d9FDfcAAAAASUVORK5CYII=";
    $scope.DEFAULT_COLOR_OUT = '#33cc99';
    $scope.DEFAULT_COLOR_IN  = '#0abaec';

    /// User Settings

    var sessionData = $window.localStorage.getItem('__chatSession__');
    sessionData = JSON.parse(sessionData);

    /*var sessionData = {
      color : "#0078ff",
      avatar : $scope.DEFAULT_AVATAR,
      username: "isaacvr"
    };//*/

    // console.log($window.localStorage.getItem('__chatSession__'));

    $scope.myUsername = sessionData.username; //'USER' + (new Date()).getTime();
    $scope.myColor = sessionData.color || "";
    $scope.myAvatar = sessionData.avatar || $scope.DEFAULT_AVATAR;
    sessionData.avatar = $scope.myAvatar;
    sessionData.color = $scope.myColor;
    $window.localStorage.setItem('__chatSession__', JSON.stringify(sessionData));
    $scope.myId = null;
    $scope.myWritingStatus = false;

    /// Variables
    $scope.banner = 'Site Header';

    $scope.userSelected = 'public-room';
    $scope.lastUserSelected = 'public-room';
    $scope.colorSelected = '#33cc99';
    $scope.displayUserlist = null;
    $scope.displayOptions = null;
    $scope.loadedImage = null;

    $scope.writingTimeout = 0;

    $scope.connectionStatus = false;

    $scope.userlist = {
      "public-room": {
        state: "active",
        avatar: "./../img/a.png",
        username: "Public Room",
        id: "public-room"
      },
      "Sm9obiBEb2U=": {
        state: "active",
        avatar: "./../img/a.png",
        username: "John Doe",
        id: "Sm9obiBEb2U="
      },
      "SmFtZXMgU21pdGg=": {
        state: "active",
        avatar: "./../img/a.png",
        username: "James Smith",
        id: "SmFtZXMgU21pdGg="
      },
      "SmFuZSBEb2U=": {
        state: "",
        avatar: "./../img/a.png",
        username: "Jane Doe",
        id: "SmFuZSBEb2U="
      },
      "TG9yZW56IFBpZXJjZQ==": {
        state: "",
        avatar: "./../img/a.png",
        username: "Lorenz Pierce",
        id: "TG9yZW56IFBpZXJjZQ=="
      },
      "Q2xhdWRlIEpvaG5zb": {
        state: "",
        avatar: "./../img/a.png",
        username: "Claude Johnson",
        id: "Q2xhdWRlIEpvaG5zb"
      }
    };

    $scope.rooms = {
      "public-room" : //{
        /*unreaded : 0,
        messages :*/ [
          {
            type    : "in",
            from    : "Sm9obiBEb2U=",
            to      : "public-room",
            avatar  : "./../img/a.png",
            //message : "Public Room Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam"
            message : "Public Room"
          }
        ]
      /*}*/,
      "Sm9obiBEb2U=" : /*{
        unreaded : 0,
        messages :*/ [
          {
            type    : "out",
            from    : "SmFtZXMgU21pdGg=",
            to      : "Sm9obiBEb2U=",
            avatar  : "./../img/a.png",
            //message : "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.<img src=\"./../img/b.jpg\"> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
            message : "Yo escribi esto"
          }
        ]
      //}
    };

    $scope.userOptions = [
      {
        name: "Change avatar",
        icon: "icon-camera",
        action: function() {
          $scope.selectRoom('change-avatar-container');
        }
      },
      {
        name: "Change color",
        icon: "icon-camera",
        action: function() {
          $scope.selectRoom('change-color-container');
        }
      },
      {
        name: "Toggle Writing mode",
        icon: "icon-copa",
        action: function() {
          $scope.userlist [ $scope.userSelected ].writing = !$scope.userlist [ $scope.userSelected ].writing;
        }
      },
      {
        name: "Receive message",
        icon: "icon-copa",
        action: function() {
          $scope.addMessage("HOLAA", 'SmFtZXMgU21pdGg=', $scope.myId, $scope.myAvatar, 'in');
        }
      },
      {
        name: "Logout",
        icon: "icon-copa",
        action: function() {
          $window.localStorage.removeItem('__chatSession__');
          $scope.socket.emit('LOGOUT');
          $window.location.href = '/';
        }
      }
    ];

    var doc = $window.document;

    /// Functions

    $scope.selectRoom = function selectRoom(r) {

      if ($scope.userlist.hasOwnProperty(r)) {
        $scope.lastUserSelected = r;
      }

      if ($scope.userlist.hasOwnProperty($scope.userSelected)) {
        $scope.userlist[ $scope.userSelected ].class = '';
      }

      $scope.userSelected = r;

      if (!$scope.rooms.hasOwnProperty(r)) {
        $scope.rooms[ r ] = [];
      }

    };

    $scope.selectUser = function selectUser(k) {

      if ($scope.userlist.hasOwnProperty(k)) {

        if ($scope.userlist[k].state === 'active') {

          $scope.selectRoom(k);

          $scope.userlist[ $scope.userSelected ].class = 'user-selected';

        }
      }
    };

    $scope.selectColor = function selectColor(k) {
      if ($scope.COLORS.indexOf(k) !== -1) {
          $scope.colorSelected = k;
      }
    };

    $scope.selectUser('public-room');

    //$scope.selectRoom('change-avatar-container');

    $scope.handleKeydown = function hk(e) {

      if ([10, 13].indexOf(e.keyCode) != -1) {

        $scope.addMessage(e.target.value, $scope.myId, $scope.userSelected, $scope.myAvatar, 'out');

        $scope.myWritingStatus = false;

        clearTimeout($scope.writingTimeout);

        $scope.socket.emit('MESSAGE', {
          message : e.target.value,
          from    : $scope.myId,
          to      : $scope.userSelected,
          avatar  : $scope.myAvatar
        });

        setTimeout(function() {
          var room = document.getElementById($scope.userSelected);
          room.scrollTop = room.scrollHeight;
        }, 1);

        e.target.value = "";

        e.target.focus();

      } else {

        var ok = true;
        var keys = [ 'altKey', 'ctrlKey', 'shiftKey' ];
        var i;

        for (i = 0; i < keys.length; i += 1) {
          if (keys[i] in e) {
            if (e[ keys[i] ] === true) {
              ok = false;
              break;
            }
          }
        }

        if (ok === true) {

          if ($scope.myWritingStatus === false) {
            $scope.socket.emit('WRITING', {
              from: $scope.myId,
              to: $scope.userSelected
            });
          }

          $scope.myWritingStatus = true;

          clearTimeout($scope.writingTimeout);

          $scope.writingTimeout = setTimeout(function() {
            $scope.myWritingStatus = false;
            $scope.socket.emit('STOP_WRITING', {
              from: $scope.myId,
              to: $scope.userSelected
            });
          }, 3000);

        }

      }

    };

    $scope.clickHandler = function ch(e) {

      if (/^more/.test(e.target.id)) {

        e.stopImmediatePropagation();

        if (e.target.id === 'more-left') {
          $scope.displayUserlist = true;
          $scope.displayOptions  = false;
        } else if (e.target.id === 'more-right') {
          $scope.displayOptions  = true;
          $scope.displayUserlist = false;
        } else {
          $scope.displayOptions  = false;
          $scope.displayUserlist = false;
        }

      } else {
        $scope.displayOptions  = false;
        $scope.displayUserlist = false;
      }

    };

    $scope.addMessage = function addMessage(msg, from, to, avatar, type, color, fcolor) {

      msg = msg.trim();

      if (msg === '') {
        return;
      }

      var tab = {
        type    : type,
        from    : from,
        to      : to,
        message : msg,
        avatar  : avatar,
        color   : color,
        fcolor  : fcolor
      };

      var userRoom = to;

      if (userRoom === $scope.myId && !fcolor === true) {
        userRoom = from;
        if (userRoom != $scope.userSelected) {
          $scope.userlist[ userRoom ].class = 'new-message';
        }
      }

      // console.log(userRoom);

      if (userRoom != 'public-room') {
        $scope.userlist[ userRoom ].sawLastMessage = false;
        $scope.userlist[ userRoom ].writing = false;
      }

      if (!$scope.rooms.hasOwnProperty(userRoom)) {
        $scope.rooms[ userRoom ] = [];
      }

      $scope.rooms[ userRoom ].push(tab);

      setTimeout(function() {
        roomScrollHandler({
          target: window[userRoom]
        });
      }, 10);

    };

    $scope.goToLastRoom = function goToLastRoom() {
      $scope.selectUser( $scope.lastUserSelected );
    };

    $scope.saveMyColor = function saveMyColor(c) {
      $scope.myColor = c;
      if ($scope.connectionStatus === true) {
        $scope.socket.emit('USER_DATA', {
          color : c
        });
      }
      $scope.goToLastRoom();
    };

    $scope.imageUploadHandler = function(e) {

      var av = e.target.files[0];
      var lector = new FileReader();

      if (/^image/.test(av.type) === false) {
        alert('Invalid type. Expected an image.');
        return;
      }

      lector.onload = function(e1) {

        var img = new Image();

        var cnv = doc.createElement('canvas');
        cnv.width = cnv.height = 250;

        var ctx = cnv.getContext('2d');

        img.addEventListener('load', function() {

          ctx.drawImage(img, 0, 0, 250, 250);

          $scope.$apply(function() {
            $scope.loadedImage = cnv.toDataURL('image/jpeg', 0.2);
          });

        }, false);

        img.src = e1.target.result;

      };

      lector.readAsDataURL(av);//*/

    };

    $scope.saveAvatar = function saveAvatar(a) {
      $scope.myAvatar = a || $scope.DEFAULT_AVATAR;
      // console.log(a);
      if ($scope.connectionStatus === true) {
        $scope.socket.emit('USER_DATA', {
          avatar: $scope.myAvatar
        });
      }
      $scope.goToLastRoom();
    };

    /// RTC

    $scope.socket = io.connect('http://' + $window.location.hostname);

    $scope.socket.on('connect', function() {

      $scope.connectionStatus = true;

      // console.log('My USERNAME: ', $scope.myUsername);

      $scope.socket.emit('USER_DATA', {
        avatar   : $scope.myAvatar,
        color    : $scope.myColor,
        username : $scope.myUsername
      });

    });

    $scope.socket.on('USER_DATA', function(data) {

      data.state = "active";

      $scope.$apply(function() {
        // console.log('Got userdata');

        $scope.userlist[ data.id ] = $scope.userlist[ data.id ] || {};

        if (!$scope.rooms[ data.id ]) {
          $scope.rooms[ data.id ] = [];
        }

        $scope.userlist[ data.id ].state = "active";

        var i;
        for (i = 0; i < CONFIGURABLE_USER_DATA.length; i += 1) {
          if (CONFIGURABLE_USER_DATA[i] in data) {
            $scope.userlist[ data.id ][ CONFIGURABLE_USER_DATA[i] ] = data[ CONFIGURABLE_USER_DATA[i] ];
          }
        }
      });

    });

    $scope.socket.on('MESSAGE', function(data) {

      //navigator.vibrate(200);

      $scope.$apply(function() {
        // console.log('Got message:', data);

        if (data.from === 'SYSTEM') {
          for (var i in $scope.userlist) {
            // console.log(i);
            $scope.addMessage(data.message, i, $scope.myId, data.avatar, 'in', data.color, data.fcolor);
          }
        } else {
          $scope.addMessage(data.message, data.from, data.to, data.avatar, 'in');
        }

      });

    });

    $scope.socket.on('MY_ID', function(data) {

      $scope.$apply(function() {
        $scope.myId = data.id;
      });

    });

    $scope.socket.on('STOP_WRITING', function(data) {

      if ( data.id in $scope.userlist ) {
        $scope.$apply(function() {
          $scope.userlist[ data.id ].writing = false;
        });
      }

    });

    $scope.socket.on('WRITING', function(data) {

      if ( data.id in $scope.userlist ) {
        $scope.$apply(function() {
          $scope.userlist[ data.id ].writing = true;
        });
      }

    });

    $scope.socket.on('DISCONNECTED', function(data) {

      console.log('User', data.id, 'disconnect');

      if (data.id in $scope.userlist) {
        $scope.$apply(function() {
          $scope.userlist[ data.id ].state = '';
        });
      }

    });

    $scope.socket.on('UPDATE_ID', function(data) {
      /* code goes here */
    });

    $scope.socket.on('LOGOUT', function(data) {

      $scope.$apply(function() {
        delete $scope.userlist[ data.id ];
      });

    });

    $scope.socket.on('error', function(e) {

      console.log('ERROR: ', e);

    });

    $scope.socket.on('disconnect', function() {

      $scope.$apply(function() {
        $scope.connectionStatus = false;
      });

    });

    /// DOM direct work!!

    var file = doc.querySelector('#file');

    if (!!file) {

      file.addEventListener('change', $scope.imageUploadHandler, false);

    }//*/

  }]);

function roomScrollHandler(e) {

  if ('stopPropagation' in e) {
    e.stopPropagation();
  }

  var sbc, sb;
  var elem = e.target;

  if (!!elem.scrolling) {
    return;
  }

  sbc = elem.querySelector('.scroll-bar-container');

  //console.log(sbc);

  if (!!sbc) {

    sb = sbc.querySelector('.scroll-bar');

    if (!!sb) {

      var rat = elem.clientHeight / elem.scrollHeight;
      var stm = elem.scrollHeight - elem.clientHeight;
      var stm1 = sbc.clientHeight * (1 - rat);

      sb.style['height'] = (100 * rat) + '%';
      sb.style['top'] = (stm1 * elem.scrollTop / stm) + 'px';

    }

  }
}

function sbMdHandler(e) {

  var __context = e.target;

  __context.clientY = e.clientY;
  __context.initialTop = parseInt(e.target.style['top']);

  var listener = sbMMHandler.bind(__context);

  window.addEventListener('mousemove', listener, false);
  window.addEventListener('mouseup', function(e) {
    //console.log(e);
    __context.parentElement.parentElement.scrolling = false;
    window.removeEventListener('mousemove', listener, false);
  }, false);

}

function sbMMHandler(e) {

  /* var a, b, c, d;

  a = 0;
  b = this.initialTop + e.clientY - this.clientY;
  c = this.parentElement.clientHeight - parseInt(this.style['height']);
  d = Math.min(Math.max(a, b), c);

  this.style['top'] = d + 'px';

  var gp = this.parentElement.parentElement;

  gp.scrolling = true;

  gp.scrollTop = (gp.scrollHeight - gp.clientHeight) * d / c;

  //console.log(this.style['top']);//*/

}