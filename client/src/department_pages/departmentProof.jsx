import Layout from "../department_components/Department_Layout";
import { useEffect, useState } from "react";
import {
  Loader2,
  Trash2,
  MapPin,
  Calendar,
  ImageIcon,
  Eye,
  X,
  AlertCircle,
  FileText,
  Award,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  Tag
} from "lucide-react";
import {
  getDepartmentProofs,
  getProofDetail,
  deleteProof as deleteProofApi
} from "../apis/proof.api";

function DepartmentProof() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch list of proofs using API
  const fetchProofs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartmentProofs();
      setProofs(data.proofs || []);
    } catch (err) {
      setError(err.message || "Failed to fetch proofs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  // Delete a proof using API
  const deleteProof = async (id) => {
    if (!window.confirm("Delete this proof? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteProofApi(id);
      setProofs((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // Fetch full proof details when opening modal
  const viewDetails = async (proof) => {
    setSelectedProof(null);
    setDescriptionExpanded(false);
    setModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await getProofDetail(proof.id);
      setSelectedProof(data); // full proof object from backend
    } catch (err) {
      alert(err.message || "Failed to load details");
      setModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProof(null);
    setDescriptionExpanded(false);
  };

  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  const isLongDescription = (text) => text && text.length > 200;

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse border border-gray-100">
      <div className="h-48 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen p-5 md:p-7 bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        <div className="max-w-7xl mx-auto space-y-7">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-indigo-600 bg-clip-text text-transparent">
                  My Proof Submissions
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidence uploaded for resolved tasks
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <Award className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-gray-700">
                  {proofs.length} {proofs.length === 1 ? "Proof" : "Proofs"}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && proofs.length === 0 && !error && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">No proofs yet</h3>
              <p className="text-gray-500 mt-2">
                You haven't submitted any proof for resolved tasks.
              </p>
            </div>
          )}

          {/* Card Grid */}
          {!loading && proofs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {proof.image_url ? (
                      <img
                        src={proof.image_url}
                        alt={proof.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
                      {proof.task_type === "complaint" ? "Complaint" : "Violation"}
                    </div>
                  </div>
                  <div className="p-5 space-y-3 flex-1 flex flex-col">
                    <h2 className="font-bold text-gray-800 text-lg line-clamp-1">
                      {proof.title}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {proof.description}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>Task ID: {proof.task_id}</span>
                      </div>
                      {proof.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{proof.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(proof.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => viewDetails(proof)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      <button
                        onClick={() => deleteProof(proof.id)}
                        disabled={deletingId === proof.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deletingId === proof.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== PREMIUM MODAL – FETCHED DETAILS ========== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-600 bg-clip-text text-transparent">
                  Proof Details
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : selectedProof ? (
              <div className="flex flex-col md:flex-row">
                {/* Left: Image */}
                <div className="md:w-2/5 bg-gradient-to-br from-gray-50 to-indigo-50/40 p-6 flex items-center justify-center">
                  {selectedProof.image_url ? (
                    <div className="rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={selectedProof.image_url}
                        alt={selectedProof.proof_title || "Proof"}
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                </div>

                {/* Right: Details */}
                <div className="md:w-3/5 p-6 space-y-6">
                  {/* Title + Task Badge */}
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {selectedProof.proof_title || selectedProof.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          selectedProof.task_type === "complaint"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {selectedProof.task_type === "complaint" ? "📋 Complaint" : "⚠️ Violation"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Task ID: {selectedProof.task_id}</p>
                    {selectedProof.task_title && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> {selectedProof.task_title}
                        {selectedProof.category && ` (${selectedProof.category})`}
                      </p>
                    )}
                  </div>

                  {/* Description with Read More */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Description
                    </h4>
                    <div className="mt-2 text-gray-700 leading-relaxed">
                      <p className={!descriptionExpanded ? "line-clamp-3" : ""}>
                        {selectedProof.proof_description || selectedProof.description}
                      </p>
                      {isLongDescription(selectedProof.proof_description || selectedProof.description) && (
                        <button
                          onClick={toggleDescription}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors"
                        >
                          {descriptionExpanded ? (
                            <>Show less <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Read more <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Location (address + coordinates) */}
                  {selectedProof.address && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location
                      </h4>
                      <div className="mt-2 text-gray-700">
                        <p>{selectedProof.address}</p>
                        {selectedProof.latitude && selectedProof.longitude && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            {selectedProof.latitude}, {selectedProof.longitude}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <hr className="border-gray-100" />

                  {/* Submitted Date */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Submitted
                    </h4>
                    <p className="text-gray-700 mt-1">
                      {new Date(selectedProof.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Submitted By (from detail endpoint) */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" /> Submitted By
                    </h4>
                    <p className="text-gray-700 mt-1">
                      {selectedProof.submitted_by_name || "Department User"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">Failed to load details.</div>
            )}

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 rounded-xl font-medium transition-all duration-200 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DepartmentProof;