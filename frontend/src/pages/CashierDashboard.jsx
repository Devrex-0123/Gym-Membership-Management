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
            title: 'Member services',
            description: 'Find members, register someone new, or sell a membership.'
        },
        {
            to: '/cashier/check-in',
            title: 'Check-in',
            description: 'Scan a member QR code or enter a member code.'
        },
        {
            to: '/cashier/point-of-sale',
            title: 'Walk-in POS',
            description: 'Sell a day pass and record the payment method.'
        },
        {
            to: '/cashier/transactions',
            title: 'Transactions',
            description: 'Review your latest transactions today.'
        }
    ];

    return (
        <>
            <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {firstName}.</h1>
                    <p className="mt-2 text-sm text-neutral-500">Pick a task to get started.</p>
                </div>
                <p className="text-sm text-neutral-500">
                    {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </section>

            <section className="grid gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
                {modules.map((module) => (
                    <Link
                        key={module.to}
                        to={module.to}
                        className="group flex items-start justify-between gap-4 bg-white p-6 transition-colors hover:bg-neutral-50"
                    >
                        <div>
                            <h2 className="font-medium">{module.title}</h2>
                            <p className="mt-1 text-sm text-neutral-500">{module.description}</p>
                        </div>
                        <span aria-hidden="true" className="text-neutral-400 transition-colors group-hover:text-neutral-900">→</span>
                    </Link>
                ))}
            </section>
        </>
    );
};

export default CashierDashboard;
