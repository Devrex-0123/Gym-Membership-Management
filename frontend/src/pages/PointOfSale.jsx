import { useEffect, useState } from 'react';
import API from '../utils/api';

const PAYMENT_METHODS = ['cash', 'gcash', 'paymaya', 'card'];

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
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Walk-in point of sale</h1>
                <p className="mt-2 text-sm text-neutral-500">Choose a configured rate and record a day-pass payment.</p>
            </section>

            {message && <p role="status" className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900">{message}</p>}
            {error && <p role="alert" className="rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-lg border border-neutral-200 p-5 sm:p-7">
                    <h2 className="text-lg font-semibold">Payment</h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-500">Prices are loaded from the gym’s active Settings rates. The server applies the configured price when it records the transaction.</p>
                    <label htmlFor="walk-in-payment-method" className="mb-1.5 mt-6 block text-sm font-medium">Payment method</label>
                    <select id="walk-in-payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900">
                        {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
                    <h2 className="text-lg font-semibold">Day-pass rate</h2>
                    <p className="mt-1 text-sm text-neutral-500">Select the rate requested by the customer.</p>
                    <div className="mt-5 space-y-3">
                        {isLoadingRates ? (
                            <p className="rounded-md bg-neutral-50 px-4 py-4 text-sm text-neutral-500">Loading configured rates…</p>
                        ) : rates.length === 0 ? (
                            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">No active walk-in rates are configured.</p>
                        ) : rates.map((rate) => (
                            <button
                                key={rate.category_name}
                                type="button"
                                disabled={isProcessing}
                                onClick={() => processWalkIn(rate)}
                                className="flex w-full items-center justify-between rounded-md border border-neutral-200 p-4 text-left font-medium transition-colors hover:border-neutral-900 disabled:cursor-wait disabled:opacity-50"
                            >
                                <span>{rate.category_name}</span>
                                <span className="tabular-nums">₱{Number(rate.price).toLocaleString('en-PH')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default PointOfSale;
