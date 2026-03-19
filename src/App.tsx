import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BusinessWidget from "./pages/BusinessWidget";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import GymLandingPage from "./pages/GymLandingPage";
import Book from "./pages/Book";
import BookCall from "./pages/BookCall";
import BookThankYou from "./pages/BookThankYou";
import Booking from "./pages/Booking";
import ScheduleDemo from "./pages/ScheduleDemo";
import { Onboarding } from "./pages/wellness/Onboarding";
import { BusinessProfile } from "./pages/wellness/BusinessProfile";
import { DashboardLayout } from "./components/wellness/layout/DashboardLayout";
import { DashboardHome } from "./pages/wellness/dashboard/DashboardHome";
import { DashboardVault } from "./pages/wellness/dashboard/DashboardVault";
import { ComplianceCalendar } from "./pages/wellness/dashboard/ComplianceCalendar";
import { WebsiteCompliancePage } from "./pages/wellness/dashboard/WebsiteCompliancePage";
import { TrademarkScanPage } from "./pages/wellness/dashboard/TrademarkScanPage";
import { Login } from "./pages/wellness/Login";
import { ResetPassword } from "./pages/wellness/ResetPassword";
import { AdminDashboard } from "./pages/wellness/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gyms" element={<GymLandingPage />} />
            <Route path="/book" element={<Book />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/schedule-demo" element={<ScheduleDemo />} />
            <Route path="/call" element={<BookCall />} />
            <Route path="/book-call" element={<BookCall />} />
            <Route path="/book-thank-you" element={<BookThankYou />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lead-scraper" element={<Dashboard />} />
            <Route path="/business-widget" element={<BusinessWidget />} />
            {/* Wellness Dashboard Routes */}
            {/* Wellness Dashboard Routes */}
            <Route path="/wellness/login" element={<Login />} />
            <Route path="/wellness/onboarding" element={<Onboarding />} />
            <Route path="/wellness/reset-password" element={<ResetPassword />} />
            <Route path="/wellness/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />

            {/* New Nested Dashboard Layout */}
            <Route path="/wellness/dashboard" element={<DashboardLayout><Outlet /></DashboardLayout>}>
              <Route index element={<DashboardHome />} />
              <Route path="documents" element={<DashboardVault />} />
              <Route path="website-compliance" element={<WebsiteCompliancePage />} />
              <Route path="trademark-scan" element={<TrademarkScanPage />} />
              <Route path="compliance" element={<ComplianceCalendar />} />
              <Route path="profile" element={<BusinessProfile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

