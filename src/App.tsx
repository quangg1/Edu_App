import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LessonPlanner from "./pages/LessonPlanner";
import LessonPlanDetail from "./pages/LessonPlanDetail";
import TestBuilder from "./pages/TestBuilder";
import TestDetail from "./pages/TestDetail";
import RubricAssessment from "./pages/RubricAssessment";
import RubricDetail from "./pages/RubricDetail";
import LearningHub from "./pages/LearningHub";
import CourseDetail from "./pages/CourseDetail";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "./components/ui/toast";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MouseSparkleTrail from "./components/MouseSparkleTrail";
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster>
        <div className="relative min-h-screen">
          <div className="sparkle-bg" />
          <MouseSparkleTrail />

          {/* ✅ Router cho toàn bộ trang */}
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/lesson-planner" element={<LessonPlanner />} />
              <Route path="/lesson-planner/:id" element={<LessonPlanDetail />} />
              <Route path="/test-builder" element={<TestBuilder />} />
              <Route path="/test-builder/:id" element={<TestDetail />} />
              <Route path="/rubric-assessment" element={<RubricAssessment />} />
              <Route path="/rubric-assessment/:id" element={<RubricDetail />} />
              <Route path="/learning-hub" element={<LearningHub />} />
              <Route path="/learning-hub/:id" element={<CourseDetail />} />
              <Route path="/profile" element={<ProfilePage />} />
              
            </Routes>
          </Router>

          {/* ✅ Toast notification */}
          <Sonner />
        </div>
        </Toaster >
      </TooltipProvider>
    </QueryClientProvider>
  );
}
