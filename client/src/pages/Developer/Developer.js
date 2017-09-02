import './Developer.css';
import React, { Component } from 'react';

class Developer extends Component {
  state = {};

  render = (event) => {
    return (
      <div className="form-container">
        <h2>MyQ Account API</h2>
        <div>
          Client ID
        </div>
        <div>
          <label id="email" className="text-input" type="text" name="email">
          </label>
        </div>
        <div>
          Client Secret
        </div>
        <div>
          <label id="password" className="text-input" type="password" name="password">
          </label>
        </div>
      </div>
    )
  };
}

export default Developer;
