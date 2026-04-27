import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createComplaint, enhanceComplaintText } from "../apis/complaint.api"; // ✅ API functions

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map controller to update view
function MapController({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

// Toast notification
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600";
  return (
    <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-down">
      <div className={`${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm flex items-center gap-3`}>
        <span>{type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span>
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}

function ReportIssue() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState(null);
  const [tempLng, setTempLng] = useState(null);
  const [tempAddress, setTempAddress] = useState("");
  const [mapLoadingLocation, setMapLoadingLocation] = useState(false);
  const [notification, setNotification] = useState(null);
  const [enhancing, setEnhancing] = useState(false);

  const fileInputRef = useRef(null);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
  };
  const hideNotification = () => setNotification(null);

  // Reverse geocoding
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name || "";
    } catch (err) {
      console.warn("Address fetch failed");
      return "";
    }
  };

  // Open map modal
  const openMapModal = async (useCurrentLocation = false) => {
    setMapModalOpen(true);
    if (useCurrentLocation) {
      setMapLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await fetchAddress(lat, lng);
          setTempLat(lat);
          setTempLng(lng);
          setTempAddress(address);
          setMapLoadingLocation(false);
        },
        () => {
          showNotification("Unable to fetch location. Please pick manually.", "error");
          setMapLoadingLocation(false);
          if (location) {
            setTempLat(location.lat);
            setTempLng(location.lng);
            setTempAddress(location.address || "");
          } else {
            setTempLat(17.385);
            setTempLng(78.4867);
            fetchAddress(17.385, 78.4867).then(addr => setTempAddress(addr));
          }
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    } else {
      if (location) {
        setTempLat(location.lat);
        setTempLng(location.lng);
        setTempAddress(location.address || "");
      } else {
        setTempLat(17.385);
        setTempLng(78.4867);
        const address = await fetchAddress(17.385, 78.4867);
        setTempAddress(address);
      }
      setMapLoadingLocation(false);
    }
  };

  const handleMarkerDragEnd = async (e) => {
    const latlng = e.target.getLatLng();
    setTempLat(latlng.lat);
    setTempLng(latlng.lng);
    const address = await fetchAddress(latlng.lat, latlng.lng);
    setTempAddress(address);
  };

  const confirmLocation = () => {
    if (tempLat && tempLng) {
      setLocation({
        lat: tempLat,
        lng: tempLng,
        address: tempAddress,
      });
      setMapModalOpen(false);
      showNotification("Location confirmed ✓", "success");
    }
  };

  const getCurrentLocation = () => {
    openMapModal(true);
  };

  const validate = () => {
    let err = {};
    if (!title) err.title = "Title required";
    if (!description) err.description = "Description required";
    if (!file) err.file = "Upload required";
    if (!location) err.location = "Location required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ✅ AI description enhancement using API utility
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
      showNotification(err.message || "Could not enhance description. Please try again.", "error");
    } finally {
      setEnhancing(false);
    }
  };

  // ✅ Submit complaint using API utility
  const submitComplaint = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", location.lat);
      formData.append("longitude", location.lng);
      formData.append("address", location.address || "");
      formData.append("media", file);

      const result = await createComplaint(formData);
      if (result.message || result.success !== false) {
        showNotification("Complaint submitted successfully! ✅", "success");
        setTitle("");
        setDescription("");
        setFile(null);
        setPreview(null);
        setLocation(null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        showNotification(result.message || "Submission failed", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Submission failed", "error");
    }
    setLoading(false);
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

  return (
    <Layout>
      {notification && (
        <Toast message={notification.message} type={notification.type} onClose={hideNotification} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Report Civic Issue
            </h1>
            <p className="text-gray-300 mt-2 text-sm sm:text-base">
              Submit issues with proof & precise location
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - File Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📸</span> Upload Evidence
                  </h3>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-full h-64 sm:h-72 bg-white/5 rounded-xl border-2 border-dashed border-white/30 group-hover:border-indigo-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                      {preview ? (
                        <div className="relative w-full h-full">
                          {file?.type.startsWith("video") ? (
                            <video src={preview} controls className="w-full h-full object-contain" />
                          ) : (
                            <img src={preview} alt="preview" className="w-full h-full object-contain" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile();
                            }}
                            className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-white/60 p-4">
                          <div className="text-5xl mb-3">📤</div>
                          <p className="font-medium">Click to upload</p>
                          <p className="text-xs mt-1">JPEG, PNG, MP4 (Max 50MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.file && <p className="text-red-400 text-sm mt-2">{errors.file}</p>}
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Issue Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.title ? "border-red-500" : "border-white/20"
                      } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                      placeholder="e.g., Pothole on Main Street"
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-white text-sm font-medium">Description</label>
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
                      rows={5}
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.description ? "border-red-500" : "border-white/20"
                      } rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
                      placeholder="Describe the issue in detail..."
                    />
                    {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-3">Location</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={getCurrentLocation}
                        disabled={mapLoadingLocation}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3 rounded-xl font-medium transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                      >
                        {mapLoadingLocation ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "📍 My Current Location"
                        )}
                      </button>
                      <button
                        onClick={() => openMapModal(false)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/20"
                      >
                        🗺️ Pick on Map
                      </button>
                    </div>

                    {location && (
                      <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-green-400 mt-0.5">📍</span>
                          <div className="flex-1">
                            <p className="text-white/80 font-mono text-xs">
                              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                            <p className="text-white/60 text-xs mt-1 line-clamp-2">
                              {location.address || "Address not available"}
                            </p>
                          </div>
                          <button
                            onClick={() => openMapModal(false)}
                            className="text-white/50 hover:text-white text-xs underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                    {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/20">
                <button
                  onClick={submitComplaint}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "✅ Submit Complaint"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal (unchanged) */}
      {mapModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <span>🗺️</span> Select Location
              </h3>
              <button
                onClick={() => setMapModalOpen(false)}
                className="text-white/60 hover:text-white text-xl transition"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              {mapLoadingLocation && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                  <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-white">Fetching your location...</span>
                  </div>
                </div>
              )}
              <MapContainer
                center={[tempLat || 17.385, tempLng || 78.4867]}
                zoom={13}
                style={{ height: "450px", width: "100%" }}
                className="z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tempLat && tempLng && (
                  <Marker
                    position={[tempLat, tempLng]}
                    draggable={true}
                    eventHandlers={{ dragend: handleMarkerDragEnd }}
                  />
                )}
                <MapController lat={tempLat} lng={tempLng} />
              </MapContainer>
            </div>

            <div className="p-4 flex flex-col sm:flex-row justify-between gap-3 bg-slate-800/50">
              <div className="text-white/70 text-sm truncate flex-1">
                {tempAddress ? (
                  <span>📍 {tempAddress}</span>
                ) : (
                  <span className="italic">Drag marker to select exact location</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMapModalOpen(false)}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLocation}
                  disabled={!tempLat || !tempLng}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-down {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-down { animation: fade-down 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </Layout>
  );
}

export default ReportIssue;