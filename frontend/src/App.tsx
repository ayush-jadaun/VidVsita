import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/store";
import type { AppDispatch } from "./store/store";
import AuthPage from "./pages/authPages/authPage";
import { logoutUser, refreshAccessToken } from "./store/slices/authSlice";

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800">Welcome to Homepage</h1>
      <p className="mt-4 text-gray-600">
        You're logged in successfully, {user?.name}!
      </p>
      <button
        onClick={handleLogout}
        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    dispatch(refreshAccessToken());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={
            !isAuthenticated ? <AuthPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? <HomePage /> : <Navigate to="/auth" replace />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
