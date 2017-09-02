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
        <form id="login-form" className={'form-container' + (this.state.form === 'login' ? '' : ' hidden')} onKeyPress={this.loginKeyPress}>
          <h2>MyQ Account</h2>
          <div>
            Email
          </div>
          <div>
            <input id="email" className="text-input" type="text" name="email" value={this.state.email} onChange={this.emailChange} />
          </div>
          <div>
            Password
          </div>
          <div>
            <input id="password" className="text-input" type="password" name="password" value={this.state.password} onChange={this.passwordChange} />
          </div>
          <div>
            <input id="submit-login" className="submit" type="submit" onClick={this.submitLogin}/>
          </div>
        </form>

        <form id="pin-form" className={'form-container' + (this.state.form === 'pin' ? '' : ' hidden')} onKeyPress={this.pinKeyPress}>
          <h2>MyQ Account</h2>
          <div id="pin-description">
            A pin is required in order to be able to open your garage doors.
          </div>
          <div>
            <input id="enable-pin" type="checkbox" name="pin" value={this.state.enablePin} onChange={this.toggleEnablePin} />
            <label htmlFor="pin">Enable Pin</label>
          </div>
          <div>
            Pin (must be 4-12 digits in length)
          </div>
          <div>
            <input id="pin" className="number-input" type="number" pattern="[0-9]*" inputMode="numeric" disabled={this.state.checked} value={this.state.pin} onChange={this.pinChange} />
          </div>
          <div>
            <input id="submit-pin" className="submit" type="submit" onClick={this.submitPin} />
          </div>
        </form>
      </div>
    )
  };
}

export default Login;
