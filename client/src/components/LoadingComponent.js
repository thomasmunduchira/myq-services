import React from 'react';

const LoadingComponent = (props) => {
  if (props.isLoading) {
    if (props.timedOut) {
      return <div>Something went wrong. Please reload your page.</div>;
    } else if (props.pastDelay) {
      return <div>Loading...</div>;
    } else {
      return null;
    }
  } else if (props.error) {
    return <div>Something went wrong. Please reload your page.</div>;
  } else {
    return null;
  }
};

export default LoadingComponent;
