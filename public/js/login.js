function login() {
  var email = $('#email').val();
  var password = $('#password').val();

  swal({
    title: 'Logging In',
    showCancelButton: false,
    showLoaderOnConfirm: true,
    allowOutsideClick: false,
    preConfirm: function() {
      return new Promise(function(resolve, reject) {
        $.ajax({
          url: '/login',
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({
            email: email,
            password: password
          })
        }).done(function(response) {
          resolve(response);
        }).fail(function(err) {
          console.error(err);
        });
      });
    },
    onOpen: function() {
      swal.clickConfirm();
    }
  }).then(function(response) {
    if (response.redirectUri) {
      swal({
        title: 'Success!',
        text: 'You will be redirected back to Amazon',
        type: 'success',
        timer: 3000
      }).then(function() {
        window.location.href = response.redirectUri;
      }, function(dismiss) {
        window.location.href = response.redirectUri;
      });
    } else if (!response.success) {
      swal({
        title: 'Error',
        text: response.message,
        type: 'error',
        timer: 6000
      }).then(function() {

      }, function(dismiss) {

      });
    } else {
      swal({
        title: 'Success!',
        text: 'You were able to sign into your MyQ account',
        type: 'success',
        timer: 3000
      }).then(function() {
        $('#login-form').css('display', 'none');
        $('#pin-form').css('display', 'flex');
      }, function(dismiss) {
        $('#login-form').css('display', 'none');
        $('#pin-form').css('display', 'flex');
      });
    }
  });
};

function pin() {
  var enablePin = $('#enable-pin').is(':checked');
  var pin = $('#pin').val();
  
  if (enablePin && pin.length < 4 || pin.length > 12) {
    return swal({
      title: 'Error',
      text: 'Pin must be 4 to 12 digits in length',
      type: 'error',
      timer: 6000
    }).then(function() {

    }, function(dismiss) {

    });
  }

  swal({
    title: 'Saving Pin Information',
    showCancelButton: false,
    showLoaderOnConfirm: true,
    allowOutsideClick: false,
    preConfirm: function() {
      return new Promise(function(resolve, reject) {
        $.ajax({
          url: '/pin',
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({
            enablePin: enablePin,
            pin: pin
          })
        }).done(function(response) {
          resolve(response);
        }).fail(function(err) {
          console.error(err);
        });
      });
    },
    onOpen: function() {
      swal.clickConfirm();
    }
  }).then(function(response) {
    if (response.redirectUri) {
      swal({
        title: 'Success!',
        text: 'You will be redirected back to Amazon',
        type: 'success',
        timer: 3000
      }).then(function() {
        window.location.href = response.redirectUri;
      }, function(dismiss) {
        window.location.href = response.redirectUri;
      });
    } else if (!response.success) {
      swal({
        title: 'Error',
        text: response.message,
        type: 'error',
        timer: 6000
      }).then(function() {

      }, function(dismiss) {

      });
    } else {
      swal({
        title: 'Success!',
        text: 'You\'re all set!',
        type: 'success',
        timer: 1111000
      }).then(function() {

      }, function(dismiss) {

      });
    }
  });
};

$('#submit-login').on('click', function(event) {
  event.preventDefault();
  login();
});

$('#submit-pin').on('click', function(event) {
  event.preventDefault();
  pin();
});

$('#enable-pin').on('change', function(event) {
  if (this.checked) {
    $('#pin').prop('disabled', false);
  } else {
    $('#pin').prop('disabled', true);
  }
});

$('#login-form').on('keypress', function(event) {
  if (event.keyCode == 13) {
    event.preventDefault();
    login();
  }
});

$('#pin-form').on('keypress', function(event) {
  if (event.keyCode == 13) {
    event.preventDefault();
    pin();
  }
});
