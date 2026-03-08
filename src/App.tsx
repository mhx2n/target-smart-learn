import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "@/layouts/PublicLayout";
import StudentLayout from "@/layouts/StudentLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Public pages
import Index from "./pages/Index";
import ExamsPage from "./pages/ExamsPage";
import ExamDetails from "./pages/ExamDetails";
import NoticesPage from "./pages/NoticesPage";
import NoticeDetails from "./pages/NoticeDetails";
import AboutContact from "./pages/AboutContact";
import NotFound from "./pages/NotFound";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentExams from "./pages/student/StudentExams";
import StudentExamDetails from "./pages/student/StudentExamDetails";
import StudentExamAttempt from "./pages/student/StudentExamAttempt";
import StudentResult from "./pages/student/StudentResult";
import StudentNotices from "./pages/student/StudentNotices";
import StudentProfile from "./pages/student/StudentProfile";

// Admin pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminExams from "./pages/admin/AdminExams";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminCSVUpload from "./pages/admin/AdminCSVUpload";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exams/:id" element={<ExamDetails />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/notices/:id" element={<NoticeDetails />} />
            <Route path="/about" element={<AboutContact />} />
          </Route>

          {/* Student routes */}
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/exams" element={<StudentExams />} />
            <Route path="/student/exams/:id" element={<StudentExamDetails />} />
            <Route path="/student/exams/:id/attempt" element={<StudentExamAttempt />} />
            <Route path="/student/results" element={<StudentResult />} />
            <Route path="/student/notices" element={<StudentNotices />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          {/* Admin routes — hidden from public UI */}
          <Route path="/secure-admin-login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/upload-csv" element={<AdminCSVUpload />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
