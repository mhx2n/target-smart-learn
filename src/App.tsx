import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import ExamsPage from "./pages/ExamsPage";
import ExamDetails from "./pages/ExamDetails";
import ExamAttempt from "./pages/ExamAttempt";
import ResultPage from "./pages/ResultPage";
import NoticesPage from "./pages/NoticesPage";
import NoticeDetails from "./pages/NoticeDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exams/:id" element={<ExamDetails />} />
          <Route path="/exams/:id/attempt" element={<ExamAttempt />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/notices/:id" element={<NoticeDetails />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
