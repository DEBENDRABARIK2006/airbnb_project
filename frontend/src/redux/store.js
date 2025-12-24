import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authslice";
import homeReducer from "./homeslice";
import favouriteReducer from "./favouriteslice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    home: homeReducer,
    favourite: favouriteReducer,
  },
});
