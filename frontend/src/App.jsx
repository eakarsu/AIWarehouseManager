import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// Layout
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import FloorPlans from './pages/FloorPlans';
import FloorPlanDetail from './pages/FloorPlanDetail';
import Rooms from './pages/Rooms';
import AIAnalysis from './pages/AIAnalysis';
import FullAnalysis from './pages/FullAnalysis';
import RoomDetector from './pages/RoomDetector';
import OptimizeLayout from './pages/OptimizeLayout';
import HomeStaging from './pages/HomeStaging';
import FurniturePlacer from './pages/FurniturePlacer';
import MaintenancePredictor from './pages/MaintenancePredictor';
import EnergyAuditor from './pages/EnergyAuditor';
import HomeInspector from './pages/HomeInspector';
import Suggestions from './pages/Suggestions';
import Estimates from './pages/Estimates';
import Dimensions from './pages/Dimensions';
import Contractors from './pages/Contractors';
import Templates from './pages/Templates';
import Designs from './pages/Designs';
import DesignDetail from './pages/DesignDetail';
import AIDesignTools from './pages/AIDesignTools';
import StylePresets from './pages/StylePresets';
import FurnitureCatalog from './pages/FurnitureCatalog';
import ColorPalettes from './pages/ColorPalettes';
import ARViewer from './pages/ARViewer';
import ShoppingLists from './pages/ShoppingLists';
import Inspirations from './pages/Inspirations';
import MaterialsPage from './pages/MaterialsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

// API
import * as api from './services/api';

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // After login, if on /login path and user is set, redirect to /
  useEffect(() => {
    if (user && (location.pathname === '/login' || location.pathname === '/forgot-password')) {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes wrapped in Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/floor-plans"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <FloorPlans />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/floor-plans/:id"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <FloorPlanDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Rooms />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-analysis"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <AIAnalysis />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/full-analyses"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <FullAnalysis />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/room-detection"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <RoomDetector />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/optimize-layout"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <OptimizeLayout />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/home-staging"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <HomeStaging />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/furniture-placement"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <FurniturePlacer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance-prediction"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <MaintenancePredictor />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/energy-audit"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <EnergyAuditor />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/home-inspection"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <HomeInspector />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suggestions"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Suggestions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Estimates />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dimensions"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Dimensions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractors"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Contractors />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Templates />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/designs"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Designs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/designs/:id"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <DesignDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-design"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <AIDesignTools />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/styles"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <StylePresets />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/furniture"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <FurnitureCatalog />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/palettes"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <ColorPalettes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ar"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <ARViewer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shopping"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <ShoppingLists />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspirations"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Inspirations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <MaterialsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <SubscriptionPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <AdminPanel />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to dashboard or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        const userData = res.data.user || res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for login events from the Login page (which sets localStorage directly)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Invalid JSON, ignore
        }
      } else if (!token) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // The Login component sets localStorage directly then navigates,
    // so we poll briefly to pick up the change within the same tab.
    const checkInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser && !user) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // Invalid JSON
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <AppRoutes user={user} setUser={setUser} />;
}

export default App;
