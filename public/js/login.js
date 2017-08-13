function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function showSuccess(message, callback) {
  return swal({
    title: 'Success!',
    text: message,
    type: 'success',
    timer: 3000
  }).then(function() {
    if (callback) {
      callback();
    }
  }, function(dismiss) {
    if (callback) {
      callback();
    }
  });
}

function showError(message, callback) {
  return swal({
    title: 'Error',
    text: message,
    type: 'error',
    timer: 6000
  }).then(function() {
    if (callback) {
      callback();
    }
  }, function(dismiss) {
    if (callback) {
      callback();
    }
  });
}

function login() {
  var email = $('#email').val();
  var password = $('#password').val();

  if (!email) {
    return showError('No email entered');
  } else if (!password) {
    return showError('No password entered');
  } if (!validateEmail(email)) {
    return showError('Invalid email entered');
  }

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
      showSuccess('You will be redirected back to Amazon', function() {
        window.location.href = response.redirectUri;
      });
    } else if (!response.success) {
      showError(response.message);
    } else {
      showSuccess('You were able to sign into your MyQ account', function() {
        $('#login-form').css('display', 'none');
        $('#pin-form').css('display', 'flex');
      });
    }
  });
};

function pin() {
  var enablePin = $('#enable-pin').is(':checked');
  var pinString = $('#pin').val();
  var pin;

  if (enablePin) {
    if (pinString.indexOf('.') !== -1) {
      return showError('Pin must be an integer');
    } else if (pinString.length < 4 || pinString.length > 12) {
      return showError('Pin must be 4 to 12 digits in length');
    }

    pin = +pinString;
    if (!pin) {
      return showError('Pin must be numeric');
    } else if (pin < 0) {
      return showError('Pin must be positive');
    }
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
      showSuccess('You will be redirected back to Amazon', function() {
        window.location.href = response.redirectUri;
      });
    } else if (!response.success) {
      showError(response.message);
    } else {
      showSuccess('You\'re all set!');
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
