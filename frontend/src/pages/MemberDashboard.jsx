import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import API from '../utils/api';
import BrandLogo from '../components/BrandLogo';

const getMembershipStatus = (member) => {
    if (!member?.expiry_date || member.membership_status === 'none') {
        return {
            label: 'No active membership',
            detail: 'Visit the front desk to choose a membership package.',
            className: 'border-neutral-300 text-neutral-700'
        };
    }

    const expiryDay = new Date(member.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDay.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((expiryDay - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return {
            label: 'Membership expired',
            detail: 'Renew at the front desk to continue your membership.',
            className: 'border-red-200 text-red-700'
        };
    }
    if (daysRemaining <= 7) {
        return {
            label: 'Expiring soon',
            detail: daysRemaining === 0 ? 'Your membership expires today.' : `${daysRemaining} day(s) remaining. Plan your renewal soon.`,
            className: 'border-neutral-900 text-neutral-900'
        };
    }
    return {
        label: 'Active membership',
        detail: `${daysRemaining} days remaining..`,
        className: 'border-neutral-300 text-neutral-900'
    };
};

const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not set';

const MemberDashboard = () => {
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
    const [attendanceError, setAttendanceError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data } = await API.get('/members/me');
                setMember(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load your membership');
            } finally {
                setIsLoading(false);
            }
        };

        void loadProfile();
    }, []);

    useEffect(() => {
        const loadAttendance = async () => {
            try {
                const { data } = await API.get('/attendance/me');
                setAttendance(data);
            } catch (err) {
                setAttendanceError(err.response?.data?.message || 'Could not load your recent visits');
            } finally {
                setIsAttendanceLoading(false);
            }
        };

        void loadAttendance();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/member/login');
    };

    const status = getMembershipStatus(member);

    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <header className="border-b border-neutral-200">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
                    <BrandLogo subtitle="Member portal" />
                    <button type="button" onClick={handleLogout} className="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
                        Log out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
                <section>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {isLoading ? 'Loading…' : `Hi${member?.first_name ? `, ${member.first_name}` : ''}.`}
                    </h1>
                    <p className="mt-2 text-sm text-neutral-500">Your gym ID and membership details.</p>
                </section>

                {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
                        <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />
                        <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />
                    </div>
                ) : member && (
                    <>
                        <section className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
                            <article className="rounded-lg border border-neutral-200 p-6 sm:p-8">
                                <h2 className="text-xl font-semibold">{member.full_name}</h2>
                                <p className="mt-1 text-sm text-neutral-500">{member.phone}</p>

                                <dl className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
                                    <div className="flex items-center justify-between gap-4 py-3">
                                        <dt className="text-neutral-500">Member code</dt>
                                        <dd className="font-mono font-medium">{member.member_code}</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-3">
                                        <dt className="text-neutral-500">Status</dt>
                                        <dd>
                                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-3">
                                        <dt className="text-neutral-500">Expires</dt>
                                        <dd className="font-medium">{formatDate(member.expiry_date)}</dd>
                                    </div>
                                </dl>
                                <p className="mt-4 text-sm text-neutral-500">{status.detail}</p>
                            </article>

                            <article className="flex flex-col items-center rounded-lg border border-neutral-200 p-6 text-center sm:p-8">
                                <h2 className="font-semibold">Gym ID</h2>
                                <p className="mt-1 text-sm text-neutral-500">Show this at the front desk.</p>
                                <div className="mt-6">
                                    <QRCodeSVG value={member.member_code} size={196} level="M" includeMargin />
                                </div>
                                <p className="mt-3 text-xs text-neutral-400">Contains your member ID only.</p>
                            </article>
                        </section>

                        <section>
                            <div className="flex items-end justify-between gap-3 border-b border-neutral-200 pb-3">
                                <h2 className="font-semibold">Recent visits</h2>
                                <p className="text-sm text-neutral-500">Last 20 check-ins</p>
                            </div>
                            {attendanceError ? (
                                <p role="alert" className="py-6 text-sm text-red-700">{attendanceError}</p>
                            ) : isAttendanceLoading ? (
                                <p className="py-6 text-sm text-neutral-500">Loading your visits…</p>
                            ) : attendance.length === 0 ? (
                                <p className="py-6 text-sm text-neutral-500">Your check-ins will appear here after your first visit.</p>
                            ) : (
                                <ul className="divide-y divide-neutral-200">
                                    {attendance.map((visit) => (
                                        <li key={visit._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                                            <span>{visit.attendance_date}</span>
                                            <span className="tabular-nums text-neutral-500">{new Date(visit.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <p className="text-xs text-neutral-400">Need to update your account? Ask at the front desk.</p>
                    </>
                )}
            </main>
        </div>
    );
};

export default MemberDashboard;
