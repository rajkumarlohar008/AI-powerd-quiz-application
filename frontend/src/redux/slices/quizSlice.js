import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../../config';

// Thunks
export const fetchQuizHistory = createAsyncThunk(
  'quiz/fetchHistory',
  async ({ userId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/api/quiz-history`, {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load quiz history.');
    }
  }
);

export const deleteQuizAttempt = createAsyncThunk(
  'quiz/deleteAttempt',
  async ({ id, userId, token }, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${API_URL}/api/history/delete`, {
        params: { Id: id },
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(fetchQuizHistory({ userId, token }));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete quiz attempt.');
    }
  }
);

const initialState = {
  history: null,
  loading: false,
  error: '',
  selectedAttempt: null,
  deletingId: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setSelectedAttempt: (state, action) => {
      state.selectedAttempt = action.payload;
    },
    clearQuizError: (state) => {
      state.error = '';
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch History
      .addCase(fetchQuizHistory.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchQuizHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchQuizHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Attempt
      .addCase(deleteQuizAttempt.pending, (state, action) => {
        state.deletingId = action.meta.arg.id;
        state.error = '';
      })
      .addCase(deleteQuizAttempt.fulfilled, (state) => {
        state.deletingId = null;
      })
      .addCase(deleteQuizAttempt.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      });
  }
});

export const { setSelectedAttempt, clearQuizError } = quizSlice.actions;
export default quizSlice.reducer;
