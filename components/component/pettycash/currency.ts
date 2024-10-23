// utils/currency.ts

export const formatKenyanShilling = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${numAmount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatCurrency = (amount: number | string, currency: string = 'KES'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    switch (currency) {
        case 'KES':
            return formatKenyanShilling(numAmount);
        case 'USD':
            return numAmount.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            });
        case 'GBP':
            return numAmount.toLocaleString('en-GB', {
                style: 'currency',
                currency: 'GBP'
            });
        case 'EUR':
            return numAmount.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
            });
        default:
            return formatKenyanShilling(numAmount);
    }
};