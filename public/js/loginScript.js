window.addEventListener('load', setUpLogin, false);

function setUpLogin() {

  window.localStorage.removeItem('__chatSession__');

  if ( window.localStorage.getItem('__chatSession__') != null ) {
    //window.location.href = '/';
    return;
  }

  window.localStorage.setItem('__chatSession__', JSON.stringify({}));

  var back  = document.querySelector('#back');
  var btn   = document.querySelector('#storeUsername');
  var avt   = document.querySelector('#storeAvatar');
  var inp   = document.querySelector('#username');
  var list  = document.querySelectorAll('#login-form ul li');
  var index = 0;

  var setVisibility = function setVisibility() {

    var i;

    for (i = 0; i < list.length; i += 1) {
      if (i != index) {
        list[i].style.display = 'none';
      } else {
        list[i].style.display = '';
      }
    }//*/

  };

  setVisibility();

  inp.addEventListener('keydown', function(e) {

    if ([10, 13].indexOf(e.keyCode) != -1) {

      var user = inp.value.trim();

      if (user != '') {

        index += 1;

        setVisibility();

      }

    }

  }, false);

  btn.addEventListener('click', function() {

    var user = inp.value.trim();

    if (user != '') {

      index += 1;

      setVisibility();

      //window.location.href = '/';

    }

  }, false);

  avt.addEventListener('click', function() {

    var img = document.querySelector('#avatar-preview');
    var user = inp.value.trim();

    if (/^data:image\/jpeg/.test(img.src) === true) {

      window.localStorage.setItem('__chatSession__', JSON.stringify({
        username : user,
        avatar   : img.src
      }));

      window.location.href = '/';

    }

  }, false);

  back.addEventListener('click', function() {

    index -= 1;
    setVisibility();

  }, false);

}

function imageUploadHandler(e) {

  var av = e.target.files[0];
  var lector = new FileReader();

  if (/^image/.test(av.type) === false) {
    alert('Invalid type. Expected an image.');
    return;
  }

  lector.onload = function(e1) {

    var img = new Image();

    var cnv = document.createElement('canvas');
    cnv.width = cnv.height = 250;

    var ctx = cnv.getContext('2d');

    img.addEventListener('load', function() {

      ctx.drawImage(img, 0, 0, 250, 250);

      document.querySelector('#avatar-preview').src = cnv.toDataURL('image/jpeg', 0.4);

    }, false);

    img.src = e1.target.result;

  };

  lector.readAsDataURL(av);//*/

};
//*/