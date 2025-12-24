import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true;
const API_URL ="https://airbnb-project-2bb9.vercel.app" || "http://localhost:3004";

// ✅ Fetch all favourites
export const fetchFavourite = createAsyncThunk(
  "favourite/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/favourite`, {
        withCredentials: true,
      });
      return res.data.favourite || [];
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        typeof errorData === "object"
          ? errorData.errormessage || JSON.stringify(errorData)
          : err.message || "Failed to fetch favourites"
      );
    }
  }
);

// ✅ Add to favourites
export const addFavourite = createAsyncThunk(
  "favourite/add",
  async (homeId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/favourite/${homeId}`, {}, { withCredentials: true });
      return res.data.favourite || [];
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        typeof errorData === "object"
          ? errorData.errormessage || JSON.stringify(errorData)
          : err.message || "Failed to add favourite"
      );
    }
  }
);

// ✅ Remove from favourites
export const removeFavourite = createAsyncThunk(
  "favourite/remove",
  async (homeId, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/favourite/remove/${homeId}`, {}, { withCredentials: true });
      return res.data.favourite || [];
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        typeof errorData === "object"
          ? errorData.errormessage || JSON.stringify(errorData)
          : err.message || "Failed to remove favourite"
      );
    }
  }
);

const favouriteSlice = createSlice({
  name: "favourite",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavourite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavourite.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch favourites";
      })
      .addCase(addFavourite.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload)
          ? action.payload
          : state.items;
      })
      .addCase(removeFavourite.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload)
          ? action.payload
          : state.items;
      });
  },
});

export default favouriteSlice.reducer;
