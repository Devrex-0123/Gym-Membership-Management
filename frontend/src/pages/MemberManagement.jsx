import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAYMENT_METHODS = ['cash', 'gcash', 'paymaya', 'card'];
const EMPTY_NEW_MEMBER = { first_name: '', last_name: '', phone: '', password: '' };

const getMemberStatus = (member) => {
    if (!member?.expiry_date) return { label: 'NO MEMBERSHIP', className: 'bg-neutral-50 text-neutral-700' };

    const expiryDay = new Date(member.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDay.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((expiryDay - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return { label: 'EXPIRED', className: 'bg-red-50 text-red-600' };
    if (daysRemaining <= 7) return { label: 'EXPIRING SOON', className: 'bg-neutral-100 text-neutral-700' };
    return { label: 'ACTIVE', className: 'bg-neutral-100 text-neutral-900' };
};

const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not set';

const MemberManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [newMember, setNewMember] = useState(EMPTY_NEW_MEMBER);
    const [pendingMembershipMemberId, setPendingMembershipMemberId] = useState(null);
    const [membershipRates, setMembershipRates] = useState([]);
    const [membershipPackage, setMembershipPackage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isSearching, setIsSearching] = useState(false);
    const [isRegisteringMember, setIsRegisteringMember] = useState(false);
    const [isLoadingRates, setIsLoadingRates] = useState(true);
    const [isProcessingMembership, setIsProcessingMembership] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadMembershipRates = async () => {
            try {
                const { data } = await API.get('/settings/rates');
                setMembershipRates(data.membership_rates);
                setMembershipPackage(data.membership_rates[0]?.package_name || '');
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load membership packages');
            } finally {
                setIsLoadingRates(false);
            }
        };

        void loadMembershipRates();
    }, []);

    const handleSearch = async (event) => {
        event.preventDefault();
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            setSelectedMember(null);
            return;
        }

        setIsSearching(true);
        setError('');
        setMessage('');
        try {
            const { data } = await API.get('/members', { params: { search: query } });
            setSearchResults(data);
            setSelectedMember(data.length === 1 ? data[0] : null);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not search members');
        } finally {
            setIsSearching(false);
        }
    };

    const registerMember = async (event) => {
        event.preventDefault();
        setIsRegisteringMember(true);
        setError('');
        setMessage('');

        try {
            const { data } = await API.post('/members', {
                ...newMember,
                first_name: newMember.first_name.trim(),
                last_name: newMember.last_name.trim(),
                phone: newMember.phone.trim()
            });
            setSelectedMember(data);
            setSearchResults([data]);
            setSearchQuery('');
            setNewMember(EMPTY_NEW_MEMBER);
            setPendingMembershipMemberId(data._id);
            setMessage(`${data.first_name} ${data.last_name} is registered and selected. Choose a package below to complete the membership sale.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not register this member');
        } finally {
            setIsRegisteringMember(false);
        }
    };

    const processMembership = async () => {
        if (!selectedMember || !membershipPackage) return;

        setIsProcessingMembership(true);
        setError('');
        setMessage('');
        try {
            const { data } = await API.post('/transactions/membership', {
                member_id: selectedMember._id,
                package_name: membershipPackage,
                payment_method: paymentMethod
            });
            const updatedMember = {
                ...selectedMember,
                membership_status: 'active',
                expiry_date: data.new_expiry_date
            };
            setSelectedMember(updatedMember);
            setSearchResults((current) => current.map((member) => (
                member._id === selectedMember._id ? updatedMember : member
            )));
            setPendingMembershipMemberId((current) => current === selectedMember._id ? null : current);
            setMessage(`${membershipPackage} membership updated for ₱${Number(data.transaction.amount).toLocaleString('en-PH')}. New expiry: ${formatDate(data.new_expiry_date)}`);
        } catch (err) {
            const failureMessage = err.response?.data?.message || 'Could not process membership';
            setError(pendingMembershipMemberId === selectedMember._id
                ? `Member registration is saved, but membership payment failed: ${failureMessage} Select this member again instead of registering them twice.`
                : failureMessage);
        } finally {
            setIsProcessingMembership(false);
        }
    };

    const selectedStatus = getMemberStatus(selectedMember);
    const selectedPackage = membershipRates.find((item) => item.package_name === membershipPackage);

    return (
        <>
            <section>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Member services</h1>
                <p className="mt-2 text-sm text-neutral-500">Search existing members, register new accounts, and handle memberships.</p>
            </section>

            {message && <p role="status" className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">{message}</p>}
            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-xl text-red-600">⌕</span>
                    <div>
                        <h2 className="text-xl font-semibold">Find a member</h2>
                        <p className="mt-0.5 text-sm text-neutral-500">Search by name, phone number, or member ID.</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search name, phone, or member code"
                        className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
                    />
                    <button type="submit" disabled={isSearching} className="rounded-md bg-neutral-900 text-white px-6 py-3.5 font-semibold transition hover:bg-neutral-700 disabled:opacity-50">
                        {isSearching ? 'Searching…' : 'Search'}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-neutral-500">{searchResults.length} result(s)</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {searchResults.map((member) => {
                                const status = getMemberStatus(member);
                                const isSelected = selectedMember?._id === member._id;
                                return (
                                    <button
                                        key={member._id}
                                        type="button"
                                        onClick={() => setSelectedMember(member)}
                                        className={`rounded-md border p-4 text-left transition ${isSelected ? 'border-neutral-900 bg-neutral-100 ring-2 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-100'}`}
                                    >
                                        <div className="flex justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">{member.first_name} {member.last_name}</p>
                                                <p className="text-sm text-neutral-500">{member.member_code} · {member.phone}</p>
                                            </div>
                                            <span className={`h-fit rounded px-2 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                {searchResults.length === 0 && searchQuery.trim() && !isSearching && (
                    <p className="mt-4 rounded-md bg-neutral-50 px-4 py-3 text-sm text-neutral-500">No members found. Check the spelling or try a phone number.</p>
                )}

                {selectedMember && (
                    <div className="mt-5 rounded-md border border-neutral-900 bg-neutral-100 p-5">
                        <div className="flex flex-wrap justify-between gap-3">
                            <div>
                                <p className="mt-1 text-lg font-semibold">{selectedMember.first_name} {selectedMember.last_name}</p>
                                <p className="text-sm text-neutral-500">{selectedMember.member_code} · {selectedMember.phone}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block rounded px-3 py-1 text-sm font-semibold ${selectedStatus.className}`}>{selectedStatus.label}</span>
                                <p className="mt-2 text-sm text-neutral-500">Expiry: {formatDate(selectedMember.expiry_date)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                    <h2 className="mt-2 text-xl font-semibold">Register a member</h2>
                    <p className="mt-1 text-sm text-neutral-500">A saved member account can be used to sign in to the member app.</p>
                    <form onSubmit={registerMember} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="member-first-name" className="mb-1.5 block text-sm font-semibold">First name</label>
                            <input id="member-first-name" type="text" autoComplete="given-name" required value={newMember.first_name} onChange={(event) => setNewMember({ ...newMember, first_name: event.target.value })} className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900" placeholder="First name" />
                        </div>
                        <div>
                            <label htmlFor="member-last-name" className="mb-1.5 block text-sm font-semibold">Last name</label>
                            <input id="member-last-name" type="text" autoComplete="family-name" required value={newMember.last_name} onChange={(event) => setNewMember({ ...newMember, last_name: event.target.value })} className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900" placeholder="Last name" />
                        </div>
                        <div>
                            <label htmlFor="member-phone" className="mb-1.5 block text-sm font-semibold">Phone number</label>
                            <input id="member-phone" type="tel" autoComplete="tel" required value={newMember.phone} onChange={(event) => setNewMember({ ...newMember, phone: event.target.value })} className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900" placeholder="e.g. 0917 123 4567" />
                        </div>
                        <div>
                            <label htmlFor="member-password" className="mb-1.5 block text-sm font-semibold">Temporary password</label>
                            <input id="member-password" type="password" autoComplete="new-password" minLength={6} required value={newMember.password} onChange={(event) => setNewMember({ ...newMember, password: event.target.value })} className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900" placeholder="At least 6 characters" />
                        </div>
                        <button type="submit" disabled={isRegisteringMember} className="flex items-center justify-center gap-2 rounded-md bg-neutral-900 text-white px-5 py-3.5 text-sm font-semibold transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                            {isRegisteringMember ? 'Registering member…' : 'Register & select member'}
                        </button>
                    </form>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                    <h2 className="mt-2 text-xl font-semibold">New membership or renewal</h2>
                    <p className="mt-1 text-sm text-neutral-500">Select a member above, then choose a configured package.</p>
                    <div className="mt-5">
                        <label htmlFor="membership-package" className="mb-2 block text-sm font-semibold">Package</label>
                        {isLoadingRates ? (
                            <p className="rounded-md bg-neutral-50 px-4 py-4 text-sm text-neutral-500">Loading configured packages…</p>
                        ) : membershipRates.length === 0 ? (
                            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">No active membership packages are configured.</p>
                        ) : (
                            <>
                                <select id="membership-package" value={membershipPackage} onChange={(event) => setMembershipPackage(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-neutral-50 p-3.5 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900">
                                    {membershipRates.map((item) => (
                                        <option key={item.package_name} value={item.package_name}>
                                            {item.package_name} · {item.duration_days} days · ₱{Number(item.price).toLocaleString('en-PH')}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-3 flex justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm">
                                    <span className="text-neutral-500">Package price</span>
                                    <strong>₱{Number(selectedPackage?.price || 0).toLocaleString('en-PH')}</strong>
                                </p>
                            </>
                        )}
                        <label htmlFor="membership-payment-method" className="mb-2 mt-4 block text-sm font-semibold">Payment method</label>
                        <select id="membership-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900">
                            {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method.toUpperCase()}</option>)}
                        </select>
                        <button type="button" disabled={isProcessingMembership || isLoadingRates || !selectedMember || !selectedPackage} onClick={processMembership} className="mt-4 w-full rounded-md bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40">
                            {isProcessingMembership ? 'Processing membership…' : pendingMembershipMemberId === selectedMember?._id ? 'Complete new member sale' : 'Process membership / renewal'}
                        </button>
                        {!selectedMember && <p className="mt-3 text-sm text-neutral-500">Search for or register a member to enable the sale.</p>}
                        {pendingMembershipMemberId === selectedMember?._id && <p className="mt-3 text-sm text-red-600">This member is saved. Complete the sale here; no need to register them again.</p>}
                    </div>
                </div>
            </section>
        </>
    );
};

export default MemberManagement;
