import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const WORKSPACE_NAVIGATION = {
    admin: [
        { label: 'Overview', to: '/admin/dashboard', end: true },
        { label: 'Cashier accounts', to: '/admin/cashiers' },
        { label: 'Cashier directory', to: '/admin/cashier-directory' },
        { label: 'Pricing & plans', to: '/admin/pricing' },
        { label: 'Expenses', to: '/admin/expenses' },
        { label: 'Renewals', to: '/admin/renewals' },
        { label: 'Reports', to: '/admin/reports' },
        { label: 'Attendance', to: '/admin/attendance' }
    ],
    cashier: [
        { label: 'Overview', to: '/cashier/dashboard', end: true },
        { label: 'Member services', to: '/cashier/members' },
        { label: 'Member directory', to: '/cashier/member-directory', allowedRoles: ['cashier'] },
        { label: 'Check-in', to: '/cashier/check-in' },
        { label: 'Renewals', to: '/cashier/renewals' },
        { label: 'Walk-in POS', to: '/cashier/point-of-sale' },
        { label: 'Transactions', to: '/cashier/transactions' }
    ]
};

const navLinkClass = ({ isActive }) =>
    `block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
        isActive ? 'bg-neutral-100 font-medium text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
    }`;

const WorkspaceLayout = ({ role }) => {
    const navigate = useNavigate();
    const userInfo = (() => {
        try {
            const storedUser = localStorage.getItem('userInfo');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    })();
    const navigation = WORKSPACE_NAVIGATION[role].filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(userInfo?.role)
    );

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/staff/login');
    };

    const userName = userInfo?.full_name || role;
    const userRole = userInfo?.role || role;

    return (
        <div className="min-h-screen bg-white text-neutral-900 lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 lg:sticky lg:top-0 lg:flex lg:h-screen">
                <div className="px-6 py-6">
                    <BrandLogo subtitle={`${role} workspace`} />
                </div>
                <nav aria-label={`${role} modules`} className="flex-1 space-y-0.5 overflow-y-auto px-3">
                    {navigation.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="border-t border-neutral-200 px-6 py-5">
                    <p className="truncate text-sm font-medium">{userName}</p>
                    <p className="text-xs capitalize text-neutral-500">{userRole}</p>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                        Log out
                    </button>
                </div>
            </aside>

            {/* Mobile header */}
            <header className="border-b border-neutral-200 lg:hidden">
                <div className="flex items-center justify-between px-4 py-4 sm:px-6">
                    <BrandLogo subtitle={`${role} workspace`} />
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                        Log out
                    </button>
                </div>
                <nav aria-label={`${role} modules`} className="flex gap-1 overflow-x-auto px-2 pb-3 sm:px-4">
                    {navigation.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </header>

            <main className="min-w-0 flex-1">
                <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default WorkspaceLayout;
