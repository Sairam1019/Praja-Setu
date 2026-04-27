import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function UserLocation() {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    map.locate({ setView: true });

    map.on("locationfound", (e) => {

      const isMobile = window.innerWidth < 768;

      const size = isMobile ? 18 : 22;

      // 🔥 REMOVE OLD MARKER (PREVENT DUPLICATE)
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // 🔥 CUSTOM USER ICON
      const userIcon = new L.DivIcon({
        className: "bg-transparent border-none",
        iconAnchor: [size / 2, size / 2],
        html: `
          <div style="
            position:relative;
            width:${size}px;
            height:${size}px;
          ">

            <!-- 🔵 PULSE EFFECT -->
            <div style="
              position:absolute;
              width:${size * 2}px;
              height:${size * 2}px;
              top:50%;
              left:50%;
              transform:translate(-50%, -50%);
              border-radius:50%;
              background:rgba(59,130,246,0.25);
              animation:pulse 1.8s infinite;
            "></div>

            <!-- 🔵 INNER DOT -->
            <div style="
              width:${size}px;
              height:${size}px;
              background:#3b82f6;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 0 12px rgba(59,130,246,0.8);
              position:absolute;
              top:50%;
              left:50%;
              transform:translate(-50%, -50%);
            "></div>

          </div>
        `
      });

      // 🔥 ADD MARKER
      markerRef.current = L.marker(e.latlng, {
        icon: userIcon
      }).addTo(map);

      // 🔥 OPTIONAL TOOLTIP (VERY IMPORTANT UX)
      markerRef.current.bindTooltip("📍 You are here", {
        direction: "top",
        offset: [0, -10],
        opacity: 1
      });

    });

    // 🔥 CLEANUP
    return () => {
      map.off("locationfound");
    };

  }, [map]);

  return null;
}

export default UserLocation;