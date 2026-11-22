import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const submitHandler = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const { data } = await API.post('/auth/staff-login', { username, password });
            localStorage.setItem('userInfo', JSON.stringify(data));

            if (data.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/cashier/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8EDED] p-4 sm:p-8">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_-35px_rgba(23,59,69,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-[#173B45] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute -right-28 -top-20 h-80 w-80 rounded-full border-[48px] border-white/5" />
                    <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-[#B43F3F]/30 blur-2xl" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF8225] text-lg font-black text-[#173B45]">GY</div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.2em]">Forge Fitness</p>
                            <p className="text-xs text-white/55">Gym management</p>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-lg py-16">
                        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FFB276]">
                            <span className="h-2 w-2 rounded-full bg-[#FF8225]" />
                            Your front desk, in sync
                        </p>
                        <h1 className="text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
                            Stronger service.
                            <span className="mt-2 block text-[#FF8225]">Smoother days.</span>
                        </h1>
                        <p className="mt-6 max-w-md text-base leading-7 text-white/65">
                            Keep memberships moving, check in members, and manage your gym from one simple workspace.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/45">
                        <span>Built for the people who keep you moving.</span>
                        <span>01 / 01</span>
                    </div>
                </section>

                <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
                    <div className="w-full max-w-md">
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FF8225] font-black text-[#173B45]">GY</div>
                            <div>
                                <p className="font-bold text-[#173B45]">Forge Fitness</p>
                                <p className="text-xs text-[#173B45]/55">Gym management</p>
                            </div>
                        </div>

                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#B43F3F]">Staff portal</p>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#173B45] sm:text-4xl">Welcome back</h2>
                        <p className="mt-3 text-sm leading-6 text-[#173B45]/60">Sign in with your staff account to access your dashboard.</p>

                        {error && (
                            <div role="alert" className="mt-6 rounded-xl border border-[#B43F3F]/20 bg-[#B43F3F]/[0.07] px-4 py-3 text-sm font-medium text-[#9F3434]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={submitHandler} className="mt-8 space-y-5">
                            <div>
                                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#173B45]">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/45 px-4 py-3.5 text-[#173B45] outline-none transition placeholder:text-[#173B45]/35 focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/15"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#173B45]">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/45 px-4 py-3.5 text-[#173B45] outline-none transition placeholder:text-[#173B45]/35 focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/15"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF8225] px-5 py-4 font-bold text-[#173B45] shadow-lg shadow-[#FF8225]/20 transition hover:-translate-y-0.5 hover:bg-[#f77718] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? 'Signing in…' : 'Sign in to your account'}
                                {!isSubmitting && <span aria-hidden="true">→</span>}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs text-[#173B45]/45">Authorized gym staff only</p>
                        <p className="mt-4 text-center text-sm text-[#173B45]/60">
                            Member? <Link to="/member/login" className="font-bold text-[#B43F3F] hover:underline">Check your membership</Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;
