import React, {Component} from 'react';
const ReduxThunk = require('redux-thunk').default;

import {createStore, applyMiddleware, compose} from 'redux';
import {Provider} from 'react-redux';
import rootReducer from './src/redux/rootReducer';
import DashBoard from './src/screens/dashboard';
console.disableYellowBox = true;

// Redux Debugger
let composeEnhancer = compose;

if (__DEV__) {
  composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
}

const store = createStore(
  //creates an instance of store to be used globally
  rootReducer, // pass in the combined reducers
  composeEnhancer(applyMiddleware(ReduxThunk)), // use the middleware for async actions
);

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <DashBoard />
      </Provider>
    );
  }
}
