function login() {
  var email = $("#email").val();
  var password = $("#password").val();

  $.post("/login", {
    "email": email,
    "password": password
  }).done(function(response) {
    if (response.redirectUri) {
      swal({
        title: 'Success!',
        text: 'You will be redirected back to Amazon',
        type: 'success'
      }).then(function() {
        window.location.href = response.redirectUri;
      }, function(dismiss) {

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
        text: 'You were able to sign in to your MyQ account',
        type: 'success',
        timer: 2500
      }).then(function() {

      }, function(dismiss) {

      });
    }
  }).fail(function(err) {
    console.error(err);
  });
};

$("#submit").on("click", function(event) {
  event.preventDefault();
  login();
});

$("#login-form").keypress(function(event) {
  if (event.keyCode == 13) {
    event.preventDefault();
    login();
  }
});
