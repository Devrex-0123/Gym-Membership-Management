import { useEffect, useState } from 'react';
import API from '../utils/api';

const INPUT_CLASS = 'w-full rounded-xl border border-[#173B45]/15 bg-[#F8EDED]/35 px-4 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10';

const PricingManagement = () => {
    const [walkInRates, setWalkInRates] = useState([]);
    const [membershipRates, setMembershipRates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadRates = async () => {
            try {
                const { data } = await API.get('/settings/rates');
                setWalkInRates(data.walk_in_rates);
                setMembershipRates(data.membership_rates);
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load pricing settings');
            } finally {
                setIsLoading(false);
            }
        };

        void loadRates();
    }, []);

    const updateWalkInRate = (index, field, value) => {
        setWalkInRates((current) => current.map((rate, rateIndex) => (
            rateIndex === index ? { ...rate, [field]: value } : rate
        )));
        setMessage('');
        setError('');
    };

    const updateMembershipRate = (index, field, value) => {
        setMembershipRates((current) => current.map((rate, rateIndex) => (
            rateIndex === index ? { ...rate, [field]: value } : rate
        )));
        setMessage('');
        setError('');
    };

    const saveRates = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        setMessage('');

        try {
            const { data } = await API.put('/settings/rates', {
                walk_in_rates: walkInRates.map((rate) => ({
                    ...rate,
                    price: Number(rate.price)
                })),
                membership_rates: membershipRates.map((rate) => ({
                    ...rate,
                    price: Number(rate.price),
                    duration_days: Number(rate.duration_days)
                }))
            });
            setWalkInRates(data.walk_in_rates);
            setMembershipRates(data.membership_rates);
            setMessage('Pricing and membership packages saved. Cashier modules will use the updated rates.');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save pricing settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin module</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pricing & plans</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#173B45]/60">Manage the rates cashiers can select. Active prices are applied by the backend when a transaction is recorded.</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#173B45]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#173B45]/65">
                    <span className="h-2 w-2 rounded-full bg-[#FF8225]" />
                    Admin managed
                </div>
            </section>

            {message && <p role="status" className="rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-medium text-[#173B45] shadow-sm">{message}</p>}
            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

            {isLoading ? (
                <div className="space-y-5">
                    <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
                    <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
                </div>
            ) : (
                <form onSubmit={saveRates} className="space-y-6">
                    <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Day passes</p>
                                <h2 className="mt-2 text-xl font-black">Walk-in rates</h2>
                                <p className="mt-1 text-sm text-[#173B45]/55">Set the cashier’s quick-select categories and prices.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setWalkInRates((current) => [...current, { category_name: '', price: '', is_active: true }])}
                                className="w-fit rounded-xl border border-[#173B45]/15 px-4 py-2.5 text-sm font-bold transition hover:border-[#FF8225] hover:bg-[#FF8225]/[0.06]"
                            >
                                + Add walk-in rate
                            </button>
                        </div>

                        <div className="space-y-3">
                            {walkInRates.map((rate, index) => (
                                <article key={`walk-in-${index}`} className={`grid gap-4 rounded-xl border p-4 md:grid-cols-[1.4fr_0.7fr_auto] md:items-end ${rate.is_active ? 'border-[#173B45]/10 bg-[#F8EDED]/25' : 'border-[#173B45]/[0.06] bg-gray-50 opacity-70'}`}>
                                    <div>
                                        <label htmlFor={`walk-in-name-${index}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#173B45]/55">Category name</label>
                                        <input id={`walk-in-name-${index}`} type="text" maxLength={80} required value={rate.category_name} onChange={(event) => updateWalkInRate(index, 'category_name', event.target.value)} className={INPUT_CLASS} placeholder="e.g. Morning Promo" />
                                    </div>
                                    <div>
                                        <label htmlFor={`walk-in-price-${index}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#173B45]/55">Price (₱)</label>
                                        <input id={`walk-in-price-${index}`} type="number" min="0" step="0.01" required value={rate.price} onChange={(event) => updateWalkInRate(index, 'price', event.target.value)} className={INPUT_CLASS} />
                                    </div>
                                    <label className="flex items-center gap-3 rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-semibold">
                                        <input type="checkbox" checked={rate.is_active} onChange={(event) => updateWalkInRate(index, 'is_active', event.target.checked)} className="h-4 w-4 accent-[#FF8225]" />
                                        Active
                                    </label>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">Memberships</p>
                                <h2 className="mt-2 text-xl font-black">Packages & durations</h2>
                                <p className="mt-1 text-sm text-[#173B45]/55">Cashiers can sell active packages to new and renewing members.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMembershipRates((current) => [...current, { package_name: '', duration_days: '', price: '', is_active: true }])}
                                className="w-fit rounded-xl border border-[#173B45]/15 px-4 py-2.5 text-sm font-bold transition hover:border-[#FF8225] hover:bg-[#FF8225]/[0.06]"
                            >
                                + Add package
                            </button>
                        </div>

                        <div className="space-y-3">
                            {membershipRates.map((rate, index) => (
                                <article key={`membership-${index}`} className={`grid gap-4 rounded-xl border p-4 md:grid-cols-[1.2fr_0.6fr_0.7fr_auto] md:items-end ${rate.is_active ? 'border-[#173B45]/10 bg-[#F8EDED]/25' : 'border-[#173B45]/[0.06] bg-gray-50 opacity-70'}`}>
                                    <div>
                                        <label htmlFor={`membership-name-${index}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#173B45]/55">Package name</label>
                                        <input id={`membership-name-${index}`} type="text" maxLength={80} required value={rate.package_name} onChange={(event) => updateMembershipRate(index, 'package_name', event.target.value)} className={INPUT_CLASS} placeholder="e.g. Monthly" />
                                    </div>
                                    <div>
                                        <label htmlFor={`membership-days-${index}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#173B45]/55">Duration (days)</label>
                                        <input id={`membership-days-${index}`} type="number" min="1" step="1" required value={rate.duration_days} onChange={(event) => updateMembershipRate(index, 'duration_days', event.target.value)} className={INPUT_CLASS} />
                                    </div>
                                    <div>
                                        <label htmlFor={`membership-price-${index}`} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#173B45]/55">Price (₱)</label>
                                        <input id={`membership-price-${index}`} type="number" min="0" step="0.01" required value={rate.price} onChange={(event) => updateMembershipRate(index, 'price', event.target.value)} className={INPUT_CLASS} />
                                    </div>
                                    <label className="flex items-center gap-3 rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-semibold">
                                        <input type="checkbox" checked={rate.is_active} onChange={(event) => updateMembershipRate(index, 'is_active', event.target.checked)} className="h-4 w-4 accent-[#FF8225]" />
                                        Active
                                    </label>
                                </article>
                            ))}
                        </div>
                    </section>

                    <div className="flex flex-col justify-between gap-3 rounded-2xl bg-[#173B45] p-5 text-white sm:flex-row sm:items-center sm:px-7">
                        <p className="text-sm text-white/65">Inactive rates are hidden from cashiers. Existing transactions keep their recorded price.</p>
                        <button type="submit" disabled={isSaving} className="rounded-xl bg-[#FF8225] px-6 py-3.5 text-sm font-bold text-[#173B45] shadow-md shadow-[#FF8225]/15 transition hover:-translate-y-0.5 hover:bg-[#f77718] disabled:cursor-not-allowed disabled:opacity-60">
                            {isSaving ? 'Saving rates…' : 'Save pricing changes'}
                        </button>
                    </div>
                </form>
            )}
        </>
    );
};

export default PricingManagement;
