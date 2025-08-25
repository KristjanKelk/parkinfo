// Allikad: Tallinna ametlik "Parking" leht (hinnad/ajad) ja 15 min reegel,
// lisaks VisitTallinn rõhutab 15 min reeglit turistidele.
// Südalinn (Downtown), Vanalinn (Old Town), Kesklinn (City Centre), Pirita hooajaline.
// NB: nimed / koodid seome ArcGIS omadustega (vt MapView koodis, mille välja loeme).
export const ZONE_RULES = {
    // võtmed on meie "normeeritud" nimed
    VANALINN:  { perHour: 6.00,  free15: true, paid: { always: true } },                // 24/7
    SÜDALINN:  { perHour: 4.80,  free15: true, paid: { always: true } },                // 24/7
    KESKLINN:  { perHour: 1.50,  free15: true, paid: { monFri:[7,19], sat:[8,15] } },   // P p�ev vabaks
    PIRITA:    { perHour: 0.60,  free15: true, paid: { seasonal:{ from:'05-15', to:'09-15', hours:[10,22] } } }
};
