import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Loader2,
  Eye,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  X,
  User,
  Award,
  FileText,
  Building,
  Clock,
  Sparkles,
  ArrowRight,
  Shield
} from "lucide-react";
import { getUserResolvedTasks } from "../apis/resolved.api";

function UserResolved() {
  const [resolvedTasks, setResolvedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch all resolved tasks with proof from backend using API utility
  useEffect(() => {
    fetchResolvedTasks();
  }, []);

  const fetchResolvedTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserResolvedTasks();
      setResolvedTasks(data.data || []);
      setFilteredTasks(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch resolved tasks");
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term and task type
  useEffect(() => {
    let filtered = [...resolvedTasks];
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.original.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.proof.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.original.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.task_type === typeFilter);
    }
    setFilteredTasks(filtered);
  }, [searchTerm, typeFilter, resolvedTasks]);

  // Open modal with full details
  const openDetail = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  // Format date nicely
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Skeleton loader for cards
  const SkeletonCard = () => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden animate-pulse border border-white/20">
      <div className="h-52 bg-gray-700/30" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-white/20 rounded w-3/4" />
        <div className="h-4 bg-white/20 rounded w-full" />
        <div className="h-4 bg-white/20 rounded w-5/6" />
        <div className="flex gap-2 mt-4">
          <div className="h-10 bg-white/20 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-8 bg-transparent">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header – glass effect */}
          <div className="relative overflow-hidden bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 md:p-8">
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Verified Resolutions</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
                  Resolved Issues with Proof
                </h1>
                <p className="text-white/70 mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  See how your complaints were resolved – before & after evidence
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm border border-white/30">
                <Award className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "Resolution" : "Resolutions"}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar – glass */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by title, proof description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-white placeholder-white/50 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              {["all", "complaint", "violation"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    typeFilter === type
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white/20 backdrop-blur-sm text-white/90 hover:bg-white/30 border border-white/20"
                  }`}
                >
                  {type === "all" ? "All" : type === "complaint" ? "Complaints" : "Violations"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-white">{error}</p>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/20">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-5">
                <Sparkles className="w-12 h-12 text-white/50" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No resolved issues yet</h3>
              <p className="text-white/70 max-w-md mx-auto">
                Once your complaints are resolved and proof is submitted, you'll see the transformation here.
              </p>
            </div>
          )}

          {/* Card Grid – glass cards */}
          {!loading && filteredTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20"
                >
                  {/* Image Section */}
                  <div className="relative h-52 bg-black/20 overflow-hidden">
                    {task.proof.image ? (
                      <img
                        src={task.proof.image}
                        alt={task.proof.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/30">
                        <ImageIcon className="w-16 h-16 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                      {task.task_type === "complaint" ? "Complaint" : "Violation"}
                    </div>
                    {task.isMine && (
                      <div className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> My Issue
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h2 className="font-bold text-white text-xl line-clamp-1">
                      {task.original.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/20 inline-flex px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Resolved</span>
                    </div>
                    <div className="text-xs text-white/60 space-y-1.5 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Resolved by: {task.department.name || "Department"}</span>
                      </div>
                      {task.proof.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span className="truncate">{task.proof.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        {formatDate(task.proof.submitted_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => openDetail(task)}
                      className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-2 backdrop-blur-sm"
                    >
                      <Eye className="w-4 h-4" /> View Before & After
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal – clean glass design (unchanged) */}
      {modalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Resolution Comparison</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Badges and metadata */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    selectedTask.task_type === "complaint"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {selectedTask.task_type === "complaint" ? "Complaint" : "Violation"}
                  </span>
                  {selectedTask.isMine && (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Your Report
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  Resolved {formatDate(selectedTask.proof.submitted_at).split(",")[0]}
                </div>
              </div>

              {/* Split Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BEFORE */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    <div className="p-1.5 rounded-lg bg-rose-100">
                      <FileText className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Before – Original Issue</h3>
                    <span className="ml-auto text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Reported</span>
                  </div>
                  {selectedTask.original.image && (
                    <div className="rounded-lg overflow-hidden bg-gray-200">
                      <img src={selectedTask.original.image} alt="original" className="w-full h-56 object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{selectedTask.original.title}</p>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{selectedTask.original.description}</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 bg-white p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold w-24">Category:</span>
                      <span>{selectedTask.original.category || "N/A"}</span>
                    </div>
                    {selectedTask.original.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-500" />
                        <span className="flex-1">{selectedTask.original.address}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 text-gray-500" />
                      <span>Reported: {formatDate(selectedTask.original.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* AFTER */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-100">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">After – Proof of Resolution</h3>
                    <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Verified</span>
                  </div>
                  {selectedTask.proof.image && (
                    <div className="rounded-lg overflow-hidden bg-gray-200">
                      <img src={selectedTask.proof.image} alt="proof" className="w-full h-56 object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{selectedTask.proof.title}</p>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{selectedTask.proof.description}</p>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 bg-white p-3 rounded-lg">
                    {selectedTask.proof.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-600" />
                        <span className="flex-1">{selectedTask.proof.address}</span>
                      </div>
                    )}
                    {selectedTask.proof.latitude && selectedTask.proof.longitude && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold w-24">Coordinates:</span>
                        <span>{selectedTask.proof.latitude}, {selectedTask.proof.longitude}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Building className="w-3.5 h-3.5 mt-0.5 text-indigo-500" />
                      <span>Resolved by: {selectedTask.department.name || "Department"} ({selectedTask.department.email})</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-3.5 h-3.5 mt-0.5 text-gray-500" />
                      <span>Resolution proof: {formatDate(selectedTask.proof.submitted_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex justify-center -my-2">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
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

export default UserResolved;