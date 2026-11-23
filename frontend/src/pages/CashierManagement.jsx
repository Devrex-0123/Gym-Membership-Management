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
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cashier accounts</h1>
                <p className="mt-2 text-sm text-neutral-500">Create a staff login and assign a shift.</p>
            </section>

            <section className="max-w-2xl">
                <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
                    <h2 className="mb-6 text-lg font-semibold">Add a cashier</h2>

                    {message && <p role="status" className="mb-5 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-900">{message}</p>}
                    {error && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

                    <form onSubmit={submitStaffHandler} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label htmlFor="staff-full-name" className="mb-1.5 block text-sm font-semibold">Full name</label>
                            <input
                                id="staff-full-name"
                                type="text"
                                autoComplete="name"
                                placeholder="e.g. Alex Rivera"
                                required
                                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
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
                                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
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
                                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
                                value={newStaff.password}
                                onChange={(event) => setNewStaff({ ...newStaff, password: event.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="staff-shift" className="mb-1.5 block text-sm font-semibold">Assigned shift</label>
                            <select
                                id="staff-shift"
                                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900"
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
                            className="mt-1 flex items-center justify-center gap-2 rounded-md bg-neutral-900 text-white px-5 py-3.5 text-sm font-semibold transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                        >
                            {isSubmitting ? 'Creating account…' : 'Create cashier account'}
                        </button>
                    </form>
                </div>
            </section>
        </>
    );
};

export default CashierManagement;
