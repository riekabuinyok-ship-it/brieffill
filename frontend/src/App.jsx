import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { LogoSprite } from "./components/Logo";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewBrief from "./pages/NewBrief";
import BriefDetail from "./pages/BriefDetail";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import UserGuide from "./pages/UserGuide";
import Teams from "./pages/Teams";
import Integrations from "./pages/Integrations";
import Team from "./pages/Team";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import ApiKeys from "./pages/ApiKeys";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import Portal from "./pages/Portal";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Referrals from "./pages/Referrals";
import ReferralTerms from "./pages/ReferralTerms";
import Documentation from "./pages/Documentation";
import Values from "./pages/Values";
import HowItWorks from "./pages/HowItWorks";
import HelpCenter from "./pages/HelpCenter";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Community from "./pages/Community";
import Careers from "./pages/Careers";
import CareersApplication from "./pages/CareersApplication";
import PressKit from "./pages/PressKit";
import SampleReport from "./pages/SampleReport";

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public marketing pages */}
      <Route path="/" element={<MainLayout><Landing /></MainLayout>} />
      <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
      <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
      <Route path="/referral-terms" element={<MainLayout><ReferralTerms /></MainLayout>} />
      <Route path="/team" element={<MainLayout><Team /></MainLayout>} />
      <Route path="/portal/:token" element={<MainLayout><Portal /></MainLayout>} />
      <Route path="/pricing" element={<MainLayout><Pricing /></MainLayout>} />
      <Route path="/guide" element={<MainLayout><UserGuide /></MainLayout>} />
      <Route path="/docs" element={<MainLayout><Documentation /></MainLayout>} />
      <Route path="/values" element={<MainLayout><Values /></MainLayout>} />
      <Route path="/how-it-works" element={<MainLayout><HowItWorks /></MainLayout>} />
      <Route path="/help" element={<MainLayout><HelpCenter /></MainLayout>} />
      <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
      <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
      <Route path="/community" element={<MainLayout><Community /></MainLayout>} />
      <Route path="/careers" element={<MainLayout><Careers /></MainLayout>} />
      <Route path="/careers/:id" element={<MainLayout><CareersApplication /></MainLayout>} />
      <Route path="/press" element={<MainLayout><PressKit /></MainLayout>} />
      <Route path="/sample-report" element={<MainLayout><SampleReport /></MainLayout>} />

      {/* Protected routes with sidebar (Dashboard only) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />

      {/* Protected routes with sidebar (all authenticated pages) */}
      <Route path="/new" element={<ProtectedRoute><DashboardLayout><NewBrief /></DashboardLayout></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><DashboardLayout><Templates /></DashboardLayout></ProtectedRoute>} />
      <Route path="/templates/:id" element={<ProtectedRoute><DashboardLayout><TemplateDetail /></DashboardLayout></ProtectedRoute>} />
      <Route path="/brief/:id" element={<ProtectedRoute><DashboardLayout><BriefDetail /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><DashboardLayout><Subscription /></DashboardLayout></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><DashboardLayout><Teams /></DashboardLayout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><DashboardLayout><Integrations /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardLayout><Billing /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/referrals" element={<ProtectedRoute><DashboardLayout><Referrals /></DashboardLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
      <Route path="/api-keys" element={<ProtectedRoute><DashboardLayout><ApiKeys /></DashboardLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><DashboardLayout><Security /></DashboardLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LogoSprite />
      <ThemeProvider>
        <AuthProvider>
          <LocaleProvider>
            <AppRoutes />
          </LocaleProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
