
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import TemplatesPage from "@/pages/TemplatesPage";
import ContentPage from "@/pages/ContentPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";
import SeoGeneratorTemplate from "./pages/templates/SeoGeneratorTemplate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/templates" element={<MainLayout><TemplatesPage /></MainLayout>} />
            <Route path="/content" element={<MainLayout><ContentPage /></MainLayout>} />
            <Route path="/history" element={<MainLayout><HistoryPage /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
            
            {/* Template Routes */}
            <Route path="/templates/all-in-one-seo" element={<MainLayout><SeoGeneratorTemplate /></MainLayout>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
