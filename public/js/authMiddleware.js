(function() {

  var data = window.localStorage.getItem('__chatSession__');

  window.localStorage.removeItem('__chatSession__');

  if (data === null) {

    window.location.href = '/auth';

  } else {

    data = JSON.parse(data);

    if ('username' in data) {
      if (typeof data.username === 'string') {
        data.username = data.username.trim();
        if (data.username === '') {
          window.location.href = '/auth';
        } else {
          window.localStorage.setItem('__chatSession__', JSON.stringify(data));
        }
      } else {
        window.location.href = '/auth';
      }
    } else {
      window.location.href = '/auth';
    }

  }

})();