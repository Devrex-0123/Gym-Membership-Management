import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAGE_SIZE = 25;
const STATUS_FILTERS = [
    { value: 'all', label: 'All members' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'none', label: 'No membership' }
];
const STATUS_STYLES = {
    active: 'bg-neutral-100 text-neutral-900',
    expiring: 'bg-neutral-100 text-neutral-700',
    expired: 'bg-red-50 text-red-600',
    none: 'bg-neutral-50 text-neutral-700'
};
const STATUS_LABELS = {
    active: 'Active',
    expiring: 'Expiring soon',
    expired: 'Expired',
    none: 'No membership'
};

const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not set';

const formatDateTime = (date) => date
    ? new Date(date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No visit recorded';

const MemberDirectory = () => {
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [members, setMembers] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadMembers = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/members/directory', {
                    params: {
                        status,
                        search: appliedSearch || undefined,
                        page,
                        limit: PAGE_SIZE
                    }
                });
                setMembers(data.members);
                setPagination(data.pagination);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load member directory');
            } finally {
                setIsLoading(false);
            }
        };

        void loadMembers();
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
            <section>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Member directory</h1>
                <p className="mt-2 text-sm text-neutral-500">Browse member accounts, membership status, and recent attendance.</p>
            </section>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            aria-pressed={status === filter.value}
                            onClick={() => { setPage(1); setStatus(filter.value); }}
                            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${status === filter.value ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="member-directory-search">Search members</label>
                    <input
                        id="member-directory-search"
                        type="search"
                        maxLength={100}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, phone, or member code"
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
                    <h2 className="font-semibold">Members</h2>
                    <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} member(s)`}</p>
                </div>
                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">Loading member directory…</p>
                ) : members.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">No members match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-neutral-50 text-xs text-neutral-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold sm:px-7">Member</th>
                                    <th className="px-5 py-3 font-semibold">Phone</th>
                                    <th className="px-5 py-3 font-semibold">Membership</th>
                                    <th className="px-5 py-3 font-semibold">Expiry</th>
                                    <th className="px-5 py-3 font-semibold">Last visit</th>
                                    <th className="px-5 py-3 text-right font-semibold sm:px-7">Account</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {members.map((member) => (
                                    <tr key={member._id} className="hover:bg-neutral-100">
                                        <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                            <p className="font-semibold">{member.full_name}</p>
                                            <p className="mt-1 font-mono text-xs text-neutral-500">{member.member_code}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">{member.phone}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[member.directory_status]}`}>
                                                {STATUS_LABELS[member.directory_status]}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-neutral-500">{formatDate(member.expiry_date)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-neutral-500">{formatDateTime(member.last_visit)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right sm:px-7">
                                            {member.is_blacklisted
                                                ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Blacklisted</span>
                                                : <span className="text-sm text-neutral-500">In good standing</span>}
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

export default MemberDirectory;
