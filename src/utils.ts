

export function formatTokenBalance(balance: string, decimals: number): string {
    balance = balance.replace(/^0+/, '');
    if (balance.length <= decimals) {
        balance = balance.padStart(decimals + 1, '0');
    }

    const whole = balance.slice(0, balance.length - decimals);
    const fraction = balance.slice(balance.length - decimals);

    const formatted = `${whole}.${fraction}`.replace(/\.?0+$/, '');

    return formatted;
}

export function unformatTokenBalance(formatted: string, decimals: number): string {
    const [whole, fraction = ''] = formatted.split('.');

    // Pad the fraction part with zeros to match the decimals
    const paddedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);

    // Remove leading zeros from whole and concatenate
    const result = (whole + paddedFraction).replace(/^0+/, '') || '0';

    return result;
}
