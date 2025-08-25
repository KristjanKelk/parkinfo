export function getBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) return reject(new Error('Geolokatsioon puudub'))
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    })
}
