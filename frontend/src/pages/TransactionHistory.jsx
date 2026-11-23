import { useEffect, useState } from 'react';
import API from '../utils/api';
import { getDateRangeParams } from '../utils/dateRange';

const PAGE_SIZE = 20;
const EMPTY_FILTERS = { search: '', startDate: '', endDate: '', transactionType: '', paymentMethod: '' };
const TRANSACTION_TYPES = [
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'membership_new', label: 'New membership' },
    { value: 'membership_renewal', label: 'Renewal' }
];
const PAYMENT_METHODS = ['cash', 'gcash', 'paymaya', 'card'];
const INPUT_CLASS = 'w-full rounded-md border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900';

const TransactionHistory = () => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTransactions = async () => {
            setIsLoading(true);
            try {
                const params = {
                    page,
                    limit: PAGE_SIZE,
                    ...getDateRangeParams(appliedFilters),
                    search: appliedFilters.search?.trim() || undefined,
                    transactionType: appliedFilters.transactionType || undefined,
                    paymentMethod: appliedFilters.paymentMethod || undefined
                };
                const { data } = await API.get('/transactions/history', { params });
                setTransactions(data.transactions);
                setPagination(data.pagination);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load transaction history');
            } finally {
                setIsLoading(false);
            }
        };

        void loadTransactions();
    }, [appliedFilters, page, reloadToken]);

    const applyFilters = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedFilters({ ...filters });
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setPage(1);
        setAppliedFilters({});
    };

    const refreshTransactions = () => {
        setReloadToken((current) => current + 1);
    };

    return (
        <>
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Transaction history</h1>
                    <p className="mt-2 text-sm text-neutral-500">Search and filter recorded transactions by date, type, or payment method.</p>
                </div>
                <button type="button" onClick={refreshTransactions} disabled={isLoading} className="w-fit rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-neutral-400 disabled:opacity-50">
                    {isLoading ? 'Loading…' : 'Refresh'}
                </button>
            </section>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold">Find transactions</h2>
                    <p className="mt-1 text-sm text-neutral-500">Results are scoped to your cashier account when signed in as a cashier.</p>
                </div>
                <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label htmlFor="transaction-search" className="mb-1.5 block text-sm font-semibold">Search reference or category</label>
                        <input
                            id="transaction-search"
                            type="search"
                            maxLength={100}
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                            placeholder="e.g. TXN-2026… or Monthly"
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label htmlFor="transaction-start-date" className="mb-1.5 block text-sm font-semibold">From date</label>
                        <input id="transaction-start-date" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="transaction-end-date" className="mb-1.5 block text-sm font-semibold">To date</label>
                        <input id="transaction-end-date" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="transaction-type" className="mb-1.5 block text-sm font-semibold">Transaction type</label>
                        <select id="transaction-type" value={filters.transactionType} onChange={(event) => setFilters({ ...filters, transactionType: event.target.value })} className={INPUT_CLASS}>
                            <option value="">All types</option>
                            {TRANSACTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="transaction-payment-method" className="mb-1.5 block text-sm font-semibold">Payment method</label>
                        <select id="transaction-payment-method" value={filters.paymentMethod} onChange={(event) => setFilters({ ...filters, paymentMethod: event.target.value })} className={INPUT_CLASS}>
                            <option value="">All methods</option>
                            {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
                        <button type="submit" className="rounded-md bg-neutral-900 text-white px-5 py-3 font-semibold transition hover:bg-neutral-700">Apply filters</button>
                        <button type="button" onClick={clearFilters} className="rounded-md border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold transition hover:border-neutral-400">Clear</button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 sm:px-7">
                    <div>
                        <h2 className="font-semibold">Results</h2>
                        <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} transaction(s)`}</p>
                    </div>
                </div>

                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">Loading transactions…</p>
                ) : transactions.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">No transactions match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-neutral-50 text-xs text-neutral-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold sm:px-7">Date & time</th>
                                    <th className="px-5 py-3 font-semibold">Reference</th>
                                    <th className="px-5 py-3 font-semibold">Customer</th>
                                    <th className="px-5 py-3 font-semibold">Category</th>
                                    <th className="px-5 py-3 font-semibold">Type</th>
                                    <th className="px-5 py-3 font-semibold">Cashier</th>
                                    <th className="px-5 py-3 font-semibold">Payment</th>
                                    <th className="px-5 py-3 text-right font-semibold sm:px-7">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-neutral-100">
                                        <td className="whitespace-nowrap px-5 py-4 text-neutral-500 sm:px-7">
                                            {new Date(transaction.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">{transaction.transaction_code}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            {transaction.member_id ? `${transaction.member_id.first_name} ${transaction.member_id.last_name}` : 'Walk-in'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">{transaction.category_name}</td>
                                        <td className="whitespace-nowrap px-5 py-4 capitalize text-neutral-500">{transaction.transaction_type.replace(/_/g, ' ')}</td>
                                        <td className="whitespace-nowrap px-5 py-4">{transaction.cashier_id?.full_name || 'Unknown'}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-neutral-500">{transaction.payment_method}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold sm:px-7">₱{Number(transaction.amount).toLocaleString('en-PH')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-5 py-4 sm:px-7">
                    <p className="text-sm text-neutral-500">Page {page} of {Math.max(pagination.totalPages, 1)}</p>
                    <div className="flex gap-2">
                        <button type="button" disabled={isLoading || page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
                        <button type="button" disabled={isLoading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TransactionHistory;
