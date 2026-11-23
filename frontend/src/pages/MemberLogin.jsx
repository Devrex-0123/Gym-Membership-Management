import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import AuthLayout, { AUTH_INPUT_CLASS } from '../components/AuthLayout';

const MemberLogin = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const submitHandler = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const { data } = await API.post('/auth/member-login', { phone: phone.trim(), password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/member/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Could not sign in');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Member sign in"
            description="Use the phone number and password from your registration."
            error={error}
            footer={
                <>
                    Staff?{' '}
                    <Link to="/staff/login" className="font-medium text-neutral-900 hover:underline">
                        Staff sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={submitHandler} className="mt-8 space-y-5">
                <div>
                    <label htmlFor="member-login-phone" className="mb-1.5 block text-sm font-medium">Phone number</label>
                    <input
                        id="member-login-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className={AUTH_INPUT_CLASS}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="member-login-password" className="mb-1.5 block text-sm font-medium">Password</label>
                    <input
                        id="member-login-password"
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

export default MemberLogin;
