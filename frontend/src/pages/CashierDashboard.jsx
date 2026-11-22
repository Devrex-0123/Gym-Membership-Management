import { Link } from 'react-router-dom';

const CashierDashboard = () => {
    let firstName = 'there';
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        firstName = userInfo?.full_name?.split(' ')[0] || firstName;
    } catch {
        firstName = 'there';
    }

    const modules = [
        {
            to: '/cashier/members',
            eyebrow: 'Member services',
            title: 'Search & manage members',
            description: 'Find current members, register someone new, or process a membership package.',
            icon: '◎',
            color: 'bg-[#FF8225] text-[#173B45]'
        },
        {
            to: '/cashier/point-of-sale',
            eyebrow: 'Point of sale',
            title: 'Process a walk-in',
            description: 'Choose a configured day-pass rate and record the payment method.',
            icon: '↗',
            color: 'bg-[#B43F3F] text-white'
        },
        {
            to: '/cashier/transactions',
            eyebrow: 'Today’s activity',
            title: 'Recent transactions',
            description: 'Review your five latest transactions recorded today.',
            icon: '▤',
            color: 'bg-[#173B45] text-white'
        }
    ];

    return (
        <>
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#173B45] px-6 py-8 text-white shadow-xl shadow-[#173B45]/10 sm:px-9 sm:py-10">
                <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[42px] border-white/[0.06]" />
                <div className="absolute -bottom-24 right-36 h-40 w-40 rounded-full bg-[#B43F3F]/30 blur-2xl" />
                <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB276]">Cashier overview</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {firstName}.</h1>
                        <p className="mt-2 text-sm text-white/60">Choose a workspace to get started with today’s front desk.</p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
                        <span className="h-2 w-2 rounded-full bg-[#FF8225]" />
                        {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </section>

            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-bold">Your modules</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Each task has its own focused workspace.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    {modules.map((module) => (
                        <Link
                            key={module.to}
                            to={module.to}
                            className="group rounded-2xl border border-[#173B45]/[0.06] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#173B45]/[0.08]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className={`${module.color} grid h-12 w-12 place-items-center rounded-xl text-xl font-black`}>{module.icon}</span>
                                <span className="text-lg font-bold text-[#173B45]/35 transition group-hover:translate-x-1 group-hover:text-[#B43F3F]">→</span>
                            </div>
                            <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[#B43F3F]">{module.eyebrow}</p>
                            <h3 className="mt-2 text-xl font-black">{module.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#173B45]/60">{module.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
};

export default CashierDashboard;
