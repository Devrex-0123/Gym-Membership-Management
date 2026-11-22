import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const WORKSPACE_NAVIGATION = {
    admin: [
        { label: 'Overview', to: '/admin/dashboard', end: true },
        { label: 'Cashier accounts', to: '/admin/cashiers' },
        { label: 'Cashier directory', to: '/admin/cashier-directory' },
        { label: 'Pricing & plans', to: '/admin/pricing' },
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
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#F8EDED] text-[#173B45]">
            <header className="bg-[#173B45] text-white shadow-lg shadow-[#173B45]/10">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FF8225] font-black text-[#173B45]">GY</div>
                        <div>
                            <p className="font-bold tracking-tight">Forge Fitness</p>
                            <p className="text-xs capitalize text-white/55">{role} workspace</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold">{userInfo?.full_name || role}</p>
                            <p className="text-xs capitalize text-white/55">{userInfo?.role || role}</p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-bold text-[#FFB276]">
                            {(userInfo?.full_name || role).charAt(0).toUpperCase()}
                        </div>
                        <button onClick={handleLogout} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold transition hover:border-[#FF8225] hover:bg-white/5">
                            Log out
                        </button>
                    </div>
                </div>
                <nav aria-label={`${role} modules`} className="border-t border-white/10">
                    <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-8">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-[#FF8225] text-[#173B45]' : 'text-white/70 hover:bg-white/[0.08] hover:text-white'}`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </header>
            <main className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-8 sm:py-9">
                <Outlet />
                <footer className="pb-2 text-center text-xs text-[#173B45]/40">Forge Fitness · {role} workspace</footer>
            </main>
        </div>
    );
};

export default WorkspaceLayout;
