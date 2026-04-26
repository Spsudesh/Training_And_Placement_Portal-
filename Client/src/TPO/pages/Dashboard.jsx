import { useEffect, useMemo, useState } from "react";
import ComposePage from "../notice_compose/Compose/ComposePage";
import PostList from "../notice_compose/Feed/PostList";
import FilterBar from "../notice_compose/Filters/FilterBar";
import ManagePosts from "../notice_compose/Manage/ManagePosts";
import EditPostModal from "../notice_compose/Manage/EditPostModal";
import TpoSidebar from "./Tpo_sidebar";
import TpcSidebar from "../../TPC/pages/Tpc_sidebar";
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  updateNotice,
} from "../services/noticeApi";
import {
  fetchNoticeAudienceEmails,
  sendNoticeMail,
} from "../mail/services/noticeMailApi";
import {
  getAttachmentSummary,
  parsePassingYears,
} from "../mail/utils/noticeMailHelpers";
import { parseAllowedDepartments } from "../notice_compose/Compose/noticeTargetOptions";
import {
  buildWhatsAppMessage,
  copyTextToClipboard,
} from "../whatsapp/utils/noticeWhatsappHelpers";

function createEmptyFormData(type = "") {
  return {
    type,
    title: "",
    description: "",
    department: "All Departments",
    year: "",
    files: [],
    companyName: "",
    role: "",
    location: "",
    ctc: "",
    stipend: "",
    duration: "",
    minCgpa: "",
    maxBacklogs: "",
    deadline: "",
  };
}

function createEmptyActionStatus() {
  return {
    post: false,
    mail: false,
    whatsapp: false,
  };
}

