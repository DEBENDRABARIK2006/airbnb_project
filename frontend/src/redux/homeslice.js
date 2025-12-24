import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true;
const API_URL ="https://airbnb-project-2bb9.vercel.app" || "http://localhost:3004";

// ✅ Fetch all homes
export const fetchHomes = createAsyncThunk(
  "homes/fetchHomes",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/`, { withCredentials: true });
      return Array.isArray(res.data.home) ? res.data.home : [];
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        typeof errorData === "object"
          ? errorData.errormessage || JSON.stringify(errorData)
          : err.message || "Failed to fetch homes"
      );
    }
  }
);

// ✅ Add a new home
export const addHome = createAsyncThunk(
  "homes/addHome",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/host/addhome`, data, {
        withCredentials: true,
      });
      return res.data.home ? [res.data.home] : [];
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        typeof errorData === "object"
          ? errorData.errormessage || JSON.stringify(errorData)
          : err.message || "Failed to add home"
      );
    }
  }
);

const homeSlice = createSlice({
  name: "homes",
  initialState: {
    homes: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomes.fulfilled, (state, action) => {
        state.loading = false;
        state.homes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchHomes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch homes";
        state.homes = [];
      })
      .addCase(addHome.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.homes = [...state.homes, ...action.payload];
        }
      })
      .addCase(addHome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add home";
      });
  },
});

export default homeSlice.reducer;
