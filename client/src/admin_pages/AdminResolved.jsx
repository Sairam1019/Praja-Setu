import { useEffect, useState } from "react";
import AdminLayout from "../admin_components/AdminLayout";
import {
  Loader2,
  Search,
  Eye,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  X,
  User,
  Award
} from "lucide-react";
import { getAdminResolvedTasks, getAdminResolvedDetail } from "../apis/resolved.api";

function AdminResolved() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchResolvedTasks();
  }, []);

  const fetchResolvedTasks = async () => {
    try {
      setLoading(true);
      const data = await getAdminResolvedTasks();
      setTasks(data.tasks || []);
      setFilteredTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch resolved tasks");
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  useEffect(() => {
    let filtered = [...tasks];
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.proof_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.task_type === typeFilter);
    }
    setFilteredTasks(filtered);
  }, [searchTerm, typeFilter, tasks]);

  const openDetail = async (task) => {
    setDetailLoading(true);
    try {
      const data = await getAdminResolvedDetail(task.id);
      setSelectedTask(data);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load details");
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const SkeletonCard = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-2 mt-4">
          <div className="h-9 bg-gray-200 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-full blur-3xl opacity-20" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent">
                  Resolved Tasks with Proofs
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Verified completions by department users
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/30">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-gray-700">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, proof title, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  typeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white/80 text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("complaint")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  typeFilter === "complaint"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white/80 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Complaints
              </button>
              <button
                onClick={() => setTypeFilter("violation")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  typeFilter === "violation"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white/80 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Violations
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/40">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-700">No resolved tasks found</h3>
              <p className="text-gray-500 mt-2">Tasks with submitted proofs will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/40 flex flex-col"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {task.proof_image ? (
                      <img
                        src={task.proof_image}
                        alt={task.proof_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
                      {task.task_type === "complaint" ? "📋 Complaint" : "⚠️ Violation"}
                    </div>
                  </div>
                  <div className="p-5 space-y-3 flex-1 flex flex-col">
                    <h2 className="font-bold text-gray-800 text-lg line-clamp-1">
                      {task.title}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.proof_title || "Proof submitted"}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Submitted by: {task.submitted_by_name || "Department User"}</span>
                      </div>
                      {task.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span className="truncate">{task.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {formatDate(task.submitted_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => openDetail(task)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors mt-3"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Premium Modal for full details */}
      {modalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {detailLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent">
                      Proof Details
                    </h2>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row">
                  {/* Left: Proof Image */}
                  <div className="lg:w-2/5 bg-gradient-to-br from-gray-50 to-emerald-50/20 p-6 flex items-center justify-center">
                    {selectedTask.proof_image ? (
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={selectedTask.proof_image}
                          alt={selectedTask.proof_title}
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
                  <div className="lg:w-3/5 p-6 space-y-5">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-2xl font-bold text-gray-800">
                          {selectedTask.proof_title || selectedTask.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          selectedTask.task_type === "complaint"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : "bg-purple-100 text-purple-700 border border-purple-200"
                        }`}>
                          {selectedTask.task_type === "complaint" ? "📋 Complaint" : "⚠️ Violation"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Task ID: {selectedTask.task_id}</p>
                    </div>

                    {/* Original task info */}
                    <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 p-3 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Original Task</p>
                      <p className="text-gray-800 font-medium">{selectedTask.title}</p>
                      {selectedTask.category && <p className="text-sm text-gray-600">Category: {selectedTask.category}</p>}
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Proof Description</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.proof_description || "No description"}</p>
                    </div>

                    {selectedTask.address && (
                      <div className="bg-gradient-to-r from-gray-50 to-rose-50/30 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span className="text-xs font-semibold text-gray-500">Location</span>
                        </div>
                        <p className="text-gray-700">{selectedTask.address}</p>
                        {selectedTask.latitude && selectedTask.longitude && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            {selectedTask.latitude}, {selectedTask.longitude}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-gray-500">Submitted</span>
                        </div>
                        <p className="text-sm text-gray-700">{formatDate(selectedTask.submitted_at)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center gap-1 mb-1">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-semibold text-gray-500">Submitted By</span>
                        </div>
                        <p className="text-sm text-gray-700">{selectedTask.submitted_by_name || "Department User"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
                  <button onClick={() => setModalOpen(false)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminResolved;