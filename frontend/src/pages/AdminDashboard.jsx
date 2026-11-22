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
        { label: 'Total revenue', value: summary ? `₱${Number(summary.total_revenue).toLocaleString('en-PH')}` : '—', accent: 'bg-[#FF8225]', icon: '₱' },
        { label: 'Walk-ins', value: summary?.total_walk_ins ?? '—', accent: 'bg-[#B43F3F]', icon: '↗' },
        { label: 'New memberships', value: summary?.total_new_members ?? '—', accent: 'bg-[#173B45]', icon: '+' },
        { label: 'Renewals', value: summary?.total_renewals ?? '—', accent: 'bg-[#FF8225]', icon: '↻' }
    ];

    return (
        <>
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin overview</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Good day, {firstName}.</h1>
                    <p className="mt-2 text-sm text-[#173B45]/60">A quick look at today’s gym activity.</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#173B45]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#173B45]/70">
                    <span className="h-2 w-2 rounded-full bg-[#FF8225]" />
                    {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </section>

            <section aria-label="Today's gym summary">
                <div className="mb-4">
                    <h2 className="text-lg font-bold">Today at a glance</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Live transaction totals for your gym</p>
                </div>
                {summaryError && <p role="alert" className="mb-4 rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm text-[#B43F3F]">{summaryError}</p>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <article key={stat.label} className="relative overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#173B45]/[0.07]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[#173B45]/55">{stat.label}</p>
                                    <p className="mt-4 text-3xl font-black tracking-tight">{summary ? stat.value : '—'}</p>
                                </div>
                                <span className={`${stat.accent} grid h-11 w-11 place-items-center rounded-xl text-lg font-black text-white`}>{stat.icon}</span>
                            </div>
                            <p className="mt-3 text-xs font-medium text-[#173B45]/45">{summary ? 'Today' : summaryError ? 'Summary unavailable' : 'Loading today’s totals…'}</p>
                            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.accent}`} />
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
                <Link to="/admin/cashiers" className="group rounded-2xl bg-[#173B45] p-6 text-white shadow-lg shadow-[#173B45]/10 transition hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FFB276]">Team access</p>
                            <h2 className="mt-3 text-xl font-black">Cashier accounts</h2>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">Create staff accounts and assign shifts from the dedicated team module.</p>
                        </div>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FF8225] text-xl font-bold text-[#173B45] transition group-hover:translate-x-1">→</span>
                    </div>
                </Link>
                <div className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Workspace</p>
                    <h2 className="mt-3 text-xl font-black">Your admin tools, organized.</h2>
                    <p className="mt-2 text-sm leading-6 text-[#173B45]/60">Use the module navigation above to move between gym overview and staff account management.</p>
                </div>
            </section>
        </>
    );
};

export default AdminDashboard;
