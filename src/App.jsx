import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import Signup from './pages/Signup';

import { AuthProvider, useAuth } from './AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Navigate to="/profile" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/workout"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Workout />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/diet"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Diet />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Feedback />
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
