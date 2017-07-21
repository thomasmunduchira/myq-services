function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1));
  var sURLVariables = sPageURL.split('&');
  var sParameterName;

  for (var i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

var state = getUrlParameter('state');

function login() {
  var email = $("#email").val();
  var password = $("#password").val();
  var message = $("#message");
  console.log(state);

  $.post("/login", {
    "email": email,
    "password": password,
    "state": state
  }).done(function(response) {
    message.html(response.message);
  }).fail(function(err) {
    console.log(err);
  });
};

$("#submit").on("click", login);
