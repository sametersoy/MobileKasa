import * as actionTypes from '@/actions/actionTypes';

const initialState = {
  token: null,
  user: null,
  isLoggedIn: false,
};

const normalize = (state) => ({
  token: state?.token ?? null,
  user: state?.user ?? null,
  isLoggedIn: typeof state?.token === 'string' && state.token.length > 0,
});

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case 'persist/REHYDRATE':
      // Eski shape'i (login.success, user.lang) temizle
      return normalize(action.payload?.auth);
    case actionTypes.LOGIN_SUCCESS:
      return {
        token: action.data.token,
        user: {
          email: action.data.email,
          fullName: action.data.fullName,
          role: action.data.role,
          buildingId: action.data.buildingId ?? null,
        },
        isLoggedIn: true,
      };
    case actionTypes.LOGOUT:
      return initialState;
    default:
      return state;
  }
};
