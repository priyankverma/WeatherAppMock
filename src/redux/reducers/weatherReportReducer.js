import {types} from '../actionTypes';
const INITIAL_STATE = {weatherData: null, loading: false, error: false};

const weatherReportReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case types.WEATHER_RECORD_REQUEST: {
      // request state of the async call
      return {
        ...state,
        weatherData: null,
        loading: true,
        error: false,
      };
    }
    case types.WEATHER_RECORD_SUCCESS: {
      // success state of the async call
      return {
        ...state,
        weatherData: action.res,
        loading: false,
        error: false,
      };
    }
    case types.WEATHER_RECORD_FAILED: {
      // failed state of the async call
      return {
        ...state,
        weatherData: null,
        loading: false,
        error: true,
      };
    }

    default:
      return state;
  }
};

export default weatherReportReducer;
