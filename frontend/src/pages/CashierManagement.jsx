import { useState } from 'react';
import API from '../utils/api';

const INITIAL_STAFF = { username: '', password: '', full_name: '', role: 'cashier', shift_tag: 'morning' };

const CashierManagement = () => {
    const [newStaff, setNewStaff] = useState(INITIAL_STAFF);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitStaffHandler = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setError('');
        try {
            await API.post('/auth/register-staff', newStaff);
            setMessage('Cashier account created successfully.');
            setNewStaff(INITIAL_STAFF);
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating staff account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Cashier accounts</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Create a staff login and assign a shift.</p>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="relative overflow-hidden rounded-2xl bg-[#173B45] p-7 text-white shadow-xl shadow-[#173B45]/10">
                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[30px] border-white/[0.06]" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB276]">Team access</p>
                        <h2 className="mt-3 text-2xl font-black">Build your front-desk team.</h2>
                        <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Cashiers can process walk-ins, manage member accounts, and review their recent transactions.</p>
                        <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
                            <div className="flex -space-x-2">
                                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#173B45] bg-[#FF8225] text-xs font-bold text-[#173B45]">GY</span>
                                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#173B45] bg-[#B43F3F] text-xs font-bold">+</span>
                            </div>
                            <span className="text-xs text-white/55">Admin-managed accounts</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">New team member</p>
                            <h2 className="mt-2 text-xl font-black">Add a cashier</h2>
                            <p className="mt-1 text-sm text-[#173B45]/55">Set up staff access in a few steps.</p>
                        </div>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F8EDED] text-xl text-[#B43F3F]">＋</span>
                    </div>

                    {message && <p role="status" className="mb-5 rounded-xl border border-[#173B45]/10 bg-[#173B45]/[0.04] px-4 py-3 text-sm font-medium text-[#173B45]">{message}</p>}
                    {error && <p role="alert" className="mb-5 rounded-xl border border-[#B43F3F]/20 bg-[#B43F3F]/[0.06] px-4 py-3 text-sm font-medium text-[#B43F3F]">{error}</p>}

                    <form onSubmit={submitStaffHandler} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="staff-full-name" className="mb-1.5 block text-sm font-semibold">Full name</label>
                            <input
                                id="staff-full-name"
                                type="text"
                                autoComplete="name"
                                placeholder="e.g. Alex Rivera"
                                required
                                className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/35 px-4 py-3 text-sm outline-none transition placeholder:text-[#173B45]/35 focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10"
                                value={newStaff.full_name}
                                onChange={(event) => setNewStaff({ ...newStaff, full_name: event.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="staff-username" className="mb-1.5 block text-sm font-semibold">Username</label>
                            <input
                                id="staff-username"
                                type="text"
                                autoComplete="username"
                                placeholder="Choose a username"
                                required
                                className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/35 px-4 py-3 text-sm outline-none transition placeholder:text-[#173B45]/35 focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10"
                                value={newStaff.username}
                                onChange={(event) => setNewStaff({ ...newStaff, username: event.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold">Temporary password</label>
                            <input
                                id="staff-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="At least 6 characters"
                                required
                                minLength={6}
                                className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/35 px-4 py-3 text-sm outline-none transition placeholder:text-[#173B45]/35 focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10"
                                value={newStaff.password}
                                onChange={(event) => setNewStaff({ ...newStaff, password: event.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="staff-shift" className="mb-1.5 block text-sm font-semibold">Assigned shift</label>
                            <select
                                id="staff-shift"
                                className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/35 px-4 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10"
                                value={newStaff.shift_tag}
                                onChange={(event) => setNewStaff({ ...newStaff, shift_tag: event.target.value })}
                            >
                                <option value="morning">Morning shift</option>
                                <option value="afternoon">Afternoon shift</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#FF8225] px-5 py-3.5 text-sm font-bold text-[#173B45] shadow-md shadow-[#FF8225]/15 transition hover:-translate-y-0.5 hover:bg-[#f77718] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                        >
                            {isSubmitting ? 'Creating account…' : 'Create cashier account'}
                            {!isSubmitting && <span aria-hidden="true">→</span>}
                        </button>
                    </form>
                </div>
            </section>
        </>
    );
};

export default CashierManagement;
