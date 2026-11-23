import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAGE_SIZE = 25;
const TABS = [
    { value: 'expiring', label: 'Expiring soon · 7 days' },
    { value: 'expired', label: 'Expired' },
    { value: 'all', label: 'All due' }
];
const INPUT_CLASS = 'w-full rounded-md border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900';

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
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Membership renewals</h1>
                <p className="mt-2 text-sm text-neutral-500">Find members due for renewal and keep track of outreach.</p>
            </section>

            <section className="rounded-lg border border-neutral-900 bg-neutral-100 p-5 text-sm leading-6 text-neutral-700">
                The list highlights memberships expiring within 7 days and past expiries. Contact members using your usual method, then record the reminder here. This does not send an SMS or email.
            </section>

            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
            {notice && <p role="status" className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">{notice}</p>}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            aria-pressed={status === tab.value}
                            onClick={() => changeStatus(tab.value)}
                            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${status === tab.value ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
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
                        <button type="submit" className="rounded-md bg-neutral-900 text-white px-5 py-3 font-semibold transition hover:bg-neutral-700">Search</button>
                        <button type="button" onClick={clearSearch} className="rounded-md border border-neutral-200 px-5 py-3 text-sm font-semibold transition hover:border-neutral-400">Clear</button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 sm:px-7">
                    <div>
                        <h2 className="font-semibold">Members to follow up</h2>
                        <p className="mt-1 text-sm text-neutral-500">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} member(s)`}</p>
                    </div>
                </div>

                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">Loading renewal candidates…</p>
                ) : members.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-neutral-500 sm:px-7">
                        {status === 'expired' ? 'No expired memberships found.' : status === 'expiring' ? 'No memberships are expiring in the next 7 days.' : 'No due memberships match this search.'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-neutral-50 text-xs text-neutral-500">
                                <tr>
                                    <th className="px-5 py-3 font-semibold sm:px-7">Member</th>
                                    <th className="px-5 py-3 font-semibold">Phone</th>
                                    <th className="px-5 py-3 font-semibold">Expires</th>
                                    <th className="px-5 py-3 font-semibold">Last visit</th>
                                    <th className="px-5 py-3 font-semibold">Reminder</th>
                                    <th className="px-5 py-3 text-right font-semibold sm:px-7">Action</th>
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
                                            <p className="font-semibold">{formatDate(member.expiry_date)}</p>
                                            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${member.renewal_status === 'expired' ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-700'}`}>
                                                {member.renewal_status === 'expired' ? 'Expired' : 'Expiring soon'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-4 text-neutral-500">{formatDateTime(member.last_visit)}</td>
                                        <td className="whitespace-nowrap px-5 py-4">
                                            {member.reminder ? (
                                                <>
                                                    <p className="font-semibold text-neutral-900">Recorded</p>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {formatDateTime(member.reminder.sent_at)}
                                                        {member.reminder.sent_by?.full_name ? ` · ${member.reminder.sent_by.full_name}` : ''}
                                                    </p>
                                                </>
                                            ) : <span className="text-neutral-500">Not recorded</span>}
                                        </td>
                                        <td className="px-5 py-4 text-right sm:px-7">
                                            <button
                                                type="button"
                                                onClick={() => markAsSent(member)}
                                                disabled={Boolean(member.reminder) || markingId === member._id}
                                                className="whitespace-nowrap rounded-lg bg-neutral-900 text-white px-3.5 py-2 text-xs font-semibold transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
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

export default RenewalReminders;
