
import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
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
import WebSearchTemplate from "@/pages/templates/WebSearchTemplate";
import ContentPage from "@/pages/ContentPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import BulkBlogGeneratorTemplate from "@/pages/templates/BulkBlogGeneratorTemplate";
import FreeSeoGeneratorTemplate from "./pages/templates/FreeSeoGeneratorTemplate";
import ProductRoundupTemplate from "./pages/templates/ProductRoundupTemplate";

import "./App.css";

const queryClient = new QueryClient();

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <AuthProvider>
          <RouterProvider
            router={createBrowserRouter([
              {
                path: "/",
                element: <MainLayout />,
                errorElement: <NotFound />,
                children: [
                  {
                    path: "",
                    element: <Navigate to="/dashboard" replace />,
                  },
                  {
                    path: "dashboard",
                    element: <Dashboard />,
                  },
                  {
                    path: "templates",
                    element: <TemplatesPage />,
                  },
                  {
                    path: "templates/all-in-one-seo",
                    element: <SeoGeneratorTemplate />,
                  },
                  {
                    path: "templates/free-seo-generator",
                    element: <FreeSeoGeneratorTemplate />,
                  },
                  {
                    path: "templates/article-generator",
                    element: <SeoGeneratorTemplate />,
                  },
                  {
                    path: "templates/web-search",
                    element: <WebSearchTemplate />,
                  },
                  {
                    path: "templates/deep-thinking",
                    element: <DeepThinkingTemplate />,
                  },
                  {
                    path: "templates/bulk-blog-generator",
                    element: <BulkBlogGeneratorTemplate />,
                  },
                  {
                    path: "templates/product-roundup",
                    element: <ProductRoundupTemplate />,
                  },
                  {
                    path: "history",
                    element: <HistoryPage />,
                  },
                  {
                    path: "content",
                    element: <ContentPage />,
                  },
                  {
                    path: "settings",
                    element: <SettingsPage />,
                  },
                ],
              },
              {
                path: "/auth",
                element: <AuthPage />,
              },
            ])}
          />
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
