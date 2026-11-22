const Settings = require('../models/Settings');

const serializeRates = (settings, includeInactive) => {
    const walkInRates = includeInactive
        ? settings.walk_in_rates
        : settings.walk_in_rates.filter(rate => rate.is_active);
    const membershipRates = includeInactive
        ? settings.membership_rates
        : settings.membership_rates.filter(rate => rate.is_active);

    return {
        walk_in_rates: walkInRates.map(({ category_name, price, is_active }) => ({
            category_name,
            price,
            is_active
        })),
        membership_rates: membershipRates.map(({ package_name, duration_days, price, is_active }) => ({
            package_name,
            duration_days,
            price,
            is_active
        }))
    };
};

const validateRates = (rates, rateType) => {
    if (!Array.isArray(rates) || rates.length === 0) {
        return `${rateType} must contain at least one rate`;
    }

    const names = new Set();
    for (const rate of rates) {
        const name = rateType === 'walk_in_rates' ? rate?.category_name : rate?.package_name;
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedKey = normalizedName.toLowerCase();

        if (!normalizedName || normalizedName.length > 80 || names.has(normalizedKey)) {
            return `${rateType} names must be unique and between 1 and 80 characters`;
        }
        names.add(normalizedKey);

        if (typeof rate.price !== 'number' || !Number.isFinite(rate.price) || rate.price < 0) {
            return `${rateType} prices must be non-negative numbers`;
        }
        if (typeof rate.is_active !== 'boolean') {
            return `${rateType} entries must include an active status`;
        }
        if (rateType === 'membership_rates' && (!Number.isInteger(rate.duration_days) || rate.duration_days < 1)) {
            return 'Membership duration must be a positive whole number of days';
        }
    }

    return null;
};

const getRates = async (req, res) => {
    const settings = await Settings.findOne().select('walk_in_rates membership_rates');

    if (!settings) {
        return res.status(404).json({ message: 'Gym pricing is not configured' });
    }

    res.json(serializeRates(settings, req.user.role === 'admin'));
};

const updateRates = async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Pricing settings must be provided as an object' });
    }

    const walkInError = validateRates(req.body.walk_in_rates, 'walk_in_rates');
    if (walkInError) {
        return res.status(400).json({ message: walkInError });
    }

    const membershipError = validateRates(req.body.membership_rates, 'membership_rates');
    if (membershipError) {
        return res.status(400).json({ message: membershipError });
    }

    const settings = await Settings.findOne();
    if (!settings) {
        return res.status(404).json({ message: 'Gym pricing is not configured' });
    }

    settings.walk_in_rates = req.body.walk_in_rates.map(rate => ({
        category_name: rate.category_name.trim(),
        price: rate.price,
        is_active: rate.is_active
    }));
    settings.membership_rates = req.body.membership_rates.map(rate => ({
        package_name: rate.package_name.trim(),
        duration_days: rate.duration_days,
        price: rate.price,
        is_active: rate.is_active
    }));

    await settings.save();
    res.json(serializeRates(settings, true));
};

module.exports = { getRates, updateRates };
