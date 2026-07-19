import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface ProjectState {
  projects: any[];
  currentProject: any | null;
  myProjects: any[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  myProjects: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await api.post('/projects', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update project');
    }
  }
);

export const fetchMyProjects = createAsyncThunk(
  'projects/fetchMyProjects',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/projects', { params: { ...params, clientOnly: true } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch projects');
    }
  }
);

export const submitProposal = createAsyncThunk(
  'projects/submitProposal',
  async (data: { projectId: string; coverLetter: string; bidAmount: number; deliveryTime: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/proposals', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit proposal');
    }
  }
);

export const updateProposalStatus = createAsyncThunk(
  'projects/updateProposalStatus',
  async ({ proposalId, status }: { proposalId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/proposals/${proposalId}/${status.toLowerCase()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update proposal');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject(state) { state.currentProject = null; },
    clearError(state) { state.error = null; },
    clearMyProjects(state) { state.myProjects = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProjectById.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.myProjects.unshift(action.payload);
      })
      .addCase(fetchMyProjects.fulfilled, (state, action) => {
        state.myProjects = action.payload.data;
      });
  },
});

export const { clearCurrentProject, clearError, clearMyProjects } = projectSlice.actions;
export default projectSlice.reducer;
