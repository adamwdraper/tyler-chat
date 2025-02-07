import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Thread, ThreadCreate, MessageCreate } from '../../types/chat';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface ChatState {
  threads: Thread[];
  currentThread: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  threads: [],
  currentThread: null,
  loading: false,
  error: null,
};

export const fetchThreads = createAsyncThunk(
  'chat/fetchThreads',
  async () => {
    const response = await axios.get(`${API_BASE_URL}/threads`);
    return response.data;
  }
);

export const createThread = createAsyncThunk(
  'chat/createThread',
  async (threadData: ThreadCreate) => {
    const response = await axios.post(`${API_BASE_URL}/threads`, threadData);
    return response.data;
  }
);

export const addMessage = createAsyncThunk(
  'chat/addMessage',
  async ({ threadId, message }: { threadId: string; message: MessageCreate }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/threads/${threadId}/messages`, 
        message,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
);

export const processThread = createAsyncThunk(
  'chat/processThread',
  async (threadId: string) => {
    const response = await axios.post(`${API_BASE_URL}/threads/${threadId}/process`);
    return response.data;
  }
);

export const deleteThread = createAsyncThunk(
  'chat/deleteThread',
  async (threadId: string) => {
    await axios.delete(`${API_BASE_URL}/threads/${threadId}`);
    return threadId;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentThread: (state, action) => {
      state.currentThread = action.payload;
    },
    updateThread: (state, action) => {
      const threadIndex = state.threads.findIndex(t => t.id === action.payload.id);
      if (threadIndex !== -1) {
        state.threads[threadIndex] = action.payload;
      } else {
        state.threads.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false;
        state.threads = action.payload;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch threads';
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.threads.push(action.payload);
        state.currentThread = action.payload.id;
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        const threadIndex = state.threads.findIndex(t => t.id === action.payload.id);
        if (threadIndex !== -1) {
          state.threads[threadIndex] = action.payload;
        }
      })
      .addCase(processThread.fulfilled, (state, action) => {
        const threadIndex = state.threads.findIndex(t => t.id === action.payload.id);
        if (threadIndex !== -1) {
          state.threads[threadIndex] = action.payload;
        }
      })
      .addCase(deleteThread.fulfilled, (state, action) => {
        state.threads = state.threads.filter(t => t.id !== action.payload);
        if (state.currentThread === action.payload) {
          state.currentThread = null;
        }
      });
  },
});

export const { setCurrentThread, updateThread } = chatSlice.actions;
export default chatSlice.reducer; 