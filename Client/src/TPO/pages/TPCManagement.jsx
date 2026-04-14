import { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import TpoSidebar from "./Tpo_sidebar";
import { placementDepartmentOptions } from "../../shared/placementJobs";
import {
  fetchTPCList,
  createTPC,
  deleteTPCById,
} from "../services/tpcApi";

function TPCManagement() {
  const [tpcList, setTpcList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    department: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTPCListData();
  }, []);

  const fetchTPCListData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTPCList();
      setTpcList(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error.message || "Failed to load TPC list",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.endsWith("@ritindia.edu")) {
      newErrors.email = "Must use @ritindia.edu email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTPC = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: null, text: "" });

      await createTPC(
        formData.email.toLowerCase().trim(),
        formData.password,
        formData.name.trim(),
        formData.department.trim(),
      );

      setMessage({
        type: "success",
        text: "TPC added successfully",
      });

      setFormData({ email: "", password: "", name: "", department: "" });
      setShowForm(false);
      await fetchTPCListData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error.message || "Failed to add TPC",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTPC = async (tpcId) => {
    if (!window.confirm("Are you sure you want to delete this TPC?")) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteTPCById(tpcId);

      setMessage({
        type: "success",
        text: "TPC deleted successfully",
      });

      await fetchTPCListData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error.message || "Failed to delete TPC",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TpoSidebar pageTitle="TPC Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">TPC Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage Training & Placement Coordinators and their departments
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            Add TPC
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Add New TPC
            </h2>
            <form onSubmit={handleAddTPC} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  placeholder="Enter TPC name"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    errors.name
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  placeholder="Enter @ritindia.edu email"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    errors.email
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password *
                </label>
                <div className={`flex h-10 items-center rounded-lg border pr-3 focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100 transition ${
                  errors.password
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-slate-300"
                }`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    placeholder="Minimum 6 characters"
                    className="h-full w-full border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-700 transition ml-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (errors.department)
                      setErrors({ ...errors, department: "" });
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    errors.department
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  }`}
                >
                  <option value="">Select a department</option>
                  {placementDepartmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add TPC"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ email: "", password: "", department: "" });
                    setErrors({});
                  }}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TPC List */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              TPC List ({tpcList.length})
            </h2>
          </div>

          {isLoading && tpcList.length === 0 ? (
            <div className="flex items-center justify-center px-6 py-12">
              <p className="text-slate-500">Loading TPCs...</p>
            </div>
          ) : tpcList.length === 0 ? (
            <div className="flex items-center justify-center px-6 py-12">
              <p className="text-slate-500">No TPCs added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Sr No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Department Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tpcList.map((tpc, index) => (
                    <tr
                      key={tpc.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {index + 1}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {tpc.department || tpc.department_name || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {tpc.name || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {tpc.email || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteTPC(tpc.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TpoSidebar>
  );
}

export default TPCManagement;
