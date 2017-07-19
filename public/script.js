function login() {
  var email = $("#email").val();
  var password = $("#password").val();
  var message = $("#message");

  $.post("/login", {
    "email": email,
    "password": password
  }).done(function(response) {
    console.log(response);
    message.html(response.message);
  }).fail(function(err) {
    console.log(err);
  });
};

$("#submit").on("click", login);
