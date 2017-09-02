import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Main from './pages/Main/Main';
import Developer from './pages/Developer/Developer';
import Login from './pages/Login/Login';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Router>
    <div>
      {/* <Route exact path="/" component={Main} /> */}
      <Route path="/developer" component={Developer} />
      <Route path="/login" component={Login} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
    </div>
  </Router>,
  document.getElementById('root')
);
registerServiceWorker();
