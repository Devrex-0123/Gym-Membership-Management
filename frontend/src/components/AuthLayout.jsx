import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export const AUTH_INPUT_CLASS =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const AuthLayout = ({ title, description, error, footer, children }) => (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
            <Link to="/" aria-label="NexGym home">
                <BrandLogo />
            </Link>
            <Link to="/" className="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
                Back to site
            </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-24 pt-8">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-2 text-sm text-neutral-500">{description}</p>

                {error && (
                    <p role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {children}

                <p className="mt-8 text-sm text-neutral-500">{footer}</p>
            </div>
        </main>
    </div>
);

export default AuthLayout;
