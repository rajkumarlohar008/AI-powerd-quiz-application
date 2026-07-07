import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    globalLoading: false,
    globalError: null,
    isMenuOpen: false // Nav menu
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setGlobalLoading: (state, action) => {
            state.globalLoading = action.payload;
        },
        setGlobalError: (state, action) => {
            state.globalError = action.payload;
        },
        toggleMenu: (state) => {
            state.isMenuOpen = !state.isMenuOpen;
        },
        closeMenu: (state) => {
            state.isMenuOpen = false;
        }
    }
});

export const { setGlobalLoading, setGlobalError, toggleMenu, closeMenu } = uiSlice.actions;
export default uiSlice.reducer;