export function NoticeBoardWorkspace({
  panelScope = "tpo",
  workspaceLabel = "TPO",
}) {
  const [posts, setPosts] = useState([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMailing, setIsMailing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createActionStatus, setCreateActionStatus] = useState(createEmptyActionStatus());
  const [createActionMessages, setCreateActionMessages] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        const records = await fetchNotices(panelScope);

        if (!isMounted) {
          return;
        }

        setPosts(records);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPosts([]);
        setErrorMessage(error.response?.data?.message || "Failed to load notices.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      isMounted = false;
    };
  }, []);

  function resetCreateComposer() {
    setCreateFormData(createEmptyFormData(""));
    setCreateActionStatus(createEmptyActionStatus());
    setCreateActionMessages([]);
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
      year: current.year,
      files: current.files,
    }));
  }

  function handleCreateTypeChange(type) {
    setCreateActionStatus(createEmptyActionStatus());
    setCreateActionMessages([]);
    updateFormData(setCreateFormData, type);
  }

  function handleEditTypeChange(type) {
    updateFormData(setEditFormData, type);
  }

  function handleCreateFieldChange(field, value) {
    if (createActionMessages.length) {
      setCreateActionStatus(createEmptyActionStatus());
      setCreateActionMessages([]);
    }

    setCreateFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEditFieldChange(field, value) {
    setEditFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCreateFileChange(files) {
    if (createActionMessages.length) {
      setCreateActionStatus(createEmptyActionStatus());
      setCreateActionMessages([]);
    }

    setCreateFormData((current) => ({
      ...current,
      files: [
        ...current.files,
        ...files.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        })),
      ],
    }));
  }

  function handleEditFileChange(files) {
    setEditFormData((current) => ({
      ...current,
      files: [
        ...current.files,
        ...files.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        })),
      ],
    }));
  }

  function removeCreateFile(index) {
    if (createActionMessages.length) {
      setCreateActionStatus(createEmptyActionStatus());
      setCreateActionMessages([]);
    }

    setCreateFormData((current) => ({
      ...current,
      files: current.files.filter((_, fileIndex) => fileIndex !== index),
    }));
  }

  function removeEditFile(index) {
    setEditFormData((current) => ({
      ...current,
      files: current.files.filter((_, fileIndex) => fileIndex !== index),
    }));
  }

  function validateForm(formData) {
    if (!formData.type || !formData.title.trim() || !formData.description.trim()) {
      return false;
    }

    if (formData.type === "announcement") {
      return true;
    }

    return Boolean(
      formData.companyName.trim() &&
        formData.role.trim() &&
        formData.deadline,
    );
  }

  function appendCreateActionMessage(message) {
    setCreateActionMessages((current) =>
      current.includes(message) ? current : [...current, message]
    );
  }

  async function handleCreateMail() {
    if (!validateForm(createFormData) || isMailing || createActionStatus.mail) {
      window.alert("Please fill the required fields before preparing the mail.");
      return;
    }

    setIsMailing(true);

    try {
      const departments = parseAllowedDepartments(createFormData.department);
      const years = parsePassingYears(createFormData.year);
      const audience = await fetchNoticeAudienceEmails(panelScope, {
        departments,
        passingYears: years,
      });

      if (!audience.emails.length) {
        window.alert("No student college emails were found for the selected department and year.");
        return;
      }

      const attachmentLines = getAttachmentSummary(createFormData.files);
      const result = await sendNoticeMail(panelScope, createFormData);
      setErrorMessage("");
      setCreateActionStatus((current) => ({
        ...current,
        mail: true,
      }));
      appendCreateActionMessage(
        attachmentLines.length
          ? `${result.message} Attachments included: ${attachmentLines.join(", ")}`
          : result.message
      );
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send notice email.";
      setErrorMessage(message);
      window.alert(message);
    } finally {
      setIsMailing(false);
    }
  }

  function handleCreateWhatsapp() {
    if (!validateForm(createFormData)) {
      window.alert("Please fill the required fields before preparing the WhatsApp message.");
      return;
    }

    if (createActionStatus.whatsapp) {
      return;
    }

    const departments = parseAllowedDepartments(createFormData.department);
    const years = parsePassingYears(createFormData.year);
    const message = buildWhatsAppMessage(createFormData, { departments, years });

    copyTextToClipboard(message)
      .then(() => {
        setCreateActionStatus((current) => ({
          ...current,
          whatsapp: true,
        }));
        appendCreateActionMessage("Structured WhatsApp message copied successfully. Paste it into your WhatsApp group.");
        setErrorMessage("");
      })
      .catch((error) => {
        const failureMessage = error?.message || "Failed to copy WhatsApp message.";
        setErrorMessage(failureMessage);
        window.alert(failureMessage);
      });
  }

  async function publishCreatePost() {
    if (!validateForm(createFormData) || isSaving || createActionStatus.post) {
      window.alert("Please fill the required fields before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const createdPost = await createNotice(panelScope, createFormData, "published");
      setPosts((current) => [createdPost, ...current]);
      setErrorMessage("");
      setCreateActionStatus((current) => ({
        ...current,
        post: true,
      }));
      appendCreateActionMessage("Post created successfully in portal.");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to create notice.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishEditedPost() {
    if (!validateForm(editFormData) || !selectedPostId || isSaving) {
      window.alert("Please fill the required fields before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedPost = await updateNotice(panelScope, selectedPostId, editFormData, "published");

      setPosts((current) =>
        current.map((post) => (post.id === selectedPostId ? updatedPost : post)),
      );

      if (viewingPost?.id === selectedPostId) {
        setViewingPost(updatedPost);
      }

      setErrorMessage("");
      resetEditComposer();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to update notice.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(post) {
    setEditingPost(post);
    setSelectedPostId(post.id);
    setEditFormData({
      ...createEmptyFormData(post.type),
      ...post,
      files: post.files || [],
    });
  }

  async function handleDelete(postId) {
    const shouldDelete = window.confirm("Are you sure you want to delete this post?");

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteNotice(panelScope, postId);
      setPosts((current) => current.filter((post) => post.id !== postId));

      if (selectedPostId === postId) {
        resetEditComposer();
      }

      if (viewingPost?.id === postId) {
        setViewingPost(null);
      }

      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to delete notice.");
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

  const filteredPosts = useMemo(() => {
    return [...posts]
      .filter((post) => {
        const searchValue = filters.search.trim().toLowerCase();
        const matchesSearch =
          !searchValue ||
          post.title.toLowerCase().includes(searchValue) ||
          post.description.toLowerCase().includes(searchValue);
        const matchesType = filters.type === "all" || post.type === filters.type;
        const matchesDepartment =
          filters.department === "All Departments" ||
          post.department === filters.department ||
          post.departments?.includes(filters.department);

        return matchesSearch && matchesType && matchesDepartment;
      })
      .sort((firstPost, secondPost) => {
        const firstDate = new Date(firstPost.updatedAt || firstPost.createdAt).getTime();
        const secondDate = new Date(secondPost.updatedAt || secondPost.createdAt).getTime();

        return filters.sort === "latest" ? secondDate - firstDate : firstDate - secondDate;
      });
  }, [filters, posts]);

  const activeTypeLabel =
    createFormData.type === "placement"
      ? "Placement Opportunity"
      : createFormData.type === "internship"
        ? "Internship"
        : createFormData.type === "announcement"
          ? "Announcement"
          : "Not Selected";

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="relative px-6 py-5 sm:px-8 lg:px-10 lg:py-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.12),_transparent_26%),radial-gradient(circle_at_left,_rgba(100,116,139,0.08),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_48%,_#f1f5f9_100%)]" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                    {workspaceLabel} Workspace
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
                    Active Form: {activeTypeLabel}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                  Professional notice management for announcements, placements, and internships.
                </h1>
                <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Publish updates directly, switch formats with one click, and manage all {workspaceLabel} notices from one clean workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {errorMessage}
          </section>
        ) : null}

        <ComposePage
          formData={createFormData}
          editMode={false}
          onTypeChange={handleCreateTypeChange}
          onFieldChange={handleCreateFieldChange}
          onFileChange={handleCreateFileChange}
          onRemoveFile={removeCreateFile}
          onMail={handleCreateMail}
          onWhatsapp={handleCreateWhatsapp}
          onPublish={publishCreatePost}
          onCancelEdit={resetCreateComposer}
          isSaving={isSaving}
          isMailing={isMailing}
          actionStatus={createActionStatus}
          actionMessages={createActionMessages}
          totalPosts={posts.length}
          title="Create Post"
          description="Select a format and only that form will appear below."
        />

        <FilterBar filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

        <ManagePosts
          posts={filteredPosts}
          viewingPost={viewingPost}
          onView={setViewingPost}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCloseView={() => setViewingPost(null)}
          isLoading={isLoading}
        />

        <PostList posts={filteredPosts} isLoading={isLoading} />
      </div>

      <EditPostModal
        post={editingPost}
        formData={editFormData}
        onClose={resetEditComposer}
        onTypeChange={handleEditTypeChange}
        onFieldChange={handleEditFieldChange}
        onFileChange={handleEditFileChange}
        onRemoveFile={removeEditFile}
        onPublish={publishEditedPost}
        isSaving={isSaving}
      />
    </>
  );
}

export default function Dashboard({
  onLogout,
  panelScope = "tpo",
  pageTitle = "Notice Compose Center",
}) {
  const SidebarComponent = panelScope === "tpc" ? TpcSidebar : TpoSidebar;
  const workspaceLabel = panelScope.toUpperCase();

  return (
    <SidebarComponent pageTitle={pageTitle} onLogout={onLogout}>
      <NoticeBoardWorkspace panelScope={panelScope} workspaceLabel={workspaceLabel} />
    </SidebarComponent>
  );
}
