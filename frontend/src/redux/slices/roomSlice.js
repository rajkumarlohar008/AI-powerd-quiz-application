import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../../config';

export const fetchRoom = createAsyncThunk(
    'room/fetchRoom',
    async ({ roomId, token }, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/api/getRoom/id`, {
                params: { roomId },
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Room not found');
        }
    }
);

export const submitRoomQuiz = createAsyncThunk(
    'room/submitRoomQuiz',
    async ({ roomPayload, roomId, token }, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${API_URL}/api/quizRoom/quiz-attempt`, roomPayload, {
                params: { roomId },
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to save quiz results securely to user history.');
        }
    }
);

const initialState = {
    roomId: '',
    room: null,
    loading: false,
    error: '',
    isSubmitting: false,
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setRoomIdInput: (state, action) => {
            state.roomId = action.payload;
        },
        clearRoom: (state) => {
            state.room = null;
            state.roomId = '';
            state.error = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoom.pending, (state) => {
                state.loading = true;
                state.error = '';
            })
            .addCase(fetchRoom.fulfilled, (state, action) => {
                state.loading = false;
                state.room = action.payload;
            })
            .addCase(fetchRoom.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(submitRoomQuiz.pending, (state) => {
                state.isSubmitting = true;
                state.error = '';
            })
            .addCase(submitRoomQuiz.fulfilled, (state) => {
                state.isSubmitting = false;
            })
            .addCase(submitRoomQuiz.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.payload;
            });
    }
});

export const { setRoomIdInput, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;
