function login() {
  var email = $('#email').val();
  var password = $('#password').val();

  $.ajax({
    url: '/login',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({
      'email': email,
      'password': password
    })
  }).done(function(response) {
    if (response.redirectUri) {
      swal({
        title: 'Success!',
        text: 'You will be redirected back to Amazon',
        type: 'success'
      }).then(function() {

      }, function(dismiss) {

      });
      window.location.href = response.redirectUri;
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
        text: 'You were able to sign in to your MyQ account',
        type: 'success',
        timer: 2000
      }).then(function() {
        $('#login-form').css('display', 'none');
        $('#pin-form').css('display', 'flex');
      }, function(dismiss) {
        $('#login-form').css('display', 'none');
        $('#pin-form').css('display', 'flex');
      });
    }
  }).fail(function(err) {
    console.error(err);
  });
};

function pin() {
  var enablePin = $('#enable-pin').is(':checked');
  var pin = $('#pin').val();
  
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
    if (!response.success) {
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
        text: enablePin ? 'Your pin has been saved' : 'No pin saved',
        type: 'success',
      }).then(function() {
        
      }, function(dismiss) {

      });
    }
  }).fail(function(err) {
    console.error(err);
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
