import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, AppointmentStatus } from '../../types';

interface AppointmentState {
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await fetch(`/api/appointments${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    
    return response.json();
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData: any) => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(appointmentData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create appointment');
    }
    
    return response.json();
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointments/updateStatus',
  async ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) => {
    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update appointment status');
    }
    
    return response.json();
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async ({ appointmentId, reason }: { appointmentId: string; reason: string }) => {
    const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel appointment');
    }
    
    return response.json();
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.currentAppointment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.push(action.payload);
        state.currentAppointment = action.payload;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create appointment';
      })
      // Update appointment status
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?.id === action.payload.id) {
          state.currentAppointment = action.payload;
        }
      })
      // Cancel appointment
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      });
  },
});

export const { clearError, setCurrentAppointment } = appointmentSlice.actions;
export default appointmentSlice.reducer;