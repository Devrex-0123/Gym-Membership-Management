import { useEffect, useState } from 'react';
import API from '../utils/api';
import { getDateRangeParams, getTodayDateInput } from '../utils/dateRange';

const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 });
const formatCurrency = (amount) => currencyFormatter.format(Number(amount || 0));
const TYPE_LABELS = {
    walk_in: 'Walk-in',
    membership_new: 'New membership',
    membership_renewal: 'Renewal'
};
const INPUT_CLASS = 'w-full rounded-md border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900';

const MetricCard = ({ label, value, detail }) => (
    <article className="rounded-lg border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </article>
);

const AdminReports = () => {
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
                const { data } = await API.get('/transactions/report', {
                    params: {
                        ...getDateRangeParams(appliedFilters),
                        expenseStartDate: appliedFilters.startDate,
                        expenseEndDate: appliedFilters.endDate
                    }
                });
                setReport(data);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load sales report');
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
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sales and profit reports</h1>
                <p className="mt-2 text-sm text-neutral-500">Compare sales revenue with recorded operating expenses.</p>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold">Reporting period</h2>
                    <p className="mt-1 text-sm text-neutral-500">Choose dates in your local timezone; both selected dates are included.</p>
                </div>
                <form onSubmit={applyFilters} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label htmlFor="report-start-date" className="mb-1.5 block text-sm font-semibold">From date</label>
                        <input id="report-start-date" required type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="report-end-date" className="mb-1.5 block text-sm font-semibold">To date</label>
                        <input id="report-end-date" required type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <button type="submit" disabled={isLoading} className="rounded-md bg-neutral-900 text-white px-5 py-3 font-semibold transition hover:bg-neutral-700 disabled:opacity-50">
                        {isLoading ? 'Loading…' : 'Apply period'}
                    </button>
                </form>
            </section>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            {isLoading && !report ? (
                <p className="rounded-lg bg-white px-5 py-8 text-sm text-neutral-500">Loading report…</p>
            ) : report && (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <MetricCard label="Total revenue" value={formatCurrency(summary.total_revenue)} detail="Recorded sales in period" />
                        <MetricCard label="Total expenses" value={formatCurrency(summary.total_expenses)} detail={`${Number(summary.expense_count || 0).toLocaleString('en-PH')} recorded expense(s)`} />
                        <MetricCard label="Net profit" value={formatCurrency(summary.net_profit)} detail="Revenue minus recorded expenses" />
                        <MetricCard label="Transactions" value={Number(summary.transaction_count || 0).toLocaleString('en-PH')} detail="Completed transactions" />
                        <MetricCard label="Walk-ins" value={Number(summary.total_walk_ins || 0).toLocaleString('en-PH')} detail="Walk-in sales" />
                        <MetricCard label="Memberships" value={(Number(summary.total_new_members || 0) + Number(summary.total_renewals || 0)).toLocaleString('en-PH')} detail={`${summary.total_new_members || 0} new · ${summary.total_renewals || 0} renewals`} />
                    </section>

                    <section className="grid gap-5 xl:grid-cols-2">
                        <ReportTable
                            title="Sales by cashier"
                            columns={['Cashier', 'Transactions', 'Revenue']}
                            rows={report.by_cashier}
                            emptyMessage="No cashier sales in this period."
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{row.cashier_name}</td>
                                    <td className="px-5 py-4">{Number(row.transaction_count).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4 text-right font-semibold">{formatCurrency(row.total_revenue)}</td>
                                </>
                            )}
                            rowKey={(row) => row.cashier_id}
                        />
                        <ReportTable
                            title="Sales by payment method"
                            columns={['Payment method', 'Transactions', 'Revenue']}
                            rows={report.by_payment_method}
                            emptyMessage="No payment activity in this period."
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{row.payment_method}</td>
                                    <td className="px-5 py-4">{Number(row.transaction_count).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4 text-right font-semibold">{formatCurrency(row.total_revenue)}</td>
                                </>
                            )}
                            rowKey={(row) => row.payment_method}
                        />
                        <ReportTable
                            title="Expenses by category"
                            columns={['Category', 'Records', 'Amount']}
                            rows={report.by_expense_category}
                            emptyMessage="No expenses recorded in this period."
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold capitalize">{row.category}</td>
                                    <td className="px-5 py-4">{Number(row.expense_count).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4 text-right font-semibold">{formatCurrency(row.total_amount)}</td>
                                </>
                            )}
                            rowKey={(row) => row.category}
                        />
                        <ReportTable
                            title="Sales by transaction type"
                            columns={['Transaction type', 'Transactions', 'Revenue']}
                            rows={report.by_transaction_type}
                            emptyMessage="No transaction types to report."
                            renderRow={(row) => (
                                <>
                                    <td className="px-5 py-4 font-semibold">{TYPE_LABELS[row.transaction_type] || row.transaction_type}</td>
                                    <td className="px-5 py-4">{Number(row.transaction_count).toLocaleString('en-PH')}</td>
                                    <td className="px-5 py-4 text-right font-semibold">{formatCurrency(row.total_revenue)}</td>
                                </>
                            )}
                            rowKey={(row) => row.transaction_type}
                        />
                    </section>
                </>
            )}
        </>
    );
};

const ReportTable = ({ title, columns, rows, emptyMessage, renderRow, rowKey }) => (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <h2 className="border-b border-neutral-200 px-5 py-4 font-semibold">{title}</h2>
        {!rows?.length ? (
            <p className="px-5 py-6 text-sm text-neutral-500">{emptyMessage}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                    <thead className="bg-neutral-50 text-xs text-neutral-500">
                        <tr>
                            {columns.map((column, index) => <th key={column} className={`px-5 py-3 font-semibold ${index === columns.length - 1 ? 'text-right' : ''}`}>{column}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {rows.map((row) => <tr key={rowKey(row)} className="hover:bg-neutral-100">{renderRow(row)}</tr>)}
                    </tbody>
                </table>
            </div>
        )}
    </section>
);

export default AdminReports;
