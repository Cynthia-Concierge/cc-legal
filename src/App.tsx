import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BusinessWidget from "./pages/BusinessWidget";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import { Onboarding } from "./pages/wellness/Onboarding";
import { BusinessProfile } from "./pages/wellness/BusinessProfile";
import { WellnessDashboard } from "./pages/wellness/WellnessDashboard";
import { Login } from "./pages/wellness/Login";

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
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lead-scraper" element={<Dashboard />} />
            <Route path="/business-widget" element={<BusinessWidget />} />
            {/* Wellness Dashboard Routes */}
            <Route path="/wellness/login" element={<Login />} />
            <Route path="/wellness/onboarding" element={<Onboarding />} />
            <Route path="/wellness/profile" element={<BusinessProfile />} />
            <Route path="/wellness/dashboard" element={<WellnessDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

