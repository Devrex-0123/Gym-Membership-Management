import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import BrandLogo from '../components/BrandLogo';

const formatPrice = (price) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(price);

const RATE_TABS = [
    { id: 'memberships', label: 'Memberships' },
    { id: 'walkin', label: 'Day passes' },
];

const RateList = ({ items, isLoading, error, emptyMessage, getName, getDetail }) => {
    if (isLoading) {
        return (
            <div aria-label="Loading rates" aria-busy="true" className="divide-y divide-neutral-200">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center justify-between py-5">
                        <div className="space-y-2">
                            <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
                            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
                        </div>
                        <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p role="alert" className="py-6 text-sm text-neutral-600">
                {error}
            </p>
        );
    }

    if (items.length === 0) {
        return <p className="py-6 text-sm text-neutral-500">{emptyMessage}</p>;
    }

    return (
        <ul className="divide-y divide-neutral-200">
            {items.map((item) => (
                <li key={getName(item)} className="flex items-baseline justify-between gap-6 py-5">
                    <div className="min-w-0">
                        <p className="truncate font-medium">{getName(item)}</p>
                        {getDetail && <p className="mt-1 text-sm text-neutral-500">{getDetail(item)}</p>}
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">{formatPrice(item.price)}</span>
                </li>
            ))}
        </ul>
    );
};

const LandingPage = () => {
    const [rateTab, setRateTab] = useState('memberships');
    const [rates, setRates] = useState({ membership_rates: [], walk_in_rates: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadRates = async () => {
            try {
                const { data } = await API.get('/settings/public-rates');
                if (isMounted) {
                    setRates(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                            'Current rates are temporarily unavailable. Please check with the front desk.'
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadRates();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
                <Link to="/" aria-label="NexGym home">
                    <BrandLogo />
                </Link>
                <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
                    <Link to="/staff/login" className="text-neutral-500 transition-colors hover:text-neutral-900">
                        Staff
                    </Link>
                    <Link to="/member/login" className="font-medium hover:underline">
                        Member sign in
                    </Link>
                </nav>
            </header>

            <main className="mx-auto grid w-full max-w-7xl flex-1 gap-16 px-6 lg:grid-cols-12 lg:gap-20 lg:px-10">
                <section className="pt-16 sm:pt-24 lg:col-span-6 lg:pb-24 lg:pt-32">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">Train at NexGym.</h1>
                    <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-500">
                        Memberships and day passes. Sign up and renew at the front desk.
                    </p>
                    <Link
                        to="/member/login"
                        className="mt-10 inline-flex items-center rounded-md bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                        Member sign in
                    </Link>
                </section>

                <section aria-labelledby="rates-heading" className="pb-24 lg:col-span-6 lg:pt-32">
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-3">
                        <h2 id="rates-heading" className="text-sm font-medium text-neutral-500">
                            Rates
                        </h2>
                        <div role="tablist" aria-label="Rate categories" className="flex gap-6 text-sm">
                            {RATE_TABS.map((tab) => {
                                const isActive = rateTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setRateTab(tab.id)}
                                        className={`-mb-[13px] border-b pb-3 transition-colors ${
                                            isActive
                                                ? 'border-neutral-900 font-medium text-neutral-900'
                                                : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {rateTab === 'memberships' ? (
                        <RateList
                            items={rates.membership_rates}
                            isLoading={isLoading}
                            error={error}
                            emptyMessage="No membership packages are listed right now. Ask at the front desk."
                            getName={(plan) => plan.package_name}
                            getDetail={(plan) => `${plan.duration_days} days`}
                        />
                    ) : (
                        <RateList
                            items={rates.walk_in_rates}
                            isLoading={isLoading}
                            error={error}
                            emptyMessage="No day passes are listed right now. Ask at the front desk."
                            getName={(rate) => rate.category_name}
                            getDetail={() => 'Single day'}
                        />
                    )}

                    <p className="mt-6 text-xs text-neutral-400">Prices in PHP.</p>
                </section>
            </main>

            <footer className="mx-auto flex w-full max-w-7xl items-center justify-between border-t border-neutral-200 px-6 py-8 text-xs text-neutral-400 lg:px-10">
                <p>© {new Date().getFullYear()} NexGym</p>
                <Link to="/staff/login" className="transition-colors hover:text-neutral-900">
                    Staff sign in
                </Link>
            </footer>
        </div>
    );
};

export default LandingPage;
