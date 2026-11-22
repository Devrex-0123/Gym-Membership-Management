import { useEffect, useState } from 'react';
import API from '../utils/api';
import { getTodayDateInput } from '../utils/dateRange';

const INPUT_CLASS = 'w-full rounded-xl border border-[#173B45]/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10';

const SummaryCard = ({ label, value, detail }) => (
    <article className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#173B45]/55">{label}</p>
        <p className="mt-3 text-3xl font-black tracking-tight">{Number(value || 0).toLocaleString('en-PH')}</p>
        <p className="mt-1 text-xs text-[#173B45]/50">{detail}</p>
    </article>
);

const AttendanceTable = ({ title, headers, rows, emptyMessage, rowKey, renderRow }) => (
    <section className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
        <h2 className="border-b border-[#173B45]/[0.07] px-5 py-4 font-black">{title}</h2>
        {!rows?.length ? (
            <p className="px-5 py-6 text-sm text-[#173B45]/55">{emptyMessage}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                    <thead className="bg-[#F8EDED]/55 text-xs uppercase tracking-wide text-[#173B45]/55">
                        <tr>{headers.map((header, index) => <th key={header} className={`px-5 py-3 font-bold ${index === headers.length - 1 ? 'text-right' : ''}`}>{header}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#173B45]/[0.06]">
                        {rows.map((row) => <tr key={rowKey(row)} className="hover:bg-[#F8EDED]/25">{renderRow(row)}</tr>)}
                    </tbody>
                </table>
            </div>
        )}
    </section>
);

const AdminAttendance = () => {
    const [filters, setFilters] = useState(() => {
        const today = getTodayDateInput();
        return { startDate: today, endDate: today };
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadReport = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/attendance/report', { params: appliedFilters });
                setReport(data);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load attendance report');
            } finally {
                setIsLoading(false);
            }
        };

        void loadReport();
    }, [appliedFilters]);

    const applyFilters = (event) => {
        event.preventDefault();
        setAppliedFilters({ ...filters });
    };

    const summary = report?.summary || {};

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Attendance reports</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Track member visits, cashier activity, and the busiest check-in hours.</p>
            </section>

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                    <h2 className="text-lg font-black">Reporting period</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Both selected dates are included.</p>
                </div>
                <form onSubmit={applyFilters} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label htmlFor="attendance-start-date" className="mb-1.5 block text-sm font-semibold">From date</label>
                        <input id="attendance-start-date" required type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="attendance-end-date" className="mb-1.5 block text-sm font-semibold">To date</label>
                        <input id="attendance-end-date" required type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <button type="submit" disabled={isLoading} className="rounded-xl bg-[#FF8225] px-5 py-3 font-bold text-[#173B45] transition hover:bg-[#f77718] disabled:opacity-50">
                        {isLoading ? 'Loading…' : 'Apply period'}
                    </button>
                </form>
            </section>

            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

            {isLoading && !report ? (
                <p className="rounded-2xl bg-white px-5 py-8 text-sm text-[#173B45]/55 shadow-sm">Loading attendance report…</p>
            ) : report && (
                <>
                    <section className="grid gap-4 sm:grid-cols-2">
                        <SummaryCard label="Check-ins" value={summary.total_check_ins} detail="Visits in the selected period" />
                        <SummaryCard label="Unique members" value={summary.unique_members} detail="Members who visited in the period" />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-2">
                        <AttendanceTable
                            title="Visits by day"
                            headers={['Date', 'Check-ins', 'Members']}
                            rows={report.by_day}
                            emptyMessage="No visits in this period."
                            rowKey={(row) => row.date}
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{row.date}</td>
                                    <td className="px-5 py-4">{Number(row.check_ins).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4 text-right font-bold">{Number(row.unique_members).toLocaleString('en-PH')}</td>
                                </>
                            )}
                        />
                        <AttendanceTable
                            title="Check-ins by cashier"
                            headers={['Cashier', 'Check-ins']}
                            rows={report.by_cashier}
                            emptyMessage="No cashier check-ins in this period."
                            rowKey={(row) => row.cashier_id}
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{row.cashier_name}</td>
                                    <td className="px-5 py-4 text-right font-bold">{Number(row.check_ins).toLocaleString('en-PH')}</td>
                                </>
                            )}
                        />
                        <AttendanceTable
                            title="Busiest check-in hours"
                            headers={['Hour', 'Check-ins']}
                            rows={report.by_hour}
                            emptyMessage="No hourly activity in this period."
                            rowKey={(row) => row.hour}
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{new Date(2000, 0, 1, row.hour).toLocaleTimeString('en-PH', { hour: 'numeric' })}</td>
                                    <td className="px-5 py-4 text-right font-bold">{Number(row.check_ins).toLocaleString('en-PH')}</td>
                                </>
                            )}
                        />
                    </section>
                </>
            )}
        </>
    );
};

export default AdminAttendance;
