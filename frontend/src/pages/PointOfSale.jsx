import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAYMENT_METHODS = ['cash', 'gcash', 'paymaya', 'card'];
const RATE_STYLES = [
    'bg-[#FF8225] hover:bg-[#f77718] text-[#173B45]',
    'bg-[#B43F3F] hover:bg-[#9f3434] text-white',
    'bg-[#173B45] hover:bg-[#214e5a] text-white'
];

const PointOfSale = () => {
    const [rates, setRates] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isLoadingRates, setIsLoadingRates] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadRates = async () => {
            try {
                const { data } = await API.get('/settings/rates');
                setRates(data.walk_in_rates);
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load walk-in rates');
            } finally {
                setIsLoadingRates(false);
            }
        };

        void loadRates();
    }, []);

    const processWalkIn = async (rate) => {
        setIsProcessing(true);
        setError('');
        setMessage('');
        try {
            const { data } = await API.post('/transactions/walk-in', {
                category_name: rate.category_name,
                payment_method: paymentMethod
            });
            setMessage(`${rate.category_name} walk-in recorded for ₱${Number(data.amount).toLocaleString('en-PH')}.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not process walk-in');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Cashier module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Walk-in point of sale</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Choose a configured rate and record a day-pass payment.</p>
            </section>

            {message && <p role="status" className="rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-medium text-[#173B45] shadow-sm">{message}</p>}
            {error && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{error}</p>}

            <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-2xl bg-[#173B45] p-7 text-white shadow-xl shadow-[#173B45]/10">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFB276]">Quick checkout</p>
                    <h2 className="mt-3 text-2xl font-black">Walk-in access</h2>
                    <p className="mt-3 text-sm leading-6 text-white/65">Prices are loaded from the gym’s active Settings rates. The server applies the configured price when it records the transaction.</p>
                    <label htmlFor="walk-in-payment-method" className="mb-2 mt-7 block text-sm font-semibold">Payment method</label>
                    <select id="walk-in-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 p-3 text-sm text-white outline-none focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/15">
                        {PAYMENT_METHODS.map((method) => <option className="text-[#173B45]" key={method} value={method}>{method.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                    <h2 className="text-xl font-black">Select a day-pass rate</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Select the rate requested by the customer.</p>
                    <div className="mt-5 space-y-3">
                        {isLoadingRates ? (
                            <p className="rounded-xl bg-[#F8EDED]/60 px-4 py-4 text-sm text-[#173B45]/55">Loading configured rates…</p>
                        ) : rates.length === 0 ? (
                            <p className="rounded-xl border border-[#B43F3F]/15 bg-[#B43F3F]/[0.05] px-4 py-4 text-sm text-[#B43F3F]">No active walk-in rates are configured.</p>
                        ) : rates.map((rate, index) => (
                            <button
                                key={rate.category_name}
                                type="button"
                                disabled={isProcessing}
                                onClick={() => processWalkIn(rate)}
                                className={`${RATE_STYLES[index % RATE_STYLES.length]} flex w-full items-center justify-between rounded-xl p-5 text-left font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-50`}
                            >
                                <span>{rate.category_name}</span>
                                <span>₱{Number(rate.price).toLocaleString('en-PH')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default PointOfSale;
