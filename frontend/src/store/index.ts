import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import appointmentSlice from './slices/appointmentSlice';
import userSlice from './slices/userSlice';
import notificationSlice from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    appointments: appointmentSlice,
    user: userSlice,
    notifications: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;