import 'normalize.css';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import LoadingComponent from './components/LoadingComponent';
// import registerServiceWorker from './registerServiceWorker';

const makeAsyncComponent = (importString) => {
  return Loadable({
    loader: () => import(`${importString}`),
    loading: LoadingComponent,
    delay: 0,
    timeout: 5000,
  });
};

const AsyncLogin = makeAsyncComponent('./pages/Login/Login');
const AsyncPrivacyPolicy = makeAsyncComponent('./pages/PrivacyPolicy/PrivacyPolicy');
const AsyncNotFound = makeAsyncComponent('./pages/NotFound/NotFound');

ReactDOM.render(
  <Router>
    <div>
      <Switch>
        <Route path="/login" exact component={AsyncLogin} />
        <Route path="/privacy-policy" exact component={AsyncPrivacyPolicy} />
        <Route component={AsyncNotFound} />
      </Switch>
    </div>
  </Router>,
  document.getElementById('root')
);
