import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  id: string;
  name: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const loadAuthState = () => {
  try {
    const serializedAuth = localStorage.getItem("authState");
    if (serializedAuth === null) {
      return undefined;
    }
    return JSON.parse(serializedAuth);
  } catch (err) {
    return undefined;
  }
};

const initialState: AuthState = loadAuthState() || {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const API_URL = "http://localhost:3000/api/auth";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: { name: string; username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData, {
        withCredentials: true,
      });
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials, {
        withCredentials: true,
      });
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/refresh-token`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Token refresh failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("authState", JSON.stringify(state));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authState");
    },
  },
  extraReducers: (builder) => {
    // Register cases
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      localStorage.setItem("authState", JSON.stringify(state));
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login cases
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      localStorage.setItem("authState", JSON.stringify(state));
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout cases
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authState");
    });

    // Refresh token cases
    builder.addCase(refreshAccessToken.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      localStorage.setItem("authState", JSON.stringify(state));
    });
    builder.addCase(refreshAccessToken.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem("authState");
    });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
