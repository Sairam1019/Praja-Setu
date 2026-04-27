import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Marker,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* COMPONENTS */
import FlyToLocation from "../components/map/FlyToLocation";
import HeatLayer from "../components/map/HeatLayer";
import PopupCard from "../components/map/PopupCard";

/* API FUNCTIONS */
import { getComplaints } from "../apis/complaint.api";
import { getViolations } from "../apis/violation.api";
import { voteComplaint, voteViolation } from "../apis/vote.api";

/* Fix Leaflet default marker icon */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* USER LOCATION */
function UserLocation() {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: false });
    map.on("locationfound", (e) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.7,
      }).addTo(map);
    });
  }, [map]);
  return null;
}

/* SAFE LOCATION */
const getSafeLocation = (c) => {
  let lat = c.lat ?? c.latitude;
  let lng = c.lng ?? c.longitude;
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  return null;
};

/* OFFSET */
const getOffsetLocation = (lat, lng, index) => {
  const offset = 0.00008;
  return [lat + offset * Math.cos(index), lng + offset * Math.sin(index)];
};

/* PREMIUM MARKER */
const getVoteIcon = (c, isSelected) => {
  let color = "#6366f1";
  if (c.priority === "High") color = "#ef4444";
  else if (c.priority === "Medium") color = "#f97316";
  else if (c.priority === "Low") color = "#22c55e";

  return new L.DivIcon({
    className: "",
    iconAnchor: [20, 42],
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        transform:${isSelected ? "scale(1.2)" : "scale(1)"};
        transition:all 0.2s ease;
      ">
        <div style="
          background:${color};
          color:white;
          padding:6px 10px;
          border-radius:20px;
          font-size:12px;
          font-weight:bold;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
        ">
          👍 ${c.vote_count || 0}
        </div>
      </div>
    `,
  });
};

/* CLUSTER ICON */
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let color = "#6366f1";
  if (count > 20) color = "#ef4444";
  else if (count > 10) color = "#f97316";
  else if (count > 5) color = "#22c55e";

  return new L.DivIcon({
    html: `
      <div style="
        width:52px;
        height:52px;
        background:${color};
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-weight:bold;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    className: "",
  });
};

function MapView() {
  const [complaints, setComplaints] = useState([]);
  const [violations, setViolations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [theme, setTheme] = useState("light");
  const [mode, setMode] = useState("complaints");
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsData, violationsData] = await Promise.all([
        getComplaints(),
        getViolations()
      ]);
      setComplaints(Array.isArray(complaintsData) ? complaintsData : complaintsData.data || []);
      setViolations(Array.isArray(violationsData) ? violationsData : violationsData.data || []);
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    }
  };

  const vote = async (id) => {
    if (votingId === id) return;
    setVotingId(id);
    try {
      if (mode === "complaints") {
        await voteComplaint(id);
      } else {
        await voteViolation(id);
      }
      await fetchData(); // refresh counts
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVotingId(null);
    }
  };

  const validItems = useMemo(() => {
    const source = mode === "violations" ? violations : complaints;
    return source.filter((c) => getSafeLocation(c));
  }, [complaints, violations, mode]);

  return (
    <Layout>
      <div className="relative h-full w-full">
        {/* FLOATING MODE INDICATOR */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className={`
            px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md
            ${mode === "complaints"
              ? "bg-indigo-600/80 text-white border border-indigo-400/50"
              : "bg-red-600/80 text-white border border-red-400/50"
            }
          `}>
            {mode === "complaints" ? "📋 Showing Complaints" : "⚠️ Showing Violations"}
          </div>
        </div>

        {/* FLOATING CONTROLS */}
        <div className="absolute top-24 right-4 z-30 flex flex-col gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="
              w-12 h-12
              bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg
              rounded-2xl shadow-xl
              flex items-center justify-center text-xl
              hover:scale-105 hover:shadow-2xl
              transition-all duration-200
            "
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => setMode(mode === "complaints" ? "violations" : "complaints")}
            title={mode === "complaints" ? "Switch to Violations" : "Switch to Complaints"}
            className={`
              w-12 h-12 rounded-2xl shadow-xl
              flex items-center justify-center text-xl
              hover:scale-105 hover:shadow-2xl
              transition-all duration-200
              ${mode === "complaints"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white"
              }
            `}
          >
            {mode === "complaints" ? "📍" : "⚠️"}
          </button>
        </div>

        {/* MAP CONTAINER */}
        <MapContainer
          center={[17.385, 78.4867]}
          zoom={13}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url={
              theme === "light"
                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          <UserLocation />
          <FlyToLocation selected={selected} />
          <HeatLayer data={validItems} />
          <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
            {validItems.map((c, i) => {
              const loc = getSafeLocation(c);
              if (!loc) return null;
              const [lat, lng] = getOffsetLocation(loc.lat, loc.lng, i);
              return (
                <Marker
                  key={c.id}
                  position={[lat, lng]}
                  icon={getVoteIcon(c, selected?.id === c.id)}
                  eventHandlers={{ click: () => setSelected(c) }}
                />
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* POPUP CARD */}
        <PopupCard
          selected={selected}
          vote={vote}
          onClose={() => setSelected(null)}
          votingId={votingId}
        />
      </div>
    </Layout>
  );
}

export default MapView;