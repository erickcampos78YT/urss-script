import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyScripts from './pages/MyScripts';
import SubmitScript from './pages/SubmitScript';
import ScriptDetail from './pages/ScriptDetail';
import Profile from './pages/Profile';
import LiquidGlass from './components/LiquidGlass';
import ThemeToggle from './components/ThemeToggle';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { theme, getThemeClasses } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-dark-gray' : 'bg-transparent'} text-white relative`}>
      {theme === 'liquid-glass' && <LiquidGlass />}
      <Navbar />
      <main className={`container mx-auto px-4 py-8 relative z-10 ${getThemeClasses('rounded-lg')}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/script/:id" element={<ScriptDetail />} />
          <Route
            path="/my-scripts"
            element={
              <PrivateRoute>
                <MyScripts />
              </PrivateRoute>
            }
          />
          <Route
            path="/submit-script"
            element={
              <PrivateRoute>
                <SubmitScript />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      <SpeedInsights />
      <ThemeToggle />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;