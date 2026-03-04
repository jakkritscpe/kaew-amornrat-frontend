// Convert degrees to radians
function toRad(value: number) {
    return (value * Math.PI) / 180;
}

// Calculate distance in meters between two lat/lng coordinates (Haversine formula)
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Check if current location is within any allowed geofences
import type { WorkLocation } from '../types';

export function findMatchingLocation(
    userLat: number,
    userLng: number,
    locations: WorkLocation[]
): WorkLocation | null {
    for (const loc of locations) {
        const dist = getDistanceMeters(userLat, userLng, loc.lat, loc.lng);
        if (dist <= loc.radiusMeters) {
            return loc;
        }
    }
    return null;
}
