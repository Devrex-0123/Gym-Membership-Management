import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const AdminDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [summaryError, setSummaryError] = useState('');

    useEffect(() => {
        const fetchDailySummary = async () => {
            try {
                const { data } = await API.get('/transactions/summary');
                setSummary(data);
            } catch (err) {
                setSummaryError(err.response?.data?.message || 'Unable to load today’s summary.');
            }
        };

        void fetchDailySummary();
    }, []);

    let firstName = 'Admin';
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        firstName = userInfo?.full_name?.split(' ')[0] || firstName;
    } catch {
        firstName = 'Admin';
    }

    const stats = [
        { label: 'Revenue', value: summary ? `₱${Number(summary.total_revenue).toLocaleString('en-PH')}` : '—' },
        { label: 'Walk-ins', value: summary?.total_walk_ins ?? '—' },
        { label: 'New memberships', value: summary?.total_new_members ?? '—' },
        { label: 'Renewals', value: summary?.total_renewals ?? '—' }
    ];

    const shortcuts = [
        { label: 'Cashier accounts', to: '/admin/cashiers' },
        { label: 'Pricing & plans', to: '/admin/pricing' },
        { label: 'Reports', to: '/admin/reports' },
        { label: 'Renewals', to: '/admin/renewals' }
    ];

    return (
        <>
            <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Good day, {firstName}.</h1>
                    <p className="mt-2 text-sm text-neutral-500">Today’s gym activity.</p>
                </div>
                <p className="text-sm text-neutral-500">
                    {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </section>

            <section aria-label="Today's gym summary">
                {summaryError && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{summaryError}</p>}
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white p-5">
                            <p className="text-sm text-neutral-500">{stat.label}</p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{summary ? stat.value : '—'}</p>
                        </div>
                    ))}
                </div>
                <p className="mt-3 text-xs text-neutral-400">{summary ? 'Totals for today' : summaryError ? 'Summary unavailable' : 'Loading today’s totals…'}</p>
            </section>

            <section>
                <h2 className="text-sm font-medium text-neutral-500">Shortcuts</h2>
                <ul className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
                    {shortcuts.map((item) => (
                        <li key={item.to}>
                            <Link to={item.to} className="flex items-center justify-between py-3 text-sm transition-colors hover:text-neutral-500">
                                {item.label}
                                <span aria-hidden="true" className="text-neutral-400">→</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
};

export default AdminDashboard;
