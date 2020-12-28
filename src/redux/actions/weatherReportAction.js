import {types} from '../actionTypes';
import {apiCall} from './../../constants/helpers';

//
// ─── FETCHING WEATHER INFO ASYNC CALL ───────────────────────────────────────────────────────────
//

export const fetchRecords = (lat, long) =>
  // Listing async call
  {
    return (dispatch) => {
      dispatch({type: types.WEATHER_RECORD_REQUEST});
      apiCall
        .get(
          apiCall.getBaseURL() +
            'lat=' +
            (lat || '28.6562') +
            '&lon=' +
            (long || '77.2410') +
            '&appid=2e80dd413e0b530cac81dd7eeb1e5dea',
        )
        .then((response) => {
          console.log('response', response);
          if (response.status == '200') {
            dispatch({type: types.WEATHER_RECORD_SUCCESS, res: response.data});
          } else {
            dispatch({type: types.WEATHER_RECORD_FAILED});
          }
        })
        .catch((e) => {
          console.log('error', e);
          dispatch({type: types.WEATHER_RECORD_FAILED});
        });
    };
  };
