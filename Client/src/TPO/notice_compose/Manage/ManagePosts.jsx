import PostTable from "./PostTable";
import ViewModal from "./ViewModal";

export default function ManagePosts({
  posts,
  viewingPost,
  onView,
  onEdit,
  onDelete,
  onCloseView,
  isLoading = false,
}) {
  return (
    <>
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
              Post Control
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Manage Posts</h2>
            <p className="mt-2 text-sm text-slate-500">
              Review existing content, inspect details, and reopen posts for editing.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Loading posts...
            </p>
          ) : null}
          <PostTable
            posts={posts}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </section>

      <ViewModal post={viewingPost} onClose={onCloseView} />
    </>
  );
}
