import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RadioProvider } from "@/contexts/RadioContext";
import { DataSavingProvider } from "@/contexts/DataSavingContext";
import { useRealtimeArticles } from "@/hooks/useRealtimeArticles";
import { usePageTracking } from "@/hooks/usePageTracking";
import SettingsInjector from "@/components/SettingsInjector";
import Index from "./pages/Index";

// Code-split heavy routes and the radio stack (hls.js ~229KB).
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SectionPage = lazy(() => import("./pages/SectionPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RadioPanel = lazy(() => import("@/components/RadioPanel"));
const MiniPlayer = lazy(() => import("@/components/radio/MiniPlayer"));
const KeyboardShortcuts = lazy(() => import("@/components/radio/KeyboardShortcuts"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

function RealtimeSubscriber() {
  useRealtimeArticles();
  return null;
}

function RouteTracker() {
  usePageTracking();
  return null;
}

const routerBasename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <DataSavingProvider>
          <RadioProvider>
            <Sonner />
            <SettingsInjector />
            <Suspense fallback={null}><KeyboardShortcuts /></Suspense>
            <RealtimeSubscriber />
            <BrowserRouter basename={routerBasename}>
              <ScrollToTop />
              <RouteTracker />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/page/:page" element={<Index />} />
                  <Route path="/article/:slug" element={<ArticlePage />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/section/:section" element={<SectionPage />} />
                  <Route path="/section/:section/page/:page" element={<SectionPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Suspense fallback={null}><RadioPanel /></Suspense>
            <Suspense fallback={null}><MiniPlayer /></Suspense>
          </RadioProvider>
        </DataSavingProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
