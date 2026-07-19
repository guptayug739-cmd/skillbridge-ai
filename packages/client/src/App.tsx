import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAppSelector } from './hooks/useAppSelector';
import { useEffect, lazy } from 'react';
import { useAppDispatch } from './hooks/useAppDispatch';
import { getMe } from './store/slices/authSlice';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';

const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const FreelancerDashboard = lazy(() => import('./pages/freelancer/Dashboard'));
const EditProfile = lazy(() => import('./pages/freelancer/EditProfile'));
const PortfolioManagement = lazy(() => import('./pages/freelancer/Portfolio'));
const SkillsEducation = lazy(() => import('./pages/freelancer/SkillsEducation'));
const ProposalHistory = lazy(() => import('./pages/freelancer/ProposalHistory'));
const WalletPage = lazy(() => import('./pages/freelancer/Wallet'));
const AIResumeReview = lazy(() => import('./pages/freelancer/AIResumeReview'));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const CreateProject = lazy(() => import('./pages/client/CreateProject'));
const ManageProjects = lazy(() => import('./pages/client/ManageProjects'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const FreelancerProfile = lazy(() => import('./pages/FreelancerProfile'));
const Chat = lazy(() => import('./pages/Chat'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const ContractDetail = lazy(() => import('./pages/ContractDetail'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminProjects = lazy(() => import('./pages/admin/Projects'));
const AdminDisputes = lazy(() => import('./pages/admin/Disputes'));
const AdminCompanies = lazy(() => import('./pages/admin/Companies'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
  </div>
);

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function DashboardRouter() {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role === 'FREELANCER') return <FreelancerDashboard />;
  if (role === 'CLIENT') return <ClientDashboard />;
  if (role === 'ADMIN') return <AdminDashboard />;
  return <Navigate to="/" replace />;
}

export default function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getMe());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<PrivateRoute roles={['CLIENT']}><CreateProject /></PrivateRoute>} />
            <Route path="projects/manage" element={<PrivateRoute roles={['CLIENT']}><ManageProjects /></PrivateRoute>} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="freelancers/:id" element={<FreelancerProfile />} />

            <Route path="dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
            <Route path="notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            <Route path="saved" element={<PrivateRoute><SavedPage /></PrivateRoute>} />
            <Route path="contracts/:id" element={<PrivateRoute><ContractDetail /></PrivateRoute>} />
            <Route path="profile/edit" element={<PrivateRoute roles={['FREELANCER']}><EditProfile /></PrivateRoute>} />
            <Route path="portfolio" element={<PrivateRoute roles={['FREELANCER']}><PortfolioManagement /></PrivateRoute>} />
            <Route path="skills-education" element={<PrivateRoute roles={['FREELANCER']}><SkillsEducation /></PrivateRoute>} />
            <Route path="proposals" element={<PrivateRoute roles={['FREELANCER']}><ProposalHistory /></PrivateRoute>} />
            <Route path="wallet" element={<PrivateRoute roles={['FREELANCER']}><WalletPage /></PrivateRoute>} />
            <Route path="ai/resume-review" element={<PrivateRoute roles={['FREELANCER']}><AIResumeReview /></PrivateRoute>} />

            <Route path="chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="chat/:contractId" element={<PrivateRoute><Chat /></PrivateRoute>} />

            <Route path="admin/users" element={<PrivateRoute roles={['ADMIN']}><AdminUsers /></PrivateRoute>} />
            <Route path="admin/projects" element={<PrivateRoute roles={['ADMIN']}><AdminProjects /></PrivateRoute>} />
            <Route path="admin/disputes" element={<PrivateRoute roles={['ADMIN']}><AdminDisputes /></PrivateRoute>} />
            <Route path="admin/companies" element={<PrivateRoute roles={['ADMIN']}><AdminCompanies /></PrivateRoute>} />
            <Route path="admin/payments" element={<PrivateRoute roles={['ADMIN']}><AdminPayments /></PrivateRoute>} />
            <Route path="admin/audit-logs" element={<PrivateRoute roles={['ADMIN']}><AdminAuditLogs /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
