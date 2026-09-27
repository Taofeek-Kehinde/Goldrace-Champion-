import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import djReducer from '../features/djs/djSlice';
import coinClaimReducer from '../features/coins/coinClaimSlice';
import shoutoutReducer from '../features/shoutouts/shoutoutSlice';
import adminReducer from '../features/djs/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    djs: djReducer,
    coinClaim: coinClaimReducer,
    shoutouts: shoutoutReducer,
    admin: adminReducer,
  },
});