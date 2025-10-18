// Eesti parkimisteenuste info
export const PARKING_PROVIDERS = {
    europark: {
        name: 'Europark',
        logo: '🅿️',
        color: '#0066CC',
        sms: {
            number: '1902',
            format: 'PARK {plate} {zone}',
            cost: '€0.50 + parkimistasu'
        },
        app: {
            name: 'Europark',
            ios: 'https://apps.apple.com/ee/app/europark/id444114813',
            android: 'https://play.google.com/store/apps/details?id=ee.europark.android'
        },
        web: 'https://www.europark.ee',
        zones: ['VANALINN', 'SÜDALINN', 'KESKLINN'],
        description: {
            et: 'Tallinna linna ametlik parkimisteenus',
            en: 'Official Tallinn city parking service'
        }
    },

    parkman: {
        name: 'Parkman',
        logo: '🚗',
        color: '#00D85A',
        app: {
            name: 'Parkman',
            ios: 'https://apps.apple.com/ee/app/parkman/id444753650',
            android: 'https://play.google.com/store/apps/details?id=com.parkman.mobile'
        },
        web: 'https://parkman.ee',
        zones: ['ALL'],
        description: {
            et: 'Parkman võimaldab parkida üle Eesti',
            en: 'Parkman allows parking across Estonia'
        }
    },

    qpark: {
        name: 'Q-Park',
        logo: '🏢',
        color: '#004B93',
        sms: {
            number: '1510',
            format: 'QPARK {plate}',
            cost: '€0.30 + parkimistasu'
        },
        app: {
            name: 'Q-Park',
            ios: 'https://apps.apple.com/ee/app/q-park/id566695062',
            android: 'https://play.google.com/store/apps/details?id=com.qpark.mobile'
        },
        web: 'https://www.q-park.ee',
        zones: [],
        description: {
            et: 'Q-Park parkimismajad ja väljakud',
            en: 'Q-Park parking garages and lots'
        }
    },

    tallinnaParklad: {
        name: 'Tallinna Parklad',
        logo: '🏙️',
        color: '#E30613',
        app: {
            name: 'Tallinna Parklad',
            ios: 'https://apps.apple.com/ee/app/tallinna-parklad/id1474153888',
            android: 'https://play.google.com/store/apps/details?id=ee.tallinn.parking'
        },
        web: 'https://tallinnaparklad.ee',
        zones: [],
        description: {
            et: 'Tallinna parkimismajad ja parklad',
            en: 'Tallinn parking garages and lots'
        }
    },

    mobilly: {
        name: 'Mobilly',
        logo: '📱',
        color: '#FF6B00',
        sms: {
            number: '1414',
            format: '{zone} {plate}',
            cost: 'Tavahind'
        },
        app: {
            name: 'Mobilly',
            ios: 'https://apps.apple.com/ee/app/mobilly/id597215501',
            android: 'https://play.google.com/store/apps/details?id=com.mobilly.android'
        },
        web: 'https://mobilly.ee',
        zones: ['ALL'],
        description: {
            et: 'Parkimine ja muud mobiilsed teenused',
            en: 'Parking and other mobile services'
        }
    }
}

// Leia parkla jaoks sobivad teenusepakkujad
export function getProvidersForZone(zoneName) {
    const providers = []

    for (const [key, provider] of Object.entries(PARKING_PROVIDERS)) {
        if (provider.zones.includes('ALL') || provider.zones.includes(zoneName)) {
            providers.push({ key, ...provider })
        }
    }

    return providers
}

// Leia kõik saadaolevad teenused
export function getAllProviders() {
    return Object.entries(PARKING_PROVIDERS).map(([key, provider]) => ({
        key,
        ...provider
    }))
}