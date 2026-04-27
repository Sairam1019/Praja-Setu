import { Marker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import L from "leaflet";

/* SAFE LOCATION */
const getSafeLocation = (c) => {
  const lat = parseFloat(c.lat ?? c.latitude);
  const lng = parseFloat(c.lng ?? c.longitude);

  if (!isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return null;
};

/* PRIORITY COLOR */
const getColor = (priority) => {
  if (priority === "High") return "#ef4444";
  if (priority === "Medium") return "#f97316";
  if (priority === "Low") return "#eab308";
  return "#6366f1";
};

/* CATEGORY ICON */
const getCategoryIcon = (category) => {
  if (category === "Garbage") return "🗑️";
  if (category === "Road") return "🚧";
  if (category === "Water") return "💧";
  return "📍";
};

/* 🔥 CLEAN PREMIUM PIN */
const getVoteIcon = (c, isTop, isSelected) => {
  const color = getColor(c.priority);
  const isMobile = window.innerWidth < 768;

  const size = isMobile ? 34 : 40;

  return new L.DivIcon({
    className: "bg-transparent border-none",
    iconAnchor: [size / 2, size + 8],
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        transform:${isSelected ? "scale(1.2)" : "scale(1)"};
        transition:all 0.25s ease;
      ">

        <!-- 🔥 SELECTED GLOW -->
        ${
          isSelected
            ? `<div style="
                position:absolute;
                width:${size + 18}px;
                height:${size + 18}px;
                border-radius:50%;
                background:rgba(99,102,241,0.25);
                filter:blur(6px);
                z-index:-1;
              "></div>`
            : ""
        }

        <!-- 🔥 HOTSPOT PULSE -->
        ${
          isTop
            ? `<div style="
                position:absolute;
                width:${size + 22}px;
                height:${size + 22}px;
                border-radius:50%;
                background:rgba(239,68,68,0.35);
                animation:pulse 1.5s infinite;
                z-index:-2;
              "></div>`
            : ""
        }

        <!-- 🔥 PIN HEAD -->
        <div style="
          width:${size}px;
          height:${size}px;
          background:${color};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:white;
          font-size:${isMobile ? "14px" : "16px"};
          border:2px solid white;
          box-shadow:0 6px 14px rgba(0,0,0,0.35);
        ">
          ${getCategoryIcon(c.category)}
        </div>

        <!-- 🔥 PIN TAIL -->
        <div style="
          width:0;
          height:0;
          border-left:${isMobile ? "7px" : "8px"} solid transparent;
          border-right:${isMobile ? "7px" : "8px"} solid transparent;
          border-top:${isMobile ? "10px" : "12px"} solid ${color};
          margin-top:-2px;
        "></div>

      </div>
    `
  });
};

function MarkerLayer({ data, onSelect, selected }) {

  /* 🔥 TOP HOTSPOT */
  const topHotspot = useMemo(() => {
    return [...data].sort(
      (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
    )[0];
  }, [data]);

  return data.map(c => {
    const loc = getSafeLocation(c);
    if (!loc) return null;

    const isTop = topHotspot?.id === c.id;
    const isSelected = selected?.id === c.id;

    return (
      <Marker
        key={c.id}
        position={[loc.lat, loc.lng]}
        icon={getVoteIcon(c, isTop, isSelected)}
        eventHandlers={{
          click: (e) => {
            onSelect(c);
            e.target.openPopup();
          }
        }}
      >
        {/* 🔥 TOOLTIP (SHOW DETAILS INSTEAD OF PIN CLUTTER) */}
        <Tooltip direction="top" offset={[0, -25]} opacity={1}>
          <div className="
            text-xs sm:text-sm
            bg-white text-gray-800
            px-3 py-2
            rounded-lg shadow-lg border
          ">
            <p className="font-semibold">{c.title}</p>
            <p className="text-gray-500 text-xs">{c.category}</p>
            <p className="text-gray-600 text-xs">{c.status}</p>

            {isTop && (
              <p className="text-red-500 font-bold text-xs">
                🔥 High Priority Area
              </p>
            )}
          </div>
        </Tooltip>
      </Marker>
    );
  });
}

export default MarkerLayer;