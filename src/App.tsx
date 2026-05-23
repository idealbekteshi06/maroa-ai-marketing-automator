import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import AnalyticsRouteListener from "@/components/AnalyticsRouteListener";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MaroaRoutes } from "@/v2/router";

const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Refund = lazy(() => import("./pages/Refund"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const DataDeletionStatus = lazy(() => import("./pages/DataDeletionStatus"));
const SocialCallback = lazy(() => import("./pages/SocialCallback"));
const Compare = lazy(() => import("./pages/Compare"));
const Strategy = lazy(() => import("./pages/Strategy"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AnalyticsRouteListener />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Legacy /dashboard → polished v2 shell (audit pass: single CTA, plain language, calmer UI) */}
              {/* Legacy dashboard fully retired — /app is the only dashboard */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />
              <Route path="/onboarding" element={<ProtectedRoute allowIncompleteOnboarding><Onboarding /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/data-deletion" element={<DataDeletion />} />
              <Route path="/delete-data" element={<DataDeletion />} />
              <Route path="/data-deletion-status" element={<DataDeletionStatus />} />
              <Route path="/social-callback" element={<SocialCallback />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/strategy" element={<ProtectedRoute><Strategy /></ProtectedRoute>} />
              <Route path="/app/*" element={<ProtectedRoute><MaroaRoutes /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </ErrorBoundary>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
