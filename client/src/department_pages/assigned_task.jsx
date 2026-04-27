import Layout from "../department_components/Department_Layout";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Clock, CheckCircle, Loader2, Calendar, Flag,
  AlertTriangle, Copy, X, ExternalLink,
  MapPin, Calendar as CalendarIcon, Hash, FolderOpen,
  MessageSquare, Map, Award, Timer, User, FileText,
  Sparkles, TrendingUp, Heart, Building, ListChecks
} from "lucide-react";
import {
  getAssignedTasks,
  getDeptTaskDetail,
  updateTaskStatus,
  rejectTask as rejectTaskAPI,
  addTaskRemark,
  aiTaskReview
} from "../apis/task.api";

function AssignedTasks() {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [addingRemark, setAddingRemark] = useState(false);
  const [error, setError] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedTasks(filter);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  // Auto‑open modal after returning from proof submission
  useEffect(() => {
    const { state } = location;
    if (state?.openTaskId && state?.taskType) {
      const task = tasks.find(t => t.id == state.openTaskId && t.type === state.taskType);
      if (task) {
        openTaskDetail(task);
      } else {
        getDeptTaskDetail(state.taskType, state.openTaskId)
          .then(data => {
            setSelectedTask(data);
            setShowModal(true);
          })
          .catch(console.error);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location, tasks]);

  const openTaskDetail = async (task) => {
    setError(null);
    setAiResult(null);
    setShowAi(false);
    try {
      const data = await getDeptTaskDetail(task.type, task.id);
      setSelectedTask(data);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Could not load task details");
    }
  };

  const updateStatus = async (status) => {
    if (!selectedTask) return;
    if (selectedTask.status === "Resolved") {
      alert("Task already resolved. Cannot change status.");
      return;
    }
    setUpdating(true);
    try {
      await updateTaskStatus({
        id: selectedTask.id,
        type: selectedTask.type,
        status,
      });
      await fetchTasks();
      setSelectedTask({ ...selectedTask, status });
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const rejectTask = async () => {
    if (!selectedTask || !rejectReason) return;
    setUpdating(true);
    try {
      await rejectTaskAPI({
        id: selectedTask.id,
        type: selectedTask.type,
        reason: rejectReason,
      });
      await fetchTasks();
      setShowModal(false);
      setShowRejectConfirm(false);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      alert("Failed to reject task");
    } finally {
      setUpdating(false);
    }
  };

  const addRemark = async () => {
    if (!selectedTask || !remarkText.trim()) return;
    setAddingRemark(true);
    try {
      await addTaskRemark({
        id: selectedTask.id,
        type: selectedTask.type,
        remark: remarkText,
      });
      const data = await getDeptTaskDetail(selectedTask.type, selectedTask.id);
      setSelectedTask(data);
      setRemarkText("");
    } catch (err) {
      console.error(err);
      alert("Failed to add remark");
    } finally {
      setAddingRemark(false);
    }
  };

  const getAiSuggestion = async () => {
    if (!selectedTask) return;
    setLoadingAi(true);
    setAiResult(null);
    setShowAi(true);
    try {
      const data = await aiTaskReview({
        taskId: selectedTask.id,
        type: selectedTask.type,
      });
      setAiResult(data.ai_analysis || data.ai);
    } catch (err) {
      console.error(err);
      setAiResult({
        decision: "ERROR",
        confidence: 0,
        risk_score: 0,
        urgency_score: 0,
        priority: "LOW",
        sentiment: "NEUTRAL",
        suggested_department: "Unknown",
        key_concerns: ["API_ERROR"],
        recommended_action: "Please try again later",
        flags: ["API_ERROR"],
        reason: err.message === "Route not found"
          ? "AI endpoint not configured. Please contact administrator."
          : err.message,
      });
    } finally {
      setLoadingAi(false);
    }
  };

  // --- helpers ---
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };
  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };
  const priorityConfig = (task) => {
    const isUrgent = task.manual_urgent || task.isUrgent;
    if (isUrgent) return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: <Flag className="w-4 h-4" />, label: "Urgent" };
    if (task.priority === "High") return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", icon: <Flag className="w-4 h-4" />, label: "High" };
    if (task.priority === "Medium") return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: <Clock className="w-4 h-4" />, label: "Medium" };
    return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: <CheckCircle className="w-4 h-4" />, label: "Low" };
  };
  const statusBadge = (status) => {
    switch (status) {
      case "In Progress": return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">In Progress</span>;
      case "Resolved": return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Resolved</span>;
      case "Rejected": return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Rejected</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Pending</span>;
    }
  };
  const isVideo = (url) => url?.includes(".mp4") || url?.includes(".webm");
  const getSentimentIcon = (sentiment) => {
    switch(sentiment?.toUpperCase()) {
      case "URGENT": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "NEGATIVE": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "POSITIVE": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Heart className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="relative mb-8 text-center sm:text-left">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-indigo-600 bg-clip-text text-transparent">My Assigned Tasks</h2>
            <p className="text-gray-500 mt-2">Track and manage your daily assignments</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["all", "urgent", "overdue", "spam", "duplicate", "legit"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md scale-105"
                    : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl"><p className="text-red-700">{error}</p></div>}

          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
          ) : tasks.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/30">
              <CheckCircle className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No assigned tasks</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => {
                const priority = priorityConfig(task);
                const isSpamOrDuplicate = task.is_spam || task.is_duplicate;
                const cardBgClass = isSpamOrDuplicate
                  ? "bg-red-50/80 hover:bg-red-100/90"
                  : "bg-white/90 hover:bg-white/95";

                return (
                  <div
                    key={task.id}
                    className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 backdrop-blur-sm ${cardBgClass}`}
                  >
                    {/* Top-right Spam/Duplicate badges */}
                    {isSpamOrDuplicate && (
                      <div className="absolute top-3 right-3 z-10 flex gap-1">
                        {task.is_spam && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white shadow-sm">
                            🚫 Spam
                          </span>
                        )}
                        {task.is_duplicate && (
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-600 text-white shadow-sm">
                            📋 Duplicate
                          </span>
                        )}
                      </div>
                    )}

                    {task.image_url && (
                      <div className="relative h-40 overflow-hidden">
                        {isVideo(task.image_url) ? (
                          <video src={task.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img src={task.image_url} alt={task.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{task.title}</h3>
                        {/* removed the old warning emoji */} 
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                          {priority.icon} {priority.label}
                        </span>
                        {statusBadge(task.status)}
                      </div>
                      <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                        {task.deadline && (
                          <div className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />{formatDate(task.deadline)}</div>
                        )}
                        <button onClick={() => openTaskDetail(task)} className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group/btn">
                          Details <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL (unchanged) ===================== */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 flex flex-col animate-scaleIn">
            {/* Spam/Duplicate alert */}
            {(selectedTask.is_spam || selectedTask.is_duplicate) && (
              <div className={`px-5 py-2 text-sm font-medium flex items-center gap-2 ${selectedTask.is_spam ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                {selectedTask.is_spam ? <AlertTriangle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                This task has been marked as {selectedTask.is_spam ? 'Spam' : 'Duplicate'}
              </div>
            )}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedTask.type === "complaint" ? "📋" : "⚠️"}</span>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition hover:rotate-90 duration-200">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image / Video */}
              {selectedTask.image_url && (
                <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-inner">
                  {isVideo(selectedTask.image_url) ? (
                    <video src={selectedTask.image_url} controls className="w-full max-h-80 object-contain" />
                  ) : (
                    <img src={selectedTask.image_url} alt="evidence" className="w-full max-h-80 object-contain transition-transform hover:scale-105 duration-500" />
                  )}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={<Hash className="w-4 h-4" />} label="ID" value={selectedTask.id} bgColor="bg-indigo-50/50" />
                <InfoItem icon={<User className="w-4 h-4" />} label="User ID" value={selectedTask.user_id} bgColor="bg-sky-50/50" />
                <InfoItem icon={<FolderOpen className="w-4 h-4" />} label="Category" value={selectedTask.category || "N/A"} bgColor="bg-purple-50/50" />
                <InfoItem icon={<Award className="w-4 h-4" />} label="Priority" value={selectedTask.priority || "Normal"} bgColor="bg-amber-50/50" />
                <InfoItem icon={<Sparkles className="w-4 h-4" />} label="Priority Score" value={selectedTask.priority_score || "0"} bgColor="bg-emerald-50/50" />
                <InfoItem icon={<CheckCircle className="w-4 h-4" />} label="Status" value={selectedTask.status} bgColor="bg-blue-50/50" />
                <InfoItem icon={<Timer className="w-4 h-4" />} label="Hotspot Score" value={selectedTask.hotspot_score || "0"} bgColor="bg-rose-50/50" />
                <InfoItem icon={<CalendarIcon className="w-4 h-4" />} label="Created" value={formatDateTime(selectedTask.created_at)} bgColor="bg-teal-50/50" />
                {selectedTask.deadline && <InfoItem icon={<Clock className="w-4 h-4" />} label="Deadline" value={formatDateTime(selectedTask.deadline)} bgColor="bg-orange-50/50" />}
                {selectedTask.completed_at && <InfoItem icon={<CheckCircle className="w-4 h-4" />} label="Completed" value={formatDateTime(selectedTask.completed_at)} bgColor="bg-green-50/50" />}
                {selectedTask.address && <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={selectedTask.address} bgColor="bg-cyan-50/50" />}
                {selectedTask.location && selectedTask.location.lat && selectedTask.location.lng && (
                  <InfoItem icon={<Map className="w-4 h-4" />} label="Location" value={`Lat: ${selectedTask.location.lat.toFixed(6)}, Lng: ${selectedTask.location.lng.toFixed(6)}`} bgColor="bg-slate-50/50" />
                )}
                <InfoItem icon={<Flag className="w-4 h-4" />} label="Manual Urgent" value={selectedTask.manual_urgent ? "Yes" : "No"} bgColor="bg-red-50/50" />
                <InfoItem icon={<AlertTriangle className="w-4 h-4" />} label="Spam" value={selectedTask.is_spam ? "Yes" : "No"} bgColor="bg-red-50/50" />
                <InfoItem icon={<Copy className="w-4 h-4" />} label="Duplicate" value={selectedTask.is_duplicate ? "Yes" : "No"} bgColor="bg-orange-50/50" />
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md transition">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><FileText className="w-4 h-4" /> Description</p>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedTask.description || "No description"}</p>
              </div>

              {/* AI Suggestion */}
              <div className="mt-2">
                <button onClick={getAiSuggestion} disabled={loadingAi} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-md">
                  <Sparkles className="w-4 h-4" /> {loadingAi ? "Analyzing..." : "🤖 AI Suggestion"}
                </button>
                {showAi && (loadingAi || aiResult) && (
                  <div className="mt-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 shadow-sm">
                    {loadingAi ? (
                      <div className="flex items-center gap-2 text-purple-600"><Loader2 className="w-4 h-4 animate-spin" /><span>AI is analyzing...</span></div>
                    ) : aiResult && (
                      <div className="space-y-4">
                        {/* Header: Decision + Confidence + Urgency */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" /><h4 className="font-bold text-gray-800 dark:text-white">AI Analysis</h4></div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              aiResult.decision === "APPROVE" ? "bg-green-100 text-green-700" :
                              aiResult.decision === "REJECT" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                            }`}>{aiResult.decision}</span>
                            {aiResult.urgency_score && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                aiResult.urgency_score >= 70 ? "bg-red-100 text-red-700" :
                                aiResult.urgency_score >= 40 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                              }`}>Urgency: {aiResult.urgency_score}%</span>
                            )}
                          </div>
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-gray-500"/><span className="text-gray-600">Confidence:</span><strong>{aiResult.confidence}%</strong></div>
                          <div className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-gray-500"/><span className="text-gray-600">Risk:</span><strong>{aiResult.risk_score}%</strong></div>
                          <div className="flex items-center gap-1"><Flag className="w-3.5 h-3.5 text-gray-500"/><span className="text-gray-600">Priority:</span><strong>{aiResult.priority}</strong></div>
                          <div className="flex items-center gap-1">{getSentimentIcon(aiResult.sentiment)}<span className="text-gray-600">Sentiment:</span><strong>{aiResult.sentiment || "NEUTRAL"}</strong></div>
                          {aiResult.suggested_department && <div className="flex items-center gap-1 col-span-2 md:col-span-1"><Building className="w-3.5 h-3.5 text-gray-500"/><span className="text-gray-600">Dept:</span><strong>{aiResult.suggested_department}</strong></div>}
                        </div>

                        {/* Key Concerns */}
                        {aiResult.key_concerns && aiResult.key_concerns.length > 0 && (
                          <div><div className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1"><ListChecks className="w-3.5 h-3.5"/> Key Concerns</div>
                          <div className="flex flex-wrap gap-1">{aiResult.key_concerns.map((c,i)=><span key={i} className="text-xs bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-full text-gray-600">{c}</span>)}</div></div>
                        )}

                        {/* Recommended Action */}
                        {aiResult.recommended_action && <div className="bg-indigo-50/50 p-2 rounded-lg"><span className="text-xs font-semibold text-indigo-600">💡 Recommended Action</span><p className="text-sm text-gray-700">{aiResult.recommended_action}</p></div>}
                        <p className="text-sm text-gray-700 dark:text-gray-300 border-t pt-2 mt-1"><span className="font-semibold">Reason:</span> {aiResult.reason}</p>
                        {aiResult.flags && aiResult.flags.length > 0 && <div className="flex flex-wrap gap-1">{aiResult.flags.map((f,i)=><span key={i} className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-600">{f}</span>)}</div>}
                        {aiResult.decision === "APPROVE" && <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">✅ AI suggests this is a genuine issue. You may approve and work on it.</div>}
                        {aiResult.decision === "REJECT" && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">❌ AI suggests rejection. Consider marking as spam or duplicate.</div>}
                        {aiResult.decision === "REVIEW" && <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-lg">⚠️ AI is uncertain. Please manually review the task.</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              {selectedTask.logs && selectedTask.logs.length > 0 && (
                <div><h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Activity Timeline</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scroll">
                  {selectedTask.logs.map((log, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl hover:shadow-md transition">
                      <div className="flex justify-between items-start"><span className="font-medium text-gray-800 dark:text-gray-200">{log.action}</span><span className="text-xs text-gray-400">{formatDateTime(log.created_at)}</span></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.message}</p>
                    </div>
                  ))}
                </div></div>
              )}

              {/* Add Remark */}
              <div className="bg-white/50 dark:bg-slate-800/30 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Remark</label>
                <div className="flex gap-2">
                  <input type="text" value={remarkText} onChange={(e) => setRemarkText(e.target.value)} placeholder="Type a remark..." className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  <button onClick={addRemark} disabled={addingRemark || !remarkText.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">{addingRemark ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</button>
                </div>
              </div>

              {/* Status Update & Submit Proof */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateStatus("Pending")} disabled={selectedTask.status === "Resolved"} className={`px-4 py-2 rounded-xl transition ${selectedTask.status === "Resolved" ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300"}`}>Pending</button>
                  <button onClick={() => updateStatus("In Progress")} disabled={selectedTask.status === "Resolved"} className={`px-4 py-2 rounded-xl text-white transition ${selectedTask.status === "Resolved" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>In Progress</button>
                  <button onClick={() => updateStatus("Resolved")} disabled={selectedTask.status === "Resolved"} className={`px-4 py-2 rounded-xl text-white transition ${selectedTask.status === "Resolved" ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>Resolved</button>
                  <button onClick={() => setShowRejectConfirm(true)} disabled={selectedTask.status === "Resolved"} className={`px-4 py-2 rounded-xl text-white transition ${selectedTask.status === "Resolved" ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>Reject</button>
                </div>
                {updating && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mt-2" />}

                {/* Submit Proof button */}
                {selectedTask.status === "Resolved" && !selectedTask.hasProof && (
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = `/submit-proof/${selectedTask.type}/${selectedTask.id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
                    >
                      📸 Submit Proof
                    </button>
                  </div>
                )}
                {selectedTask.status === "Resolved" && selectedTask.hasProof && (
                  <div className="mt-4 text-sm text-green-600 bg-green-50 p-2 rounded-lg">✅ Proof already submitted for this task.</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject confirmation modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20">
            <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Reject Task</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Why are you rejecting this task?</p>
            <div className="flex gap-3">
              <button onClick={() => { setRejectReason("duplicate"); rejectTask(); }} className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">Duplicate</button>
              <button onClick={() => { setRejectReason("spam"); rejectTask(); }} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600">Spam</button>
              <button onClick={() => setShowRejectConfirm(false)} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-xl hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
      `}</style>
    </Layout>
  );
}

function InfoItem({ icon, label, value, bgColor = "bg-gray-50/50" }) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-xl ${bgColor} hover:bg-white dark:hover:bg-slate-700/50 transition-all duration-200 group shadow-sm`}>
      <div className="text-gray-500 dark:text-gray-400 mt-0.5 group-hover:scale-110 transition-transform group-hover:text-indigo-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default AssignedTasks;