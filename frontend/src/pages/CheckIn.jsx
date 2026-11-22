import { useEffect, useRef, useState } from 'react';
import API from '../utils/api';

const INPUT_CLASS = 'w-full rounded-xl border border-[#173B45]/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10';

const CheckIn = () => {
    const [memberCode, setMemberCode] = useState('');
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isStartingScanner, setIsStartingScanner] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [scannerError, setScannerError] = useState('');
    const [listError, setListError] = useState('');
    const [reloadToken, setReloadToken] = useState(0);
    const [lastCheckIn, setLastCheckIn] = useState(null);
    const videoRef = useRef(null);
    const scannerControlsRef = useRef(null);
    const checkInLockRef = useRef(false);
    const scanHitRef = useRef(false);

    useEffect(() => {
        const loadTodayAttendance = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/attendance/today');
                setTodayAttendance(data);
                setListError('');
            } catch (err) {
                setListError(err.response?.data?.message || 'Could not load today’s attendance');
            } finally {
                setIsLoading(false);
            }
        };

        void loadTodayAttendance();
    }, [reloadToken]);

    useEffect(() => () => scannerControlsRef.current?.stop(), []);

    const stopScanner = () => {
        scanHitRef.current = true;
        scannerControlsRef.current?.stop();
        scannerControlsRef.current = null;
        setIsScanning(false);
    };

    const handleCheckIn = async (value) => {
        const code = value.trim().toUpperCase();
        if (!code) {
            setError('Enter or scan a member code first.');
            return;
        }
        if (checkInLockRef.current) return;

        stopScanner();
        checkInLockRef.current = true;
        setIsCheckingIn(true);
        setError('');
        setMessage('');
        setLastCheckIn(null);
        try {
            const { data } = await API.post('/attendance/check-in', { member_code: code });
            setLastCheckIn(data);
            setMessage(data.message);
            setMemberCode('');
            setReloadToken((current) => current + 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not check in this member');
        } finally {
            checkInLockRef.current = false;
            setIsCheckingIn(false);
        }
    };

    const startScanner = async () => {
        if (!videoRef.current || isStartingScanner) return;
        scanHitRef.current = false;
        setIsStartingScanner(true);
        setScannerError('');
        try {
            const { BrowserMultiFormatReader } = await import('@zxing/browser');
            const reader = new BrowserMultiFormatReader();
            const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                if (!result || scanHitRef.current) return;
                scanHitRef.current = true;
                stopScanner();
                void handleCheckIn(result.getText());
            });
            scannerControlsRef.current = controls;
            if (scanHitRef.current) {
                controls.stop();
            } else {
                setIsScanning(true);
            }
        } catch (err) {
            setScannerError(err.message || 'Camera access failed. Enter the member code manually instead.');
            setIsScanning(false);
        } finally {
            setIsStartingScanner(false);
        }
    };

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Cashier module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Member check-in</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Scan a member’s gym ID or enter their code to record today’s visit.</p>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <article className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Check in a member</p>
                    <h2 className="mt-2 text-xl font-black">Scan their QR code</h2>
                    <p className="mt-2 text-sm leading-6 text-[#173B45]/55">Only members with an active, unexpired membership can check in. A second check-in on the same day won’t create another visit.</p>

                    <div className="mt-5 space-y-3">
                        <div className="relative overflow-hidden rounded-xl bg-[#173B45]">
                            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                            {!isScanning && <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/65">Camera preview appears here while scanning.</p>}
                        </div>
                        {scannerError && <p role="alert" className="rounded-xl bg-[#B43F3F]/[0.07] px-4 py-3 text-sm text-[#B43F3F]">{scannerError}</p>}
                        {isScanning ? (
                            <button type="button" onClick={stopScanner} className="w-full rounded-xl border border-[#173B45]/15 px-4 py-3 text-sm font-bold transition hover:border-[#FF8225]">Stop camera</button>
                        ) : (
                            <button type="button" onClick={startScanner} disabled={isCheckingIn || isStartingScanner} className="w-full rounded-xl bg-[#173B45] px-4 py-3 font-bold text-white transition hover:bg-[#214e5a] disabled:opacity-50">
                                {isStartingScanner ? 'Starting camera…' : 'Open camera scanner'}
                            </button>
                        )}
                    </div>

                    <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#173B45]/35">
                        <span className="h-px flex-1 bg-[#173B45]/10" />
                        or enter the code
                        <span className="h-px flex-1 bg-[#173B45]/10" />
                    </div>

                    <form onSubmit={(event) => { event.preventDefault(); void handleCheckIn(memberCode); }} className="space-y-3">
                        <label htmlFor="member-code" className="block text-sm font-semibold">Member code</label>
                        <input
                            id="member-code"
                            type="text"
                            autoComplete="off"
                            maxLength={32}
                            value={memberCode}
                            onChange={(event) => setMemberCode(event.target.value.toUpperCase())}
                            placeholder="e.g. GYM-1001"
                            className={`${INPUT_CLASS} font-mono uppercase`}
                        />
                        <button type="submit" disabled={isCheckingIn || !memberCode.trim()} className="w-full rounded-xl bg-[#FF8225] px-4 py-3 font-bold text-[#173B45] transition hover:bg-[#f77718] disabled:cursor-not-allowed disabled:opacity-50">
                            {isCheckingIn ? 'Checking in…' : 'Check in member'}
                        </button>
                    </form>

                    {error && <p role="alert" className="mt-4 rounded-xl border border-[#B43F3F]/20 bg-[#B43F3F]/[0.07] px-4 py-3 text-sm font-medium text-[#B43F3F]">{error}</p>}
                    {message && lastCheckIn && (
                        <div role="status" className={`mt-4 rounded-xl px-4 py-3 ${lastCheckIn.alreadyCheckedIn ? 'bg-[#FF8225]/15 text-[#70400f]' : 'bg-[#173B45]/[0.07] text-[#173B45]'}`}>
                            <p className="font-bold">{message}</p>
                            <p className="mt-1 text-sm">{lastCheckIn.member.member_code} · Membership {lastCheckIn.member.membership_status}</p>
                        </div>
                    )}
                </article>

                <article className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                        <div>
                            <h2 className="font-black">Today’s check-ins</h2>
                            <p className="mt-1 text-sm text-[#173B45]/55">{isLoading ? 'Loading…' : `Latest ${todayAttendance.length} check-in(s)`}</p>
                        </div>
                        <span className="rounded-full bg-[#F8EDED] px-3 py-1 text-xs font-bold text-[#B43F3F]">TODAY</span>
                    </div>
                    {listError && <p role="alert" className="m-5 rounded-xl bg-[#B43F3F]/[0.07] px-4 py-3 text-sm text-[#B43F3F]">{listError}</p>}
                    {isLoading ? (
                        <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">Loading check-ins…</p>
                    ) : todayAttendance.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">No members have checked in today.</p>
                    ) : (
                        <ul className="divide-y divide-[#173B45]/[0.06]">
                            {todayAttendance.map((record) => (
                                <li key={record._id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
                                    <div className="min-w-0">
                                        <p className="truncate font-bold">{record.member_id?.first_name} {record.member_id?.last_name}</p>
                                        <p className="mt-1 font-mono text-xs text-[#173B45]/50">{record.member_id?.member_code}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold">{new Date(record.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}</p>
                                        <p className="mt-1 text-xs text-[#173B45]/45">{record.checked_in_by?.full_name || 'Staff'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </section>
        </>
    );
};

export default CheckIn;
