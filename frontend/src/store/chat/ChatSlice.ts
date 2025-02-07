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
  async ({ threadId, message, process = true }: { threadId: string; message: MessageCreate; process?: boolean }) => {
    try {
      // Create FormData if there are attachments
      if (message.attachments?.length) {
        const formData = new FormData();
        
        // Add message data as JSON, excluding attachments
        const messageData = { ...message };
        delete messageData.attachments;
        formData.append('message', JSON.stringify(messageData));
        formData.append('process', String(process));
        
        // Add each file
        message.attachments.forEach((attachment) => {
          formData.append('files', attachment.file);
        });

        const response = await axios.post(
          `${API_BASE_URL}/threads/${threadId}/messages`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        return response.data;
      }

      // No attachments, send regular JSON
      const formData = new FormData();
      formData.append('message', JSON.stringify(message));
      formData.append('process', String(process));
      
      const response = await axios.post(
        `${API_BASE_URL}/threads/${threadId}/messages`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
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