import * as actionTypes from '@/actions/actionTypes';

const initialState = {
  list: [],
  selectedId: null,
};

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case 'persist/REHYDRATE': {
      const b = action.payload?.building;
      if (!b) return state;
      return { list: b.list ?? [], selectedId: b.selectedId ?? null };
    }
    case actionTypes.SET_BUILDINGS: {
      const list = action.buildings ?? [];
      // Seçili bina hâlâ listede var mı kontrol et
      const stillValid = list.some((b) => b.id === state.selectedId);
      return {
        list,
        selectedId: stillValid ? state.selectedId : (list[0]?.id ?? null),
      };
    }
    case actionTypes.SELECT_BUILDING:
      return { ...state, selectedId: action.id };
    case actionTypes.LOGOUT:
      return initialState;
    default:
      return state;
  }
};
