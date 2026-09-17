import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon path issue with bundlers
// Use inline SVG data URI for the marker to avoid asset path problems
const mosqueIcon = new L.DivIcon({
  className: 'mosque-marker',
  html: `<div class="marker-pin"><span class="marker-emoji">🕌</span></div>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -46]
});

const userIcon = new L.DivIcon({
  className: 'user-marker',
  html: `<div class="user-pin"><span class="user-dot"></span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

/**
 * Sub-component to recenter the map when center/zoom props change.
 */
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Interactive map view for displaying mosque locations on a Leaflet map.
 *
 * @param {Object[]} mosques — Array of mosque objects from the API
 * @param {Object|null} userCoords — { lat, lng } of the user's position
 * @param {number} radiusKm — Current search radius (for display only)
 */
export default function MapView({ mosques = [], userCoords = null, radiusKm = 10 }) {
  const mapRef = useRef(null);

  // Determine sensible map center and zoom
  const defaultCenter = [9.06, 7.49]; // Abuja, Nigeria as a neutral default
  const defaultZoom = 3;

  let center = defaultCenter;
  let zoom = defaultZoom;

  if (userCoords) {
    center = [userCoords.lat, userCoords.lng];
    // Adjust zoom based on radius
    if (radiusKm <= 2) zoom = 15;
    else if (radiusKm <= 5) zoom = 14;
    else if (radiusKm <= 10) zoom = 13;
    else if (radiusKm <= 25) zoom = 11;
    else zoom = 10;
  } else if (mosques.length > 0) {
    // Center on first mosque if no user coords
    const firstMosque = mosques[0];
    if (firstMosque.location?.coordinates) {
      center = [firstMosque.location.coordinates[1], firstMosque.location.coordinates[0]];
      zoom = 13;
    }
  }

  return (
    <div className="map-view-container">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="map-leaflet"
        style={{ height: '520px', width: '100%', borderRadius: 'var(--radius-md)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} zoom={zoom} />

        {/* User position marker */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup className="mosque-popup">
              <div className="popup-content">
                <strong>📍 Your Location</strong>
                <p className="popup-coords">
                  {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Mosque markers */}
        {mosques.map((mosque) => {
          if (!mosque.location?.coordinates) return null;
          const lat = mosque.location.coordinates[1];
          const lng = mosque.location.coordinates[0];

          return (
            <Marker
              key={mosque._id}
              position={[lat, lng]}
              icon={mosqueIcon}
            >
              <Popup className="mosque-popup" maxWidth={280}>
                <div className="popup-content">
                  <h4 className="popup-name">{mosque.name}</h4>
                  <p className="popup-address">🗺️ {mosque.address}</p>

                  {mosque.distanceKm !== undefined && (
                    <span className="popup-distance">
                      📍 {mosque.distanceKm < 1 ? `${mosque.distanceMeters}m` : `${mosque.distanceKm}km`} away
                    </span>
                  )}

                  <div className="popup-actions">
                    <Link to={`/mosque/${mosque._id}`} className="popup-link">
                      View Details →
                    </Link>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="popup-link popup-link-directions"
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {mosques.length === 0 && (
        <div className="map-empty-overlay">
          <span>🗺️</span>
          <p>No mosques to display on the map</p>
        </div>
      )}

      <style>{`
        .map-view-container {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
        }

        .map-leaflet {
          z-index: 1;
        }

        /* Custom mosque marker */
        .marker-pin {
          width: 36px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.9);
        }

        .marker-emoji {
          transform: rotate(45deg);
          font-size: 1rem;
          display: block;
        }

        /* User position marker */
        .user-pin {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-dot {
          width: 14px;
          height: 14px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(0, 0, 0, 0.3);
          animation: userPulse 2s infinite;
        }

        @keyframes userPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0,0,0,0.3); }
        }

        /* Popup styling to match glassmorphic theme */
        .leaflet-popup-content-wrapper {
          background: rgba(16, 24, 38, 0.95) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: var(--radius-sm) !important;
          box-shadow: var(--shadow-md) !important;
          color: var(--text-primary) !important;
          padding: 0 !important;
        }

        .leaflet-popup-tip {
          background: rgba(16, 24, 38, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .leaflet-popup-close-button {
          color: var(--text-muted) !important;
          font-size: 20px !important;
          padding: 6px 8px !important;
        }

        .leaflet-popup-close-button:hover {
          color: var(--text-primary) !important;
        }

        .popup-content {
          padding: 14px 16px;
          font-family: var(--font-body);
        }

        .popup-name {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
          line-height: 1.3;
        }

        .popup-address {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .popup-coords {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin: 4px 0 0 0;
          font-family: monospace;
        }

        .popup-distance {
          display: inline-block;
          background: rgba(14, 165, 233, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(14, 165, 233, 0.3);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .popup-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .popup-link {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary-500) !important;
          text-decoration: none;
          padding: 4px 0;
          transition: color 0.15s;
        }

        .popup-link:hover {
          color: var(--primary-200) !important;
        }

        .popup-link-directions {
          margin-left: auto;
          color: var(--accent-gold) !important;
        }

        .popup-link-directions:hover {
          color: #fbbf24 !important;
        }

        /* Map empty overlay */
        .map-empty-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 500;
          pointer-events: none;
          background: rgba(16, 24, 38, 0.85);
          backdrop-filter: blur(8px);
          padding: 24px 36px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .map-empty-overlay span {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 8px;
        }

        .map-empty-overlay p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 0;
        }

        /* Override Leaflet's default controls for dark theme */
        .leaflet-control-zoom a {
          background: rgba(16, 24, 38, 0.9) !important;
          color: var(--text-primary) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .leaflet-control-zoom a:hover {
          background: rgba(30, 42, 60, 0.95) !important;
        }

        .leaflet-control-attribution {
          background: rgba(16, 24, 38, 0.75) !important;
          color: var(--text-muted) !important;
          font-size: 0.65rem !important;
        }

        .leaflet-control-attribution a {
          color: var(--primary-500) !important;
        }
      `}</style>
    </div>
  );
}
