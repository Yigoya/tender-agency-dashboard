import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import agencyReducer from './slices/agencySlice';
import tenderReducer from './slices/tenderSlice';

export const store = configureStore({
  reducer: {
    agency: agencyReducer,
    tender: tenderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;