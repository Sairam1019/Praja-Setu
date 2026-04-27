import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

function FlyToLocation({ selected }) {
  const map = useMap();
  const lastRef = useRef(null);

  useEffect(() => {
    if (!selected) return;

    // 🔥 SUPPORT MULTIPLE LOCATION FORMATS
    const lat = parseFloat(selected.lat ?? selected.latitude);
    const lng = parseFloat(selected.lng ?? selected.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const newLoc = [lat, lng];

    // 🔥 PREVENT REPEATED FLY (PERFORMANCE OPTIMIZATION)
    if (
      lastRef.current &&
      lastRef.current[0] === newLoc[0] &&
      lastRef.current[1] === newLoc[1]
    ) {
      // 📱 LIGHT ZOOM FEEDBACK (FAST ON MOBILE)
      map.setView(newLoc, 16, { animate: true });
      return;
    }

    lastRef.current = newLoc;

    // 📱 DETECT LOW SCREEN (MOBILE OPTIMIZATION)
    const isMobile = window.innerWidth < 768;

    // 🚀 SMART ANIMATION SETTINGS
    map.flyTo(newLoc, 16, {
      duration: isMobile ? 0.8 : 1.2, // faster on mobile
      easeLinearity: isMobile ? 0.5 : 0.25
    });

  }, [selected, map]);

  return null;
}

export default FlyToLocation;