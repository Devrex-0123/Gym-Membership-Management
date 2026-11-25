import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import BrandLogo from '../components/BrandLogo';
import gymPromotion from '../assets/Black & Yellow Minimalist Fitness & Gym Promotion Instagram Post.png';
import trainingPromotion from '../assets/Black & Yellow Minimalist Fitness & Gym Promotion Instagram Post (1).png';
import memberPromotion from '../assets/Black & Yellow Minimalist Fitness & Gym Promotion Instagram Post (2).png';

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

const CAROUSEL_IMAGES = [
    { src: gymPromotion, alt: 'NexGym promotion featuring strength training' },
    { src: trainingPromotion, alt: 'NexGym promotion featuring a member training' },
    { src: memberPromotion, alt: 'NexGym promotion inviting members to start training' },
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
    const [activeSlide, setActiveSlide] = useState(0);
    const [slideDirection, setSlideDirection] = useState('next');
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [rates, setRates] = useState({ membership_rates: [], walk_in_rates: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const tickerItems = [
        ...rates.membership_rates.map((plan) => ({
            id: `membership-${plan.package_name}`,
            label: plan.package_name,
            detail: `${plan.duration_days} days`,
            price: plan.price,
        })),
        ...rates.walk_in_rates.map((rate) => ({
            id: `day-pass-${rate.category_name}`,
            label: `${rate.category_name} Day Pass`,
            detail: '',
            price: rate.price,
        })),
    ];

    const moveSlide = (direction) => {
        setSlideDirection(direction > 0 ? 'next' : 'previous');
        setActiveSlide((current) => (current + direction + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    };

    const showSlide = (index) => {
        const forwardDistance = (index - activeSlide + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
        if (forwardDistance === 0) {
            return;
        }

        const distance = forwardDistance <= CAROUSEL_IMAGES.length / 2 ? forwardDistance : forwardDistance - CAROUSEL_IMAGES.length;
        setSlideDirection(distance > 0 ? 'next' : 'previous');
        setActiveSlide(index);
    };

    useEffect(() => {
        if (!isAutoPlaying) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setSlideDirection('next');
            setActiveSlide((current) => (current + 1) % CAROUSEL_IMAGES.length);
        }, 5000);
        return () => window.clearTimeout(timer);
    }, [activeSlide, isAutoPlaying]);

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
            {tickerItems.length > 0 && (
                <div
                    className="pricing-marquee sticky top-0 z-30 overflow-hidden bg-neutral-900 py-3 text-white"
                    role="region"
                    aria-label="Current membership and day-pass prices"
                >
                    <div className="pricing-marquee__track flex w-max items-center">
                        {[false, true].map((isDuplicate) => (
                            <ul
                                key={isDuplicate ? 'duplicate' : 'prices'}
                                className={`flex min-w-[100vw] shrink-0 items-center justify-around gap-8 px-4 ${
                                    isDuplicate ? 'pricing-marquee__duplicate' : ''
                                }`}
                                aria-hidden={isDuplicate}
                            >
                                {tickerItems.map((item) => (
                                    <li key={`${isDuplicate ? 'duplicate-' : ''}${item.id}`} className="flex items-center gap-8 whitespace-nowrap">
                                        <span className="text-amber-300" aria-hidden="true">◆</span>
                                        <span className="font-medium">{item.label}</span>
                                        {item.detail && <span className="text-sm text-neutral-300">{item.detail}</span>}
                                        <span className="tabular-nums">{formatPrice(item.price)}</span>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
            )}

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

            <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 content-start gap-y-16 px-6 pb-16 lg:grid-cols-2 lg:items-center lg:gap-x-20 lg:gap-y-20 lg:px-10">
                <section className="pt-12 sm:pt-16 lg:pt-20">
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

                <section
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="NexGym promotional images"
                    aria-live={isAutoPlaying ? 'off' : 'polite'}
                    className="w-full"
                >
                    <h2 className="sr-only">Facility overview</h2>
                    <div className="relative mx-auto max-w-md px-3 py-4">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-5 rotate-3 rounded-2xl bg-neutral-200 shadow-md" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-3 -rotate-2 rounded-2xl bg-white shadow-lg" />
                        <div className="relative z-10 overflow-hidden rounded-2xl border-[8px] border-white bg-white shadow-xl">
                            <div className="relative aspect-[4/5]">
                                {CAROUSEL_IMAGES.map((image, index) => {
                                    const position = index === activeSlide
                                        ? 0
                                        : index === (activeSlide + 1) % CAROUSEL_IMAGES.length
                                            ? 100
                                            : -100;
                                    return (
                                        <div
                                            key={image.src}
                                            role="group"
                                            aria-roledescription="slide"
                                            aria-label={`${index + 1} of ${CAROUSEL_IMAGES.length}`}
                                            aria-hidden={index !== activeSlide}
                                            className="carousel-slide absolute inset-0"
                                            style={{ transform: `translateX(${position}%)` }}
                                        >
                                            <img
                                                src={image.src}
                                                alt={image.alt}
                                                loading="eager"
                                                className={`h-full w-full object-cover ${
                                                    index === activeSlide ? `album-slide--${slideDirection}` : ''
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => moveSlide(-1)}
                                aria-label="Show previous image"
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xl transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                            >
                                <span aria-hidden="true">&larr;</span>
                            </button>

                            <div role="group" aria-label="Choose image" className="flex items-center justify-center gap-2">
                                {CAROUSEL_IMAGES.map((image, index) => (
                                    <button
                                        key={image.src}
                                        type="button"
                                        onClick={() => showSlide(index)}
                                        aria-label={`Show image ${index + 1}`}
                                        aria-current={activeSlide === index ? 'true' : undefined}
                                        className={`h-3 w-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                                            activeSlide === index ? 'bg-neutral-900' : 'bg-neutral-300 hover:bg-neutral-500'
                                        }`}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAutoPlaying((playing) => !playing)}
                                aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-sm transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                            >
                                <span aria-hidden="true">{isAutoPlaying ? 'Ⅱ' : '▶'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => moveSlide(1)}
                                aria-label="Show next image"
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xl transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                            >
                                <span aria-hidden="true">&rarr;</span>
                            </button>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="rates-heading" className="w-full lg:col-span-2">
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
