import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Tender } from '../../types/api';
import { tenderApi } from '../../services/api';

interface TenderState {
  tenders: Tender[];
  selectedTender: Tender | null;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

const initialState: TenderState = {
  tenders: [],
  selectedTender: null,
  loading: false,
  error: null,
  page: 0,
  totalPages: 0,
};

export const fetchTenders = createAsyncThunk(
  'tender/fetchTenders',
  async ({ agencyId, page, size }: { agencyId: number; page: number; size: number }) => {
    const response = await tenderApi.getAll(agencyId, page, size);
    return response.data;
  }
);

export const fetchTenderById = createAsyncThunk(
  'tender/fetchTenderById',
  async ({ agencyId, tenderId }: { agencyId: number; tenderId: number }) => {
    const response = await tenderApi.getOne(agencyId, tenderId);
    return response.data;
  }
);

const tenderSlice = createSlice({
  name: 'tender',
  initialState,
  reducers: {
    clearSelectedTender: (state) => {
      state.selectedTender = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenders.fulfilled, (state, action) => {
        state.loading = false;
        state.tenders = action.payload;
      })
      .addCase(fetchTenders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tenders';
      })
      .addCase(fetchTenderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTender = action.payload;
      })
      .addCase(fetchTenderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tender';
      });
  },
});

export const { clearSelectedTender, clearError } = tenderSlice.actions;
export default tenderSlice.reducer;