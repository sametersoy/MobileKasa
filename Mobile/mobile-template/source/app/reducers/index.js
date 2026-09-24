import { combineReducers } from 'redux';
import AuthReducer from './auth';
import ApplicationReducer from './application';
import BuildingReducer from './building';

export default combineReducers({
  auth: AuthReducer,
  application: ApplicationReducer,
  building: BuildingReducer,
});
