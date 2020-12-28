import {create} from 'apisauce';

export const apiCall = create({
  baseURL: 'https://api.openweathermap.org/data/2.5/forecast?units=metric&', // base url used
  headers: {'Content-Type': 'application/json'},
});
