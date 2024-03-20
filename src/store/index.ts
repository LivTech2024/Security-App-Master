import { create } from "zustand";
import { createEditFormSlice } from "./slice/editForm.slice";
import { createAuthSlice } from "./slice/auth.slice";

export const useEditFormStore = create(createEditFormSlice);

export const useAuthState = create(createAuthSlice);
