export const TALLINN_ZONES = [
    { key: 'SÜDALINN', pricePerHour: 4.80, free15min: true, paid: { allDays: true } },
    { key: 'VANALINN', pricePerHour: 6.00, free15min: true, paid: { allDays: true } },
    // Kesklinn E–R 7–19, L 8–15 (P tasuta)
    { key: 'KESKLINN', pricePerHour: 1.50, free15min: true,
        paid: { monFri: [7,19], sat: [8,15] } },
    // Pirita hooajaline 15.05–15.09 10–22
    { key: 'PIRITA', pricePerHour: 0.60, free15min: true,
        paid: { seasonal: { from: '05-15', to: '09-15', hours:[10,22] } } }
]
