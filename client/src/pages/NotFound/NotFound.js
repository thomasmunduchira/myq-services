import './NotFound.css';
import React, {
  Component
} from 'react';

class NotFound extends Component {
  render(event) {
    return (
      <div id="error-header">
        <h2>404</h2>
        <p>Not Found</p>
      </div>
    )
  };
}

export default NotFound;
