
import { Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ContentPage from "./pages/ContentPage";
import SettingsPage from "./pages/SettingsPage";
import TemplatesPage from "./pages/TemplatesPage";
import SeoGeneratorTemplate from "./pages/templates/SeoGeneratorTemplate";
import FreeSeoGeneratorTemplate from "./pages/templates/FreeSeoGeneratorTemplate";
import WebSearchTemplate from "./pages/templates/WebSearchTemplate";
import DeepThinkingTemplate from "./pages/templates/DeepThinkingTemplate";
import BulkBlogGeneratorTemplate from "./pages/templates/BulkBlogGeneratorTemplate";
import ProductRoundupTemplate from "./pages/templates/ProductRoundupTemplate";
import LowAiHumanizedTemplate from "./pages/templates/LowAiHumanizedTemplate";
import PricingPage from "./pages/PricingPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import NotFound from "./pages/NotFound";
import "./App.css";
import MainLayout from "./components/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { PremiumProvider } from "./context/PremiumContext";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <PremiumProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/templates/all-in-one-seo" element={<SeoGeneratorTemplate />} />
              <Route path="/templates/free-seo-generator" element={<FreeSeoGeneratorTemplate />} />
              <Route path="/templates/article-generator" element={<SeoGeneratorTemplate />} />
              <Route path="/templates/web-search" element={<WebSearchTemplate />} />
              <Route path="/templates/product-roundup" element={<ProductRoundupTemplate />} />
              <Route path="/templates/deep-thinking" element={<DeepThinkingTemplate />} />
              <Route path="/templates/bulk-blog-generator" element={<BulkBlogGeneratorTemplate />} />
              <Route path="/templates/low-ai-humanized" element={<LowAiHumanizedTemplate />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
          <Toaster />
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
