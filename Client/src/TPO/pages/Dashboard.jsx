import { useState } from "react";
import ComposePage from "../notice_compose/Compose/ComposePage";
import PostList from "../notice_compose/Feed/PostList";
import FilterBar from "../notice_compose/Filters/FilterBar";
import ManagePosts from "../notice_compose/Manage/ManagePosts";
import EditPostModal from "../notice_compose/Manage/EditPostModal";
import TpoSidebar from "./Tpo_sidebar";
import { useNavigate } from "react-router-dom";

function createEmptyFormData(type = "announcement") {
  return {
    type,
    title: "",
    description: "",
    department: "All Departments",
    file: null,
    attachmentName: "",
    companyName: "",
    role: "",
    location: "",
    ctc: "",
    cgpa: "",
    backlogs: "",
    hiringProcess: ["Online Assessment"],
    deadline: "",
  };
}

const initialPosts = [
  {
    id: 1,
    type: "announcement",
    status: "published",
    title: "Pre-Placement Talk Schedule Released",
    description:
      "Students are requested to attend the central auditorium briefing for the upcoming placement drive.",
    department: "All Departments",
    attachmentName: "ppt_schedule.pdf",
    file: null,
    companyName: "",
    role: "",
    location: "",
    ctc: "",
    cgpa: "",
    backlogs: "",
    hiringProcess: [""],
    deadline: "",
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-03-18T09:00:00.000Z",
  },
  {
    id: 2,
    type: "job",
    status: "published",
    title: "Infosys Off-Campus Hiring Drive",
    description:
      "Applications are open for 2026 graduating students with strong programming fundamentals and communication skills.",
    department: "CSE",
    attachmentName: "infosys_jd.pdf",
    file: null,
    companyName: "Infosys",
    role: "Systems Engineer",
    location: "Bengaluru",
    ctc: "8.5 LPA",
    cgpa: "7.0 and above",
    backlogs: "No active backlogs",
    hiringProcess: ["Aptitude Test", "Technical Interview", "HR Interview"],
    deadline: "2026-03-28",
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: 3,
    type: "internship",
    status: "draft",
    title: "Summer Internship at Deloitte",
    description:
      "A six-month internship focused on analytics, dashboards, and process automation for penultimate-year students.",
    department: "IT",
    attachmentName: "deloitte_internship.pdf",
    file: null,
    companyName: "Deloitte",
    role: "Data Analyst Intern",
    location: "Hyderabad",
    ctc: "",
    cgpa: "6.5 and above",
    backlogs: "Maximum 1 backlog",
    hiringProcess: ["Resume Screening", "Case Round", "Manager Discussion"],
    deadline: "2026-03-30",
    createdAt: "2026-03-21T11:30:00.000Z",
    updatedAt: "2026-03-21T11:30:00.000Z",
  },
];

