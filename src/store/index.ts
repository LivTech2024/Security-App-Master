import { create } from 'zustand';
import { createEditFormSlice } from './slice/editForm.slice';
import { createAuthSlice } from './slice/auth.slice';
import { createPaymentSlice } from './slice/payment.slice';

export const useEditFormStore = create(createEditFormSlice);

export const useAuthState = create(createAuthSlice);

export const usePaymentState = create(createPaymentSlice);
