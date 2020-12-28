import {combineReducers} from 'redux';
import weatherReport from './reducers/weatherReportReducer';

export default combineReducers({
  weatherReport,
});

//all reducers are combined here, every reducer needs to be listed here
