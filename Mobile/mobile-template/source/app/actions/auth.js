import * as actionTypes from './actionTypes';
import { authApi } from '@/api';

export const authentication = (email, password, callback) => async (dispatch) => {
  dispatch({ type: actionTypes.LOGIN_START });
  try {
    const data = await authApi.login(email, password);
    dispatch({ type: actionTypes.LOGIN_SUCCESS, data });
    if (typeof callback === 'function') callback({ success: true });
  } catch (error) {
    console.warn('[AUTH] login error:', error?.message, JSON.stringify(error));
    dispatch({ type: actionTypes.LOGIN_ERROR });
    if (typeof callback === 'function') callback({ success: false, error: error?.message ?? 'Bağlantı hatası' });
  }
};

export const logout = () => ({ type: actionTypes.LOGOUT });
