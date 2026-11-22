import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAGE_SIZE = 25;
const TABS = [
    { value: 'expiring', label: 'Expiring soon · 7 days' },
    { value: 'expired', label: 'Expired' },
    { value: 'all', label: 'All due' }
];
const INPUT_CLASS = 'w-full rounded-xl border border-[#173B45]/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10';

const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'No visit recorded';

const formatDateTime = (date) => date
    ? new Date(date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No visit recorded';

const RenewalReminders = () => {
    const [status, setStatus] = useState('expiring');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [members, setMembers] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [markingId, setMarkingId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const loadMembers = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/members/renewals', {
                    params: {
                        status,
                        page,
                        limit: PAGE_SIZE,
                        search: appliedSearch || undefined
                    }
                });
                setMembers(data.members);
                setPagination(data.pagination);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load renewal reminders');
            } finally {
                setIsLoading(false);
            }
        };

        void loadMembers();
    }, [status, page, appliedSearch, reloadToken]);

    const applySearch = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedSearch(search.trim());
    };

    const changeStatus = (nextStatus) => {
        setPage(1);
        setStatus(nextStatus);
        setNotice('');
    };

    const markAsSent = async (member) => {
        setMarkingId(member._id);
        setError('');
        setNotice('');
        try {
            const { data } = await API.post(`/members/renewals/${member._id}/mark-sent`);
            setNotice(data.message);
            setReloadToken((current) => current + 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not record this reminder');
        } finally {
            setMarkingId('');
        }
    };

    const clearSearch = () => {
        setSearch('');
        setAppliedSearch('');
        setPage(1);
    };

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Staff module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Membership renewals</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Find members due for renewal and keep track of outreach.</p>
            </section>

            <section className="rounded-2xl border border-[#FF8225]/20 bg-[#FF8225]/[0.08] p-5 text-sm leading-6 text-[#173B45]/75">
                The list highlights memberships expiring within 7 days and past expiries. Contact members using your usual method, then record the reminder here. This does not send an SMS or email.
            </section>

            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-medium text-[#173B45] shadow-sm">{notice}</p>}

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            aria-pressed={status === tab.value}
                            onClick={() => changeStatus(tab.value)}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${status === tab.value ? 'bg-[#173B45] text-white' : 'bg-[#F8EDED]/70 text-[#173B45]/65 hover:bg-[#F8EDED]'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="renewal-search">Search members</label>
                    <input
                        id="renewal-search"
                        type="search"
                        maxLength={100}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, member code, or phone"
                        className={INPUT_CLASS}
                    />
                    <div className="flex shrink-0 gap-2">
                        <button type="submit" className="rounded-xl bg-[#FF8225] px-5 py-3 font-bold text-[#173B45] transition hover:bg-[#f77718]">Search</button>
                        <button type="button" onClick={clearSearch} className="rounded-xl border border-[#173B45]/15 px-5 py-3 text-sm font-bold transition hover:border-[#FF8225]">Clear</button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                    <div>
                        <h2 className="font-black">Members to follow up</h2>
                        <p className="mt-1 text-sm text-[#173B45]/55">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} member(s)`}</p>
                    </div>
                    <span className="rounded-full bg-[#F8EDED] px-3 py-1 text-xs font-bold text-[#B43F3F]">RENEWALS</span>
                </div>

                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">Loading renewal candidates…</p>
                ) : members.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">
                        {status === 'expired' ? 'No expired memberships found.' : status === 'expiring' ? 'No memberships are expiring in the next 7 days.' : 'No due memberships match this search.'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-[#F8EDED]/55 text-xs uppercase tracking-wide text-[#173B45]/55">
                                <tr>
                                    <th className="px-5 py-3 font-bold sm:px-7">Member</th>
                                    <th className="px-5 py-3 font-bold">Phone</th>
                                    <th className="px-5 py-3 font-bold">Expires</th>
                                    <th className="px-5 py-3 font-bold">Last visit</th>
                                    <th className="px-5 py-3 font-bold">Reminder</th>
                                    <th className="px-5 py-3 text-right font-bold sm:px-7">Action</th>
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
                                            <p className="font-semibold">{formatDate(member.expiry_date)}</p>
                                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${member.renewal_status === 'expired' ? 'bg-[#B43F3F]/10 text-[#B43F3F]' : 'bg-[#FF8225]/15 text-[#9A4A0C]'}`}>
                                                {member.renewal_status === 'expired' ? 'Expired' : 'Expiring soon'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-[#173B45]/65">{formatDateTime(member.last_visit)}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            {member.reminder ? (
                                                <>
                                                    <p className="font-semibold text-[#173B45]">Recorded</p>
                                                    <p className="mt-1 text-xs text-[#173B45]/55">
                                                        {formatDateTime(member.reminder.sent_at)}
                                                        {member.reminder.sent_by?.full_name ? ` · ${member.reminder.sent_by.full_name}` : ''}
                                                    </p>
                                                </>
                                            ) : <span className="text-[#173B45]/50">Not recorded</span>}
                                        </td>
                                        <td className="px-5 py-4 text-right sm:px-7">
                                            <button
                                                type="button"
                                                onClick={() => markAsSent(member)}
                                                disabled={Boolean(member.reminder) || markingId === member._id}
                                                className="whitespace-nowrap rounded-lg bg-[#FF8225] px-3.5 py-2 text-xs font-bold text-[#173B45] transition hover:bg-[#f77718] disabled:cursor-not-allowed disabled:bg-[#173B45]/[0.08] disabled:text-[#173B45]/45"
                                            >
                                                {member.reminder ? 'Reminder recorded' : markingId === member._id ? 'Recording…' : 'Record sent'}
                                            </button>
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

export default RenewalReminders;
