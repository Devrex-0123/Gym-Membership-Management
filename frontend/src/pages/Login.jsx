import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import AuthLayout, { AUTH_INPUT_CLASS } from '../components/AuthLayout';

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
        <AuthLayout
            title="Staff sign in"
            description="For gym staff only."
            error={error}
            footer={
                <>
                    Member?{' '}
                    <Link to="/member/login" className="font-medium text-neutral-900 hover:underline">
                        Member sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={submitHandler} className="mt-8 space-y-5">
                <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-medium">Username</label>
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className={AUTH_INPUT_CLASS}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={AUTH_INPUT_CLASS}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </AuthLayout>
    );
};

export default Login;
