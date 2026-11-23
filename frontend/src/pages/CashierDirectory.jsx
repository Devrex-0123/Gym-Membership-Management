import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const PAGE_SIZE = 25;
const STATUSES = [
    { value: 'all', label: 'All cashiers' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
];

const CashierDirectory = () => {
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [staff, setStaff] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCashiers = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/auth/staff', {
                    params: {
                        status,
                        search: appliedSearch || undefined,
                        page,
                        limit: PAGE_SIZE
                    }
                });
                setStaff(data.staff);
                setPagination(data.pagination);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load cashier accounts');
            } finally {
                setIsLoading(false);
            }
        };

        void loadCashiers();
    }, [status, appliedSearch, page]);

    const applySearch = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedSearch(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setAppliedSearch('');
        setPage(1);
    };

    return (
        <>
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cashier directory</h1>
                    <p className="mt-2 text-sm text-neutral-500">Browse staff cashier accounts and their assigned shifts.</p>
                </div>
                <Link to="/admin/cashiers" className="w-fit rounded-md bg-neutral-900 text-white px-4 py-3 text-sm font-semibold transition hover:bg-neutral-700">Add cashier</Link>
            </section>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {STATUSES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            aria-pressed={status === item.value}
                            onClick={() => { setPage(1); setStatus(item.value); }}
                            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${status === item.value ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="cashier-directory-search">Search cashiers</label>
                    <input
                        id="cashier-directory-search"
                        type="search"
                        maxLength={100}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or username"
                        className="w-full rounded-md border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
                    />
                    <div className="flex shrink-0 gap-2">
                        <button type="submit" className="rounded-md bg-neutral-900 text-white px-5 py-3 font-semibold transition hover:bg-neutral-700">Search</button>
                        <button type="button" onClick={clearSearch} className="rounded-md border border-neutral-200 px-5 py-3 text-sm font-semibold transition hover:border-neutral-400">Clear</button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-5 py-4 sm:px-7">
                    <h2 className="font-semibold">Cashier accounts</h2>
                    <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} cashier(s)`}</p>
                </div>
                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">Loading cashier accounts…</p>
                ) : staff.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">No cashier accounts match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-neutral-50 text-xs text-neutral-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold sm:px-7">Cashier</th>
                                    <th className="px-5 py-3 font-semibold">Username</th>
                                    <th className="px-5 py-3 font-semibold">Shift</th>
                                    <th className="px-5 py-3 font-semibold">Account status</th>
                                    <th className="px-5 py-3 text-right font-semibold sm:px-7">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {staff.map((account) => (
                                    <tr key={account._id} className="hover:bg-neutral-100">
                                        <td className="whitespace-nowrap px-5 py-4 font-semibold sm:px-7">{account.full_name}</td>
                                        <td className="whitespace-nowrap px-5 py-4">{account.username}</td>
                                        <td className="whitespace-nowrap px-5 py-4 capitalize">{account.shift_tag}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.is_active ? 'bg-neutral-100 text-neutral-900' : 'bg-red-50 text-red-600'}`}>
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-neutral-500 sm:px-7">
                                            {new Date(account.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                                        </td>
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

export default CashierDirectory;
