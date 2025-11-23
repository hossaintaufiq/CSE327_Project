"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import apiClient from "@/utils/api";
import Sidebar from "@/components/Sidebar";
import JiraIssueCreator from "@/components/JiraIssueCreator";
import JiraIssuesList from "@/components/JiraIssuesList";
import { Plus, Edit, Trash2, Search, CheckSquare, Calendar, User, AlertCircle, X, FolderKanban } from "lucide-react";

export default function TasksPage() {
  const router = useRouter();
  const { user, activeCompanyId, activeCompanyRole, isSuperAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
    tags: "",
    estimatedHours: "",
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSuperAdmin()) {
      router.push("/super-admin");
      return;
    }
    if (!activeCompanyId) {
      router.push("/company-selection");
      return;
    }
    
    const loadData = async () => {
      await loadTasks();
      await loadProjects();
      await loadEmployees();
    };
    
    loadData();
  }, [activeCompanyId, router, isSuperAdmin]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/tasks");
      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
      } else {
        setError("Failed to load tasks");
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setError(error.response?.data?.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await apiClient.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data.projects || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await apiClient.get("/company/members");
      if (response.data.success) {
        const assignableMembers = (response.data.data.members || []).filter(
          (member) => 
            member.role === "employee" || 
            member.role === "manager" || 
            member.role === "company_admin"
        );
        setEmployees(assignableMembers);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError("");

      if (!formData.title) {
        setError("Task title is required");
        return;
      }

      const payload = {
        ...formData,
        projectId: formData.projectId || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0,
      };

      if (editingTask) {
        const response = await apiClient.put(`/tasks/${editingTask._id}`, payload);
        if (response.data.success) {
          await loadTasks();
          setShowModal(false);
          setEditingTask(null);
          resetForm();
          // Dispatch event to refresh dashboard
          window.dispatchEvent(new CustomEvent('taskUpdated'));
        } else {
          setError(response.data.message || "Failed to update task");
        }
      } else {
        const response = await apiClient.post("/tasks", payload);
        if (response.data.success) {
          await loadTasks();
          setShowModal(false);
          resetForm();
          // Dispatch event to refresh dashboard
          window.dispatchEvent(new CustomEvent('taskUpdated'));
        } else {
          setError(response.data.message || "Failed to create task");
        }
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      setError(error.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      projectId: task.projectId?._id || task.projectId || "",
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      tags: task.tags ? task.tags.join(', ') : "",
      estimatedHours: task.estimatedHours || "",
      notes: task.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      setDeleting(taskId);
      const response = await apiClient.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        await loadTasks();
        // Dispatch event to refresh dashboard
        window.dispatchEvent(new CustomEvent('taskUpdated'));
      } else {
        setError(response.data.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(error.response?.data?.message || "Failed to delete task");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: "",
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
      tags: "",
      estimatedHours: "",
      notes: "",
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesProject = projectFilter === "all" || 
      (projectFilter === "none" && !task.projectId) ||
      (task.projectId?._id?.toString() === projectFilter || task.projectId?.toString() === projectFilter);
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "review":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "todo":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  // Calculate statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate)).length,
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
              <p className="text-gray-400">Manage your tasks</p>
            </div>
            {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager" || activeCompanyRole === "employee") && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Task
              </button>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Total Tasks</h3>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">To Do</h3>
              <p className="text-3xl font-bold text-white">{stats.todo}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">In Progress</h3>
              <p className="text-3xl font-bold text-white">{stats.in_progress}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Overdue</h3>
              <p className="text-3xl font-bold text-white">{stats.overdue}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              <option value="none">No Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                <CheckSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No tasks found</p>
                {searchTerm && (
                  <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {isOverdue(task.dueDate) && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-gray-300 text-sm mb-2">{task.description}</p>
                      )}
                    </div>
                    {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager" || 
                      (activeCompanyRole === "employee" && task.assignedTo?._id?.toString() === user?._id?.toString())) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(activeCompanyRole === "company_admin" || activeCompanyRole === "manager") && (
                          <button
                            onClick={() => handleDelete(task._id)}
                            disabled={deleting === task._id}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === task._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Task Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {task.projectId && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <FolderKanban className="w-4 h-4" />
                        <span>{task.projectId.name}</span>
                      </div>
                    )}
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="w-4 h-4" />
                        <span>{task.assignedTo.name || task.assignedTo.email}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-2 ${isOverdue(task.dueDate) ? 'text-red-400' : 'text-gray-300'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.estimatedHours > 0 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <CheckSquare className="w-4 h-4" />
                        <span>Est: {task.estimatedHours}h</span>
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <span className="text-xs">Tags: {task.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Jira Integration */}
                  <div className="mt-4 flex items-center justify-between">
                    <JiraIssuesList jiraIssues={task.jiraIssues} />
                    <JiraIssueCreator
                      entityType="task"
                      entityId={task._id}
                      entityName={task.title}
                      onIssueCreated={() => loadTasks()} // Refresh the task list
                      buttonVariant="outline"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                  resetForm();
                  setError("");
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project (Optional)</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  disabled={loadingProjects || submitting}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    disabled={loadingEmployees || submitting}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.userId || emp._id} value={emp.userId || emp._id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    resetForm();
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
