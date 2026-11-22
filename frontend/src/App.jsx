import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import MemberLogin from './pages/MemberLogin';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PricingManagement from './pages/PricingManagement';
import AdminReports from './pages/AdminReports';
import AdminAttendance from './pages/AdminAttendance';
import RenewalReminders from './pages/RenewalReminders';
import CashierDashboard from './pages/CashierDashboard';
import CashierManagement from './pages/CashierManagement';
import CashierDirectory from './pages/CashierDirectory';
import MemberManagement from './pages/MemberManagement';
import MemberDirectory from './pages/MemberDirectory';
import PointOfSale from './pages/PointOfSale';
import TransactionHistory from './pages/TransactionHistory';
import CheckIn from './pages/CheckIn';
import WorkspaceLayout from './components/WorkspaceLayout';

// Simple Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/' }) => {
    let userInfo = null;

    try {
        const storedUser = localStorage.getItem('userInfo');
        userInfo = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        localStorage.removeItem('userInfo');
    }
    
    if (!userInfo) {
        return <Navigate to="/" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return children || <Outlet />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/member/login" element={<MemberLogin />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<WorkspaceLayout role="admin" />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="cashiers" element={<CashierManagement />} />
                        <Route path="cashier-directory" element={<CashierDirectory />} />
                        <Route path="pricing" element={<PricingManagement />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="attendance" element={<AdminAttendance />} />
                        <Route path="renewals" element={<RenewalReminders />} />
                    </Route>
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['cashier', 'admin']} />}>
                    <Route path="/cashier" element={<WorkspaceLayout role="cashier" />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<CashierDashboard />} />
                        <Route path="members" element={<MemberManagement />} />
                        <Route element={<ProtectedRoute allowedRoles={['cashier']} redirectTo="/admin/dashboard" />}>
                            <Route path="member-directory" element={<MemberDirectory />} />
                        </Route>
                        <Route path="check-in" element={<CheckIn />} />
                        <Route path="renewals" element={<RenewalReminders />} />
                        <Route path="point-of-sale" element={<PointOfSale />} />
                        <Route path="transactions" element={<TransactionHistory />} />
                    </Route>
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['member']} />}>
                    <Route path="/member/dashboard" element={<MemberDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;