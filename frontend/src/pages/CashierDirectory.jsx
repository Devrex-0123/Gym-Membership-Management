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
                    <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin module</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Cashier directory</h1>
                    <p className="mt-2 text-sm text-[#173B45]/60">Browse staff cashier accounts and their assigned shifts.</p>
                </div>
                <Link to="/admin/cashiers" className="w-fit rounded-xl bg-[#FF8225] px-4 py-3 text-sm font-bold text-[#173B45] transition hover:bg-[#f77718]">Add cashier</Link>
            </section>

            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {STATUSES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            aria-pressed={status === item.value}
                            onClick={() => { setPage(1); setStatus(item.value); }}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${status === item.value ? 'bg-[#173B45] text-white' : 'bg-[#F8EDED]/70 text-[#173B45]/65 hover:bg-[#F8EDED]'}`}
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
                        className="w-full rounded-xl border border-[#173B45]/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10"
                    />
                    <div className="flex shrink-0 gap-2">
                        <button type="submit" className="rounded-xl bg-[#FF8225] px-5 py-3 font-bold text-[#173B45] transition hover:bg-[#f77718]">Search</button>
                        <button type="button" onClick={clearSearch} className="rounded-xl border border-[#173B45]/15 px-5 py-3 text-sm font-bold transition hover:border-[#FF8225]">Clear</button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
                <div className="border-b border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                    <h2 className="font-black">Cashier accounts</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} cashier(s)`}</p>
                </div>
                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">Loading cashier accounts…</p>
                ) : staff.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">No cashier accounts match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-[#F8EDED]/55 text-xs uppercase tracking-wide text-[#173B45]/55">
                                <tr>
                                    <th className="px-5 py-3 font-bold sm:px-7">Cashier</th>
                                    <th className="px-5 py-3 font-bold">Username</th>
                                    <th className="px-5 py-3 font-bold">Shift</th>
                                    <th className="px-5 py-3 font-bold">Account status</th>
                                    <th className="px-5 py-3 text-right font-bold sm:px-7">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#173B45]/[0.06]">
                                {staff.map((account) => (
                                    <tr key={account._id} className="hover:bg-[#F8EDED]/25">
                                        <td className="whitespace-nowrap px-5 py-4 font-bold sm:px-7">{account.full_name}</td>
                                        <td className="whitespace-nowrap px-5 py-4">{account.username}</td>
                                        <td className="whitespace-nowrap px-5 py-4 capitalize">{account.shift_tag}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.is_active ? 'bg-[#173B45]/10 text-[#173B45]' : 'bg-[#B43F3F]/10 text-[#B43F3F]'}`}>
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-[#173B45]/60 sm:px-7">
                                            {new Date(account.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                    <p className="text-sm text-[#173B45]/55">Page {page} of {Math.max(pagination.totalPages, 1)}</p>
                    <div className="flex gap-2">
                        <button type="button" disabled={isLoading || page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#173B45]/15 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
                        <button type="button" disabled={isLoading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#173B45]/15 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default CashierDirectory;
