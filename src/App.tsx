
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { OnboardingModal } from "@/components/OnboardingModal";

import MainLayout from "@/components/MainLayout";
import IndexPage from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import TemplatesPage from "@/pages/TemplatesPage";
import SeoGeneratorTemplate from "@/pages/templates/SeoGeneratorTemplate";
import DeepThinkingTemplate from "@/pages/templates/DeepThinkingTemplate";
import ContentPage from "@/pages/ContentPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import BulkBlogGeneratorTemplate from "@/pages/templates/BulkBlogGeneratorTemplate";

import "./App.css";

// Create a client
const queryClient = new QueryClient();

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<IndexPage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route
                  path="templates/all-in-one-seo"
                  element={<SeoGeneratorTemplate />}
                />
                <Route
                  path="templates/article-generator"
                  element={<SeoGeneratorTemplate />}
                />
                <Route
                  path="templates/deep-thinking"
                  element={<DeepThinkingTemplate />}
                />
                <Route
                  path="templates/bulk-blog-generator"
                  element={<BulkBlogGeneratorTemplate />}
                />
                <Route path="content" element={<ContentPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
          <SonnerToaster position="bottom-right" />
          <OnboardingModal 
            open={showOnboarding} 
            onOpenChange={setShowOnboarding}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
