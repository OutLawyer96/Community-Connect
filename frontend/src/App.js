import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import MainLayout from "./components/MainLayout";

// Page Components
import Home from "./pages/Home";
import Providers from "./pages/Providers";
import ProviderDetail from "./pages/ProviderDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnimationShowcase from "./components/animations/AnimationShowcase";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import MyReviews from "./pages/MyReviews";
import ProviderAnalytics from "./pages/ProviderAnalytics";
import UnclaimedProviders from "./pages/UnclaimedProviders";
import ClaimForm from "./pages/ClaimForm";
import MyClaims from "./pages/MyClaims";
import ClaimDetail from "./pages/ClaimDetail";
import AdminClaimManager from "./pages/AdminClaimManager";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";

// Route Guards
import PrivateRoute from "./components/Auth/PrivateRoute";
import AdminRoute from "./components/Auth/AdminRoute";

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/search" element={<Providers />} />
              <Route path="/providers/:id" element={<ProviderDetail />} />
              <Route path="/animations" element={<AnimationShowcase />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <EditProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <PrivateRoute>
                    <Favorites />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-reviews"
                element={
                  <PrivateRoute>
                    <MyReviews />
                  </PrivateRoute>
                }
              />
              <Route
                path="/provider-analytics"
                element={
                  <PrivateRoute>
                    <ProviderAnalytics />
                  </PrivateRoute>
                }
              />

              {/* Claims Routes */}
              <Route
                path="/unclaimed-providers"
                element={
                  <PrivateRoute>
                    <UnclaimedProviders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/claim-business"
                element={
                  <PrivateRoute>
                    <ClaimForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-claims"
                element={
                  <PrivateRoute>
                    <MyClaims />
                  </PrivateRoute>
                }
              />
              <Route
                path="/claims/:id"
                element={
                  <PrivateRoute>
                    <ClaimDetail />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/claims"
                element={
                  <AdminRoute>
                    <AdminClaimManager />
                  </AdminRoute>
                }
              />

              {/* Notification & Message Routes */}
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <Messages />
                  </PrivateRoute>
                }
              />

              {/* Catch-all route - redirect to home or show 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </MainLayout>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
