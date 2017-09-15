import './Login.css';
import 'sweetalert2/dist/sweetalert2.css';
import React, { Component } from 'react';
import axios from 'axios';
import swal from 'sweetalert2';

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const showSuccess = (message, callback) => {
  return swal({
    title: 'Success!',
    text: message,
    type: 'success',
    timer: 3000
  }).then(() => {
    if (callback) {
      callback();
    }
  }, (dismiss) => {
    if (callback) {
      callback();
    }
  });
}

const showError = (message, callback) => {
  return swal({
    title: 'Error',
    text: message,
    type: 'error',
    timer: 6000
  }).then(() => {
    if (callback) {
      callback();
    }
  }, (dismiss) => {
    if (callback) {
      callback();
    }
  });
}

class Login extends Component {
  state = {
    form: 'login',
    enablePin: false,
    email: '',
    password: '',
    pin: ''
  };

  login = () => {
    const email = this.state.email;
    const password = this.state.password;

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
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          axios({
            method: 'post',
            url: '/login',
            data: {
              email: email,
              password: password
            }
          }).then((response) => {
            resolve(response.data);
          }).catch((err) => {
            console.error(err);
          });
        });
      },
      onOpen: () => {
        swal.clickConfirm();
      }
    }).then((response) => {
      if (response.redirectUri) {
        showSuccess('You will be redirected back to Amazon', () => {
          window.location.href = response.redirectUri;
        });
      } else if (!response.success) {
        showError(response.message);
      } else {
        showSuccess('You were able to sign into your MyQ account', () => {
          this.setState({
            form: 'pin'
          });
        });
      }
    });
  };

  pin = () => {
    const enablePin = this.state.enablePin;
    const pinString = this.state.pin;
    let pin;

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
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          axios({
            method: 'post',
            url: '/pin',
            data: {
              enablePin: enablePin,
              pin: pin
            }
          }).then((response) => {
            resolve(response.data);
          }).catch((err) => {
            console.error(err);
          });
        });
      },
      onOpen: () => {
        swal.clickConfirm();
      }
    }).then((response) => {
      if (response.redirectUri) {
        showSuccess('You will be redirected back to Amazon', () => {
          window.location.href = response.redirectUri;
        });
      } else if (!response.success) {
        showError(response.message);
      } else {
        showSuccess('You\'re all set!');
      }
    });
  };

  submitLogin = (event) => {
    event.preventDefault();
    this.login();
  };

  submitPin = (event) => {
    event.preventDefault();
    this.pin();
  };

  loginKeyPress = (event) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.login();
    }
  };

  toggleEnablePin = (event) => {
    this.setState({
      enablePin: event.target.checked
    });
  };

  pinKeyPress = (event) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.pin();
    }
  };

  emailChange = (event) => {
    this.setState({
      email: event.target.value
    });
  }

  passwordChange = (event) => {
    this.setState({
      password: event.target.value
    });
  }

  pinChange = (event) => {
    this.setState({
      pin: event.target.value
    });
  }

  render = (event) => {
    return (
      <div>
        <form id="login-form" className="form-container">
          <h2>Notice</h2>
          <div>
            <p>
              The Alexa skills that used this service have not been approved through Chamberlain’s partnership process, and have been disabled as a result. The developer is working with the appropriate teams to secure the proper approval and agreement.
            </p>
            <p>
              Check the community forums for more details.
            </p>
          </div>
        </form>
      </div>
    )
  };
}

export default Login;
