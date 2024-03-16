import { create } from "zustand";
import { createEditFormSlice } from "./slice/editForm.slice";

export const useEditFormStore = create(createEditFormSlice);
