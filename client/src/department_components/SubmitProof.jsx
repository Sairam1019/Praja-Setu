import Layout from "../department_components/Department_Layout";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { enhanceComplaintText } from "../apis/complaint.api";
import { submitProof as submitProofAPI } from "../apis/task.api";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapController({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function SubmitProof() {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId, taskType } = location.state || {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [locationCoords, setLocationCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState(null);
  const [tempLng, setTempLng] = useState(null);
  const [tempAddress, setTempAddress] = useState("");
  const [mapLoadingLocation, setMapLoadingLocation] = useState(false);
  const [notification, setNotification] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const fileInputRef = useRef(null);

  const showNotification = (message, type = "info") => setNotification({ message, type });
  const hideNotification = () => setNotification(null);

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      return data.display_name || "";
    } catch { return ""; }
  };

  const openMapModal = async (useCurrentLocation = false) => {
    setMapModalOpen(true);
    if (useCurrentLocation) {
      setMapLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await fetchAddress(lat, lng);
          setTempLat(lat); setTempLng(lng); setTempAddress(address);
          setMapLoadingLocation(false);
        },
        () => {
          showNotification("Unable to fetch location. Pick manually.", "error");
          setMapLoadingLocation(false);
          setTempLat(17.385); setTempLng(78.4867);
          fetchAddress(17.385, 78.4867).then(addr => setTempAddress(addr));
        }
      );
    } else {
      if (locationCoords) {
        setTempLat(locationCoords.lat); setTempLng(locationCoords.lng); setTempAddress(locationCoords.address);
      } else {
        setTempLat(17.385); setTempLng(78.4867);
        const address = await fetchAddress(17.385, 78.4867);
        setTempAddress(address);
      }
      setMapLoadingLocation(false);
    }
  };

  const handleMarkerDragEnd = async (e) => {
    const latlng = e.target.getLatLng();
    setTempLat(latlng.lat); setTempLng(latlng.lng);
    const address = await fetchAddress(latlng.lat, latlng.lng);
    setTempAddress(address);
  };

  const confirmLocation = () => {
    if (tempLat && tempLng) {
      setLocationCoords({ lat: tempLat, lng: tempLng, address: tempAddress });
      setMapModalOpen(false);
      showNotification("Location confirmed ✓", "success");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        showNotification("File too large! Max 50MB", "error");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };
  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enhanceDescription = async () => {
    if (!description.trim()) {
      showNotification("Please write a description first", "error");
      return;
    }
    setEnhancing(true);
    try {
      const data = await enhanceComplaintText(description);
      setDescription(data.enhancedText);
      showNotification("Description enhanced successfully! ✨", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Could not enhance description", "error");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !file || !locationCoords) {
      showNotification("All fields are required", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("taskType", taskType);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", locationCoords.lat);
      formData.append("longitude", locationCoords.lng);
      formData.append("address", locationCoords.address || "");
      formData.append("media", file);

      await submitProofAPI(formData);
      showNotification("Proof submitted successfully! ✅", "success");

      // Navigate back to assigned tasks and reopen the modal for this task
      setTimeout(() => {
        navigate("/assigned_tasks", {
          state: { openTaskId: taskId, taskType: taskType }
        });
      }, 1500);
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Failed to submit proof", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {notification && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-down">
          <div className={`${notification.type === "success" ? "bg-green-600" : "bg-red-600"} text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3`}>
            <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={hideNotification} className="ml-4 text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Submit Resolution Proof
                </h1>
                <p className="text-gray-500 mt-2">
                  Task #{taskId} – {taskType === "complaint" ? "Complaint" : "Violation"}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📸</span> Upload Evidence
                  </h3>
                  <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                    <div className="w-full h-64 sm:h-72 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-indigo-400 transition-all duration-300 flex items-center justify-center overflow-hidden">
                      {preview ? (
                        <div className="relative w-full h-full">
                          {file?.type.startsWith("video") ? (
                            <video src={preview} controls className="w-full h-full object-contain" />
                          ) : (
                            <img src={preview} alt="preview" className="w-full h-full object-contain" />
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-red-600 transition">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 p-4">
                          <div className="text-5xl mb-3">📤</div>
                          <p className="font-medium">Click to upload</p>
                          <p className="text-xs mt-1">JPEG, PNG, MP4 (Max 50MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Form Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proof Title *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                      placeholder="e.g., Streetlight fixed"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Description *</label>
                      <button
                        type="button"
                        onClick={enhanceDescription}
                        disabled={enhancing}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 transition disabled:opacity-50"
                      >
                        {enhancing ? (
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          "✨"
                        )}
                        Enhance with AI
                      </button>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                      placeholder="Describe how the issue was resolved..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Location *</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => openMapModal(true)}
                        disabled={mapLoadingLocation}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                      >
                        {mapLoadingLocation ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "📍 My Current Location"
                        )}
                      </button>
                      <button
                        onClick={() => openMapModal(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
                      >
                        🗺️ Pick on Map
                      </button>
                    </div>
                    {locationCoords && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 mt-0.5">📍</span>
                          <div className="flex-1">
                            <p className="text-gray-800 font-mono text-xs">{locationCoords.lat.toFixed(6)}, {locationCoords.lng.toFixed(6)}</p>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{locationCoords.address || "Address not available"}</p>
                          </div>
                          <button onClick={() => openMapModal(false)} className="text-indigo-600 hover:text-indigo-800 text-xs underline">Change</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => navigate("/assigned_tasks")} className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Proof"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {mapModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
              <h3 className="font-semibold text-lg">Select Location</h3>
              <button onClick={() => setMapModalOpen(false)} className="text-white/60 hover:text-white text-xl transition">✕</button>
            </div>
            <div className="relative" style={{ height: "400px" }}>
              <MapContainer center={[tempLat || 17.385, tempLng || 78.4867]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tempLat && tempLng && <Marker position={[tempLat, tempLng]} draggable eventHandlers={{ dragend: handleMarkerDragEnd }} />}
                <MapController lat={tempLat} lng={tempLng} />
              </MapContainer>
            </div>
            <div className="p-4 flex flex-col sm:flex-row justify-between gap-3 bg-gray-50">
              <div className="text-gray-600 text-sm truncate flex-1">{tempAddress ? <span>📍 {tempAddress}</span> : <span className="italic">Drag marker to select exact location</span>}</div>
              <div className="flex gap-3">
                <button onClick={() => setMapModalOpen(false)} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition">Cancel</button>
                <button onClick={confirmLocation} disabled={!tempLat || !tempLng} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition">✓ Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-down { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-down { animation: fade-down 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </Layout>
  );
}

export default SubmitProof;