export default function Dashboard({ onLogout, onNavigate }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(initialPosts);
  const [createFormData, setCreateFormData] = useState(createEmptyFormData(""));
  const [editFormData, setEditFormData] = useState(createEmptyFormData());
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    department: "All Departments",
    sort: "latest",
  });
  const [viewingPost, setViewingPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  function resetCreateComposer() {
    setCreateFormData(createEmptyFormData(""));
  }

  function resetEditComposer() {
    setEditFormData(createEmptyFormData());
    setEditingPost(null);
    setSelectedPostId(null);
  }

  function updateFormData(setter, type) {
    setter((current) => ({
      ...createEmptyFormData(type),
      title: current.title,
      description: current.description,
      department: current.department,
      file: current.file,
      attachmentName: current.attachmentName,
    }));
  }

  function handleCreateTypeChange(type) {
    updateFormData(setCreateFormData, type);
  }

  function handleEditTypeChange(type) {
    updateFormData(setEditFormData, type);
  }

  function handleCreateFieldChange(field, value) {
    setCreateFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEditFieldChange(field, value) {
    setEditFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "file" ? { attachmentName: value?.name || "" } : {}),
    }));
  }

  function handleCreateFileChange(file) {
    setCreateFormData((current) => ({
      ...current,
      file,
      attachmentName: file?.name || "",
    }));
  }

  function handleEditFileChange(file) {
    setEditFormData((current) => ({
      ...current,
      file,
      attachmentName: file?.name || "",
    }));
  }

  function updateStages(setter, index, value) {
    setter((current) => ({
      ...current,
      hiringProcess: current.hiringProcess.map((stage, stageIndex) =>
        stageIndex === index ? value : stage
      ),
    }));
  }

  function handleCreateStageChange(index, value) {
    updateStages(setCreateFormData, index, value);
  }

  function handleEditStageChange(index, value) {
    updateStages(setEditFormData, index, value);
  }

  function addStage(setter) {
    setter((current) => ({
      ...current,
      hiringProcess: [...current.hiringProcess, ""],
    }));
  }

  function handleCreateAddStage() {
    addStage(setCreateFormData);
  }

  function handleEditAddStage() {
    addStage(setEditFormData);
  }

  function removeStage(setter, index) {
    setter((current) => ({
      ...current,
      hiringProcess:
        current.hiringProcess.length === 1
          ? current.hiringProcess
          : current.hiringProcess.filter((_, stageIndex) => stageIndex !== index),
    }));
  }

  function handleCreateRemoveStage(index) {
    removeStage(setCreateFormData, index);
  }

  function handleEditRemoveStage(index) {
    removeStage(setEditFormData, index);
  }

  function buildPostPayload(formData, status, isEditMode = false) {
    const now = new Date().toISOString();
    const existingPost = posts.find((post) => post.id === selectedPostId);

    return {
      ...formData,
      id: isEditMode && selectedPostId ? selectedPostId : Date.now(),
      status,
      file: null,
      attachmentName: formData.file?.name || formData.attachmentName,
      hiringProcess:
        formData.type === "announcement"
          ? [""]
          : formData.hiringProcess.filter((stage) => stage.trim()),
      createdAt: existingPost?.createdAt || now,
      updatedAt: now,
    };
  }

  function validateForm(formData) {
    return formData.title.trim() && formData.description.trim();
  }

  function upsertCreatePost(status) {
    if (!validateForm(createFormData)) {
      window.alert("Please fill in the title and description before saving.");
      return;
    }

    const nextPost = buildPostPayload(createFormData, status);

    setPosts((current) => [nextPost, ...current]);
    resetCreateComposer();
  }

  function upsertEditedPost(status) {
    if (!validateForm(editFormData)) {
      window.alert("Please fill in the title and description before saving.");
      return;
    }

    const nextPost = buildPostPayload(editFormData, status, true);

    setPosts((current) =>
      current.map((post) => (post.id === selectedPostId ? nextPost : post))
    );
    resetEditComposer();
  }

  function handleEdit(post) {
    setEditingPost(post);
    setSelectedPostId(post.id);
    setEditFormData({
      ...createEmptyFormData(post.type),
      ...post,
      file: null,
      attachmentName: post.attachmentName || "",
      hiringProcess:
        post.type === "announcement"
          ? [""]
          : post.hiringProcess?.length
            ? post.hiringProcess
            : [""],
    });
  }

  function handleDelete(postId) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!shouldDelete) {
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== postId));

    if (selectedPostId === postId) {
      resetEditComposer();
    }

    if (viewingPost?.id === postId) {
      setViewingPost(null);
    }
  }

  function handleFilterChange(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      type: "all",
      department: "All Departments",
      sort: "latest",
    });
  }

  const filteredPosts = [...posts]
    .filter((post) => {
      const searchValue = filters.search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        post.title.toLowerCase().includes(searchValue) ||
        post.description.toLowerCase().includes(searchValue);
      const matchesType = filters.type === "all" || post.type === filters.type;
      const matchesDepartment =
        filters.department === "All Departments" ||
        post.department === filters.department;

      return matchesSearch && matchesType && matchesDepartment;
    })
    .sort((firstPost, secondPost) => {
      const firstDate = new Date(
        firstPost.updatedAt || firstPost.createdAt
      ).getTime();
      const secondDate = new Date(
        secondPost.updatedAt || secondPost.createdAt
      ).getTime();

      return filters.sort === "latest"
        ? secondDate - firstDate
        : firstDate - secondDate;
    });

  const activeTypeLabel =
    createFormData.type === "job"
      ? "Job Opportunity"
      : createFormData.type === "internship"
        ? "Internship"
        : createFormData.type === "announcement"
          ? "Announcement"
          : "Not Selected";

  function handleSidebarNavigate(pageLabel) {
    if (pageLabel === "Placement Opportunity") {
      navigate("/tpo-dashboard/placements");
      return;
    }

    if (pageLabel === "Notice Board") {
      navigate("/tpo-dashboard/notice-board");
      return;
    }

    if (pageLabel === "Dashboard") {
      navigate("/tpo-dashboard");
      return;
    }

    onNavigate?.(pageLabel);
  }

  return (
    <TpoSidebar
      pageTitle="Notice Compose Center"
      activePage="Notice Board"
      onNavigate={handleSidebarNavigate}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="relative px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.12),_transparent_26%),radial-gradient(circle_at_left,_rgba(100,116,139,0.08),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_48%,_#f1f5f9_100%)]" />
            <div className="relative">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                    TPO Workspace
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                    Active Form: {activeTypeLabel}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                  Professional notice management for announcements, jobs, and internships.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Draft updates, switch formats with one click, and manage all posts from one clean workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ComposePage
          formData={createFormData}
          editMode={false}
          onTypeChange={handleCreateTypeChange}
          onFieldChange={handleCreateFieldChange}
          onFileChange={handleCreateFileChange}
          onStageChange={handleCreateStageChange}
          onAddStage={handleCreateAddStage}
          onRemoveStage={handleCreateRemoveStage}
          onSaveDraft={() => upsertCreatePost("draft")}
          onPublish={() => upsertCreatePost("published")}
          onCancelEdit={resetCreateComposer}
          title="Create Post"
          description="Select a format and only that form will appear below."
        />

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />

        <ManagePosts
          posts={filteredPosts}
          viewingPost={viewingPost}
          onView={setViewingPost}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCloseView={() => setViewingPost(null)}
        />

        <PostList posts={filteredPosts} />
      </div>

      <EditPostModal
        post={editingPost}
        formData={editFormData}
        onClose={resetEditComposer}
        onTypeChange={handleEditTypeChange}
        onFieldChange={handleEditFieldChange}
        onFileChange={handleEditFileChange}
        onStageChange={handleEditStageChange}
        onAddStage={handleEditAddStage}
        onRemoveStage={handleEditRemoveStage}
        onSaveDraft={() => upsertEditedPost("draft")}
        onPublish={() => upsertEditedPost("published")}
      />
    </TpoSidebar>
  );
}
