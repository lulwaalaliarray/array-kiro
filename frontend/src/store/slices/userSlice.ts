import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DoctorSearchResult, SearchFilters } from '../../types';

interface UserState {
  doctors: DoctorSearchResult[];
  searchFilters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  doctors: [],
  searchFilters: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const searchDoctors = createAsyncThunk(
  'user/searchDoctors',
  async (filters: SearchFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters.specialization) queryParams.append('specialization', filters.specialization);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.rating) queryParams.append('rating', filters.rating.toString());
    if (filters.distance) queryParams.append('distance', filters.distance.toString());
    
    const response = await fetch(`/api/users/doctors/search?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to search doctors');
    }
    
    return response.json();
  }
);

export const getNearbyDoctors = createAsyncThunk(
  'user/getNearbyDoctors',
  async (location: { lat: number; lng: number; radius?: number }) => {
    const response = await fetch('/api/users/doctors/nearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(location),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch nearby doctors');
    }
    
    return response.json();
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.searchFilters = action.payload;
    },
    clearDoctors: (state) => {
      state.doctors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Search doctors
      .addCase(searchDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload;
      })
      .addCase(searchDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to search doctors';
      })
      // Get nearby doctors
      .addCase(getNearbyDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNearbyDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload;
      })
      .addCase(getNearbyDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch nearby doctors';
      });
  },
});

export const { clearError, setSearchFilters, clearDoctors } = userSlice.actions;
export default userSlice.reducer;