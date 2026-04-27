import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MapView from "./pages/MapView";
import ReportIssue from "./pages/ReportIssue";
import ReportViolation from "./pages/ReportViolation";
import ComplaintDetails from "./pages/ComplaintDetails";
import TrackComplaint from "./pages/TrackComplaint";
import TrackDetail from "./pages/TrackDetail";
import NotificationPage from "./pages/NotificationPage";
import UserResolved from "./pages/userResolved.jsx";
import ChatPage from "./pages/ChatPage.jsx";
/*Department pages Import*/

import DeptDashboard from "./department_pages/department_dashboard";
import AssignedTasks from "./department_pages/assigned_task";
import SubmitProof from "./department_components/SubmitProof";
import DepartmentNotifications from "./department_pages/DeptNotifications";
import WorkLog from "./department_pages/deptWorkLog";
import Performance from "./department_pages/departmentPerformance";
import DepartmentProof from "./department_pages/departmentProof.jsx";


/*Admin pages Import */
import AdminDashboard from "./admin_pages/AdminDashboard";
import AdminUsers from "./admin_pages/AdminUsers";
import AdminTasks from "./admin_pages/AdminTasks";
import AdminDepartments from "./admin_pages/adminDepartments";
import AdminDepartmentDetail from "./admin_pages/AdminDepartmentDetail";
import AdminPerformance from "./admin_pages/AdminPerformance";
import AdminTaskDetail from "./admin_pages/AdminTaskDetail";
import AdminTrack from "./admin_pages/AdminTrack";
import AdminActivity from "./admin_pages/AdminActivity";
import AdminNotifications from "./admin_pages/AdminNotifications"
import AdminResolved from "./admin_pages/AdminResolved.jsx";







// ✅ Temporary placeholders (only for missing pages)

const Resolved = () => (
  <h1 className="p-6 text-xl">Resolved Issues</h1>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* 🏠 MAIN */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* 📌 FEATURES */}
        <Route path="/report-issue" element={<ReportIssue />} />
        <Route path="/report-violation" element={<ReportViolation />} />
        <Route path="/map-view" element={<MapView />} />
        <Route path="/track-complaint" element={<TrackComplaint />} />
        <Route path="/track-detail/:mode/:id" element={<TrackDetail />} />
        <Route path="/resolved" element={<UserResolved />} />
        <Route path="/complaint" element={<ComplaintDetails />} />
        <Route path="/notifications/:id" element={<NotificationPage />} />
        <Route path="/chat" element={<ChatPage />} />



            {/* 📌 Department pages */}
            <Route path="/dept_dash" element={<DeptDashboard />} />
            <Route path="/dept_tasks" element={<AssignedTasks />} />
            <Route path="/submit-proof/:type/:id" element={<SubmitProof />} />
            <Route path="/dept_notifications/:id" element={<DepartmentNotifications />} />
            <Route path="/dept_worklog/:id" element={<WorkLog />} />
            <Route path="/dept_performance/:id" element={<Performance />} />
            <Route path="/dept_proofs/:id" element={<DepartmentProof />} />




             {/* 📌 Admin  pages */}
            <Route path="/admin_dash" element={<AdminDashboard />} />
            <Route path="/admin_users" element={<AdminUsers />} />
            <Route path="/admin_tasks" element={<AdminTasks />} />
            <Route path="/admin_dept" element={<AdminDepartments />} />
            <Route path="/admin_dept_detail/:id" element={<AdminDepartmentDetail />} />
            <Route path="/admin_performance/:id" element={<AdminPerformance />} />
            <Route path="/admin-task/:type/:id" element={<AdminTaskDetail />} />
            <Route path="/admin-track/:type/:id" element={<AdminTrack />} />
            <Route path="/admin-Activity/:id" element={<AdminActivity />} />
            <Route path="/admin_notifications/:id" element={<AdminNotifications />} />
            <Route path="/admin_resolved" element={<AdminResolved />} />


            {/* common Page */}
           






       

        {/* 🔄 FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;