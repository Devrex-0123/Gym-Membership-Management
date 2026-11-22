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
    active: 'bg-[#173B45]/10 text-[#173B45]',
    expiring: 'bg-[#FF8225]/15 text-[#9A4A0C]',
    expired: 'bg-[#B43F3F]/10 text-[#B43F3F]',
    none: 'bg-[#173B45]/[0.07] text-[#173B45]/70'
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
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Cashier module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Member directory</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Browse member accounts, membership status, and recent attendance.</p>
            </section>

            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            aria-pressed={status === filter.value}
                            onClick={() => { setPage(1); setStatus(filter.value); }}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${status === filter.value ? 'bg-[#173B45] text-white' : 'bg-[#F8EDED]/70 text-[#173B45]/65 hover:bg-[#F8EDED]'}`}
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
                    <h2 className="font-black">Members</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} member(s)`}</p>
                </div>
                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">Loading member directory…</p>
                ) : members.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">No members match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-[#F8EDED]/55 text-xs uppercase tracking-wide text-[#173B45]/55">
                                <tr>
                                    <th className="px-5 py-3 font-bold sm:px-7">Member</th>
                                    <th className="px-5 py-3 font-bold">Phone</th>
                                    <th className="px-5 py-3 font-bold">Membership</th>
                                    <th className="px-5 py-3 font-bold">Expiry</th>
                                    <th className="px-5 py-3 font-bold">Last visit</th>
                                    <th className="px-5 py-3 text-right font-bold sm:px-7">Account</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#173B45]/[0.06]">
                                {members.map((member) => (
                                    <tr key={member._id} className="hover:bg-[#F8EDED]/25">
                                        <td className="whitespace-nowrap px-5 py-4 sm:px-7">
                                            <p className="font-bold">{member.full_name}</p>
                                            <p className="mt-1 font-mono text-xs text-[#173B45]/50">{member.member_code}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4">{member.phone}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[member.directory_status]}`}>
                                                {STATUS_LABELS[member.directory_status]}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-[#173B45]/65">{formatDate(member.expiry_date)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-[#173B45]/65">{formatDateTime(member.last_visit)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right sm:px-7">
                                            {member.is_blacklisted
                                                ? <span className="rounded-full bg-[#B43F3F]/10 px-2.5 py-1 text-xs font-bold text-[#B43F3F]">Blacklisted</span>
                                                : <span className="text-sm text-[#173B45]/55">In good standing</span>}
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

export default MemberDirectory;
