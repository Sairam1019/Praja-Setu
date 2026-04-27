import { useEffect, useRef, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/* SAFE LOCATION */
const getSafeLocation = (c) => {
  const lat = parseFloat(c.lat ?? c.latitude);
  const lng = parseFloat(c.lng ?? c.longitude);

  if (!isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return null;
};

function HeatLayer({ data }) {
  const map = useMap();
  const heatRef = useRef(null);

  /* 🔥 NORMALIZATION (CLEAR HOTSPOTS) */
  const heatData = useMemo(() => {
    if (!data.length) return [];

    const maxVotes = Math.max(...data.map(c => c.vote_count || 1));

    return data
      .map(c => {
        const loc = getSafeLocation(c);
        if (!loc) return null;

        // 🔥 stronger hotspot curve (more alert)
        const normalized = (c.vote_count || 1) / maxVotes;
        const intensity = Math.pow(normalized, 0.55);

        return [loc.lat, loc.lng, intensity];
      })
      .filter(Boolean);
  }, [data]);

  useEffect(() => {
    if (!L.heatLayer) return;

    // 📱 RESPONSIVE SETTINGS
    const isMobile = window.innerWidth < 768;

    const heatOptions = {
      radius: isMobile ? 28 : 40,   // smaller on mobile
      blur: isMobile ? 22 : 35,     // smoother on desktop
      maxZoom: 18,
      minOpacity: 0.3,

      /* 🔥 ALERT GRADIENT (MORE NOTICEABLE) */
      gradient: {
        0.05: "#3b82f6", // blue (low)
        0.2: "#22c55e",  // green
        0.4: "#facc15",  // yellow
        0.6: "#fb923c",  // orange
        0.8: "#ef4444",  // red
        1.0: "#b91c1c"   // deep red hotspot 🔥
      }
    };

    /* 🔁 UPDATE (SMOOTH, NO FLICKER) */
    if (heatRef.current) {
      heatRef.current.setLatLngs(heatData);
      return;
    }

    /* 🧠 CREATE ONLY ONCE */
    heatRef.current = L.heatLayer(heatData, heatOptions).addTo(map);

    /* 🧹 CLEANUP */
    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [heatData, map]);

  return null;
}

export default HeatLayer;