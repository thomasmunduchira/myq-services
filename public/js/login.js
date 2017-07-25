function login() {
  var email = $("#email").val();
  var password = $("#password").val();
  var message = $("#message");
  message.html("");

  $.post("/login", {
    "email": email,
    "password": password
  }).done(function(response) {
    message.html(response.message);
    if (response.redirectUri) {
      setTimeout(function() {
        window.location.href = response.redirectUri;
      }, 100);
    }
  }).fail(function(err) {
    console.log(err);
  });
};

$("#submit").on("click", function (event) {
  event.preventDefault();
  login();
});

$("#login-form").keypress(function (event) {
  if (event.keyCode == 13) {
    event.preventDefault();
    login();
  }
});
