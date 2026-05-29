import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminAnalytics from "./pages/Analytics";
import ProjectDetails from "./pages/ProjectDetails";
import AdminProjectDetails from "./pages/AdminProjectDetails";
import Certificate from "./pages/certificate";
import AdminSubmissions from "./pages/AdminSubmissions";
import QuizList from "./pages/QuizList";
import QuizPage from "./pages/QuizPage";
import AdminQuizzes from "./pages/AdminQuizzes";
import StudyMaterials from "./pages/StudyMaterials";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
     <Route path="/certificate" element={<Certificate />} />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />

      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/project/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProjectDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <QuizList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:id"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quizzes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminQuizzes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-materials"
        element={
          <ProtectedRoute>
            <StudyMaterials />
          </ProtectedRoute>
        }
      />
      <Route
  path="/admin/submissions"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminSubmissions />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;