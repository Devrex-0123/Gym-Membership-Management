import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import API from '../utils/api';

const getMembershipStatus = (member) => {
    if (!member?.expiry_date || member.membership_status === 'none') {
        return {
            label: 'No active membership',
            detail: 'Visit the front desk to choose a membership package.',
            className: 'bg-[#173B45]/[0.08] text-[#173B45]/75'
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
            className: 'bg-[#B43F3F]/10 text-[#B43F3F]'
        };
    }
    if (daysRemaining <= 7) {
        return {
            label: 'Expiring soon',
            detail: daysRemaining === 0 ? 'Your membership expires today.' : `${daysRemaining} day(s) remaining. Plan your renewal soon.`,
            className: 'bg-[#FF8225]/15 text-[#9A4A0C]'
        };
    }
    return {
        label: 'Active membership',
        detail: `${daysRemaining} days remaining. Keep showing up.`,
        className: 'bg-[#173B45]/10 text-[#173B45]'
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
        <div className="min-h-screen bg-[#F8EDED] text-[#173B45]">
            <header className="bg-[#173B45] text-white shadow-lg shadow-[#173B45]/10">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FF8225] font-black text-[#173B45]">GY</div>
                        <div>
                            <p className="font-bold tracking-tight">Forge Fitness</p>
                            <p className="text-xs text-white/55">Member portal</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold transition hover:border-[#FF8225] hover:bg-white/5">
                        Log out
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-9">
                <section className="relative overflow-hidden rounded-[1.75rem] bg-[#173B45] px-6 py-7 text-white shadow-xl shadow-[#173B45]/10 sm:px-9 sm:py-9">
                    <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[42px] border-white/[0.06]" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB276]">Your membership</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {isLoading ? 'Loading your member space…' : `Hey${member?.first_name ? `, ${member.first_name}` : ''}.`}
                        </h1>
                        <p className="mt-2 text-sm text-white/60">Your gym ID and membership details, ready whenever you need them.</p>
                    </div>
                </section>

                {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-[1fr_0.85fr]">
                        <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
                        <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
                    </div>
                ) : member && (
                    <>
                        <section className="grid gap-6 md:grid-cols-[1fr_0.85fr]">
                            <article className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Member profile</p>
                                        <h2 className="mt-2 text-2xl font-black">{member.full_name}</h2>
                                        <p className="mt-1 text-sm text-[#173B45]/55">{member.phone}</p>
                                    </div>
                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FF8225]/15 text-lg font-black text-[#B43F3F]">
                                        {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                                    </span>
                                </div>

                                <div className="mt-7 rounded-xl bg-[#F8EDED]/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#173B45]/45">Member code</p>
                                    <p className="mt-1 font-mono text-xl font-black tracking-wide">{member.member_code}</p>
                                </div>

                                <div className="mt-5">
                                    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${status.className}`}>{status.label}</span>
                                    <p className="mt-3 text-sm leading-6 text-[#173B45]/60">{status.detail}</p>
                                </div>

                                <div className="mt-6 border-t border-[#173B45]/[0.07] pt-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#173B45]/45">Membership expiry</p>
                                    <p className="mt-1 text-lg font-bold">{formatDate(member.expiry_date)}</p>
                                </div>
                            </article>

                            <article className="flex flex-col items-center rounded-2xl border border-[#173B45]/[0.06] bg-white p-6 text-center shadow-sm sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Digital gym ID</p>
                                <h2 className="mt-2 text-xl font-black">Scan at the front desk</h2>
                                <p className="mt-1 text-sm text-[#173B45]/55">Show this code when you visit.</p>
                                <div className="mt-5 rounded-2xl border border-[#173B45]/[0.07] bg-white p-3">
                                    <QRCodeSVG value={member.member_code} size={196} level="M" includeMargin />
                                </div>
                                <p className="mt-3 text-xs text-[#173B45]/45">This QR code contains your member ID only.</p>
                            </article>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                                <div>
                                    <h2 className="font-black">Recent visits</h2>
                                    <p className="mt-1 text-sm text-[#173B45]/55">Your latest 20 recorded check-ins</p>
                                </div>
                                <span className="rounded-full bg-[#F8EDED] px-3 py-1 text-xs font-bold text-[#B43F3F]">ATTENDANCE</span>
                            </div>
                            {attendanceError ? (
                                <p role="alert" className="m-5 rounded-xl bg-[#B43F3F]/[0.07] px-4 py-3 text-sm text-[#B43F3F]">{attendanceError}</p>
                            ) : isAttendanceLoading ? (
                                <p className="px-5 py-6 text-sm text-[#173B45]/55 sm:px-7">Loading your visits…</p>
                            ) : attendance.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-[#173B45]/55 sm:px-7">Your check-ins will appear here after your first visit.</p>
                            ) : (
                                <ul className="divide-y divide-[#173B45]/[0.06]">
                                    {attendance.map((visit) => (
                                        <li key={visit._id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                                            <div>
                                                <p className="font-semibold">{visit.attendance_date}</p>
                                            </div>
                                            <p className="text-sm font-bold">{new Date(visit.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <p className="text-center text-xs text-[#173B45]/45">Need help? Ask the front desk to update your account or membership.</p>
                    </>
                )}
            </main>
        </div>
    );
};

export default MemberDashboard;
