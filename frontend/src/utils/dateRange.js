const localDateStart = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const getDateRangeParams = ({ startDate, endDate }) => {
    const params = {};

    if (startDate) {
        params.startDate = localDateStart(startDate).toISOString();
    }

    if (endDate) {
        const exclusiveEnd = localDateStart(endDate);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
        params.endDate = exclusiveEnd.toISOString();
    }

    return params;
};

export const getTodayDateInput = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
