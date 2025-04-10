import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Agency, AgencyStatistics } from '../../types/api';
import { agencyApi } from '../../services/api';

interface AgencyState {
  profile: Agency | null;
  statistics: AgencyStatistics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AgencyState = {
  profile: null,
  statistics: null,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'agency/fetchProfile',
  async (agencyId: number) => {
    const response = await agencyApi.getProfile(agencyId);
    return response.data;
  }
);

export const fetchStatistics = createAsyncThunk(
  'agency/fetchStatistics',
  async (agencyId: number) => {
    const response = await agencyApi.getStatistics(agencyId);
    return response.data;
  }
);

const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(fetchStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch statistics';
      });
  },
});

export const { clearError } = agencySlice.actions;
export default agencySlice.reducer;