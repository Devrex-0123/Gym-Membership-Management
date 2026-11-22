import { useEffect, useState } from 'react';
import API from '../utils/api';
import { getTodayDateInput } from '../utils/dateRange';

const PAGE_SIZE = 25;
const CATEGORIES = [
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
];
const INITIAL_FILTERS = { startDate: '', endDate: '', category: '', search: '' };
const INITIAL_EXPENSE = {
    expense_date: getTodayDateInput(),
    category: 'utilities',
    description: '',
    vendor: '',
    amount: ''
};
const INPUT_CLASS = 'w-full rounded-xl border border-[#173B45]/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#FF8225] focus:ring-4 focus:ring-[#FF8225]/10';

const formatCurrency = (amount) => `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'medium' });

const ExpenseManagement = () => {
    const [expenseForm, setExpenseForm] = useState(INITIAL_EXPENSE);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState({});
    const [expenses, setExpenses] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [reloadToken, setReloadToken] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState('');
    const [listError, setListError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadExpenses = async () => {
            setIsLoading(true);
            try {
                const { data } = await API.get('/expenses', {
                    params: { ...appliedFilters, page, limit: PAGE_SIZE }
                });
                setExpenses(data.expenses);
                setPagination(data.pagination);
                setListError('');
            } catch (err) {
                setListError(err.response?.data?.message || 'Could not load expenses');
            } finally {
                setIsLoading(false);
            }
        };

        void loadExpenses();
    }, [appliedFilters, page, reloadToken]);

    const submitExpense = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFormError('');
        setSuccess('');
        try {
            await API.post('/expenses', {
                ...expenseForm,
                description: expenseForm.description.trim(),
                vendor: expenseForm.vendor.trim(),
                amount: Number(expenseForm.amount)
            });
            setSuccess('Expense recorded successfully.');
            setExpenseForm({ ...INITIAL_EXPENSE, expense_date: getTodayDateInput() });
            setPage(1);
            setReloadToken((current) => current + 1);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Could not record this expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const applyFilters = (event) => {
        event.preventDefault();
        setPage(1);
        setAppliedFilters({
            ...filters,
            search: filters.search.trim()
        });
    };

    const clearFilters = () => {
        setFilters(INITIAL_FILTERS);
        setPage(1);
        setAppliedFilters({});
    };

    return (
        <>
            <section>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#B43F3F]">Admin module</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Expense tracking</h1>
                <p className="mt-2 text-sm text-[#173B45]/60">Record and browse gym operating expenses.</p>
            </section>

            {success && <p role="status" className="rounded-xl border border-[#173B45]/10 bg-white px-4 py-3 text-sm font-medium text-[#173B45] shadow-sm">{success}</p>}

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B43F3F]">New expense</p>
                    <h2 className="mt-2 text-xl font-black">Record an expense</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Only admins can add or view expense records.</p>
                </div>
                {formError && <p role="alert" className="mb-5 rounded-xl border border-[#B43F3F]/20 bg-[#B43F3F]/[0.06] px-4 py-3 text-sm font-medium text-[#B43F3F]">{formError}</p>}
                <form onSubmit={submitExpense} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label htmlFor="expense-date" className="mb-1.5 block text-sm font-semibold">Expense date</label>
                        <input id="expense-date" required type="date" value={expenseForm.expense_date} onChange={(event) => setExpenseForm({ ...expenseForm, expense_date: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="expense-category" className="mb-1.5 block text-sm font-semibold">Category</label>
                        <select id="expense-category" required value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })} className={INPUT_CLASS}>
                            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expense-amount" className="mb-1.5 block text-sm font-semibold">Amount (₱)</label>
                        <input id="expense-amount" required type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} placeholder="0.00" className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="expense-vendor" className="mb-1.5 block text-sm font-semibold">Vendor (optional)</label>
                        <input id="expense-vendor" type="text" maxLength={100} value={expenseForm.vendor} onChange={(event) => setExpenseForm({ ...expenseForm, vendor: event.target.value })} placeholder="Vendor or payee" className={INPUT_CLASS} />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label htmlFor="expense-description" className="mb-1.5 block text-sm font-semibold">Description</label>
                        <input id="expense-description" required type="text" maxLength={200} value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} placeholder="What was this expense for?" className={INPUT_CLASS} />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#FF8225] px-5 py-3 font-bold text-[#173B45] transition hover:bg-[#f77718] disabled:opacity-50">
                            {isSubmitting ? 'Saving…' : 'Save expense'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-[#173B45]/[0.06] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                    <h2 className="text-lg font-black">Expense history</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">Filter recorded expenses by date, category, description, or vendor.</p>
                </div>
                <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label htmlFor="expense-start-date" className="mb-1.5 block text-sm font-semibold">From date</label>
                        <input id="expense-start-date" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="expense-end-date" className="mb-1.5 block text-sm font-semibold">To date</label>
                        <input id="expense-end-date" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} className={INPUT_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="expense-category-filter" className="mb-1.5 block text-sm font-semibold">Category</label>
                        <select id="expense-category-filter" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className={INPUT_CLASS}>
                            <option value="">All categories</option>
                            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expense-search" className="mb-1.5 block text-sm font-semibold">Search</label>
                        <input id="expense-search" type="search" maxLength={100} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Description or vendor" className={INPUT_CLASS} />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                        <button type="submit" className="rounded-xl bg-[#173B45] px-5 py-3 font-bold text-white transition hover:bg-[#214e5a]">Apply filters</button>
                        <button type="button" onClick={clearFilters} className="rounded-xl border border-[#173B45]/15 px-5 py-3 text-sm font-bold transition hover:border-[#FF8225]">Clear</button>
                    </div>
                </form>
            </section>

            {listError && <p role="alert" className="rounded-xl border border-[#B43F3F]/20 bg-white px-4 py-3 text-sm font-medium text-[#B43F3F] shadow-sm">{listError}</p>}

            <section className="overflow-hidden rounded-2xl border border-[#173B45]/[0.06] bg-white shadow-sm">
                <div className="border-b border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                    <h2 className="font-black">Recorded expenses</h2>
                    <p className="mt-1 text-sm text-[#173B45]/55">{isLoading ? 'Loading…' : `${pagination.total.toLocaleString('en-PH')} expense(s)`}</p>
                </div>
                {isLoading ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">Loading expenses…</p>
                ) : expenses.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#173B45]/55 sm:px-7">No expenses match these filters.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-[#F8EDED]/55 text-xs uppercase tracking-wide text-[#173B45]/55">
                                <tr>
                                    <th className="px-5 py-3 font-bold sm:px-7">Date</th>
                                    <th className="px-5 py-3 font-bold">Category</th>
                                    <th className="px-5 py-3 font-bold">Description</th>
                                    <th className="px-5 py-3 font-bold">Vendor</th>
                                    <th className="px-5 py-3 text-right font-bold">Amount</th>
                                    <th className="px-5 py-3 text-right font-bold sm:px-7">Recorded by</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#173B45]/[0.06]">
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-[#F8EDED]/25">
                                        <td className="whitespace-nowrap px-5 py-4 text-[#173B45]/65 sm:px-7">{formatDate(expense.expense_date)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 capitalize font-semibold">{expense.category}</td>
                                        <td className="px-5 py-4">{expense.description}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-[#173B45]/65">{expense.vendor || '—'}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right font-black">{formatCurrency(expense.amount)}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-right text-[#173B45]/65 sm:px-7">{expense.recorded_by?.full_name || 'Unknown'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-[#173B45]/[0.07] px-5 py-4 sm:px-7">
                    <p className="text-sm text-[#173B45]/55">Page {page} of {Math.max(pagination.totalPages, 1)}</p>
                    <div className="flex gap-2">
                        <button type="button" disabled={isLoading || page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#173B45]/15 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
                        <button type="button" disabled={isLoading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#173B45]/15 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ExpenseManagement;
