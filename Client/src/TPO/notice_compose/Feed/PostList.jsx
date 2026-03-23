import PostCard from "./PostCard";

export default function PostList({ posts }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
            Latest Feed
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Posts Feed</h2>
          <p className="mt-2 text-sm text-slate-500">
            Published and draft entries are shown with the newest updates first.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {posts.length} result{posts.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center xl:col-span-2">
            <p className="text-base font-semibold text-slate-800">No posts to display</p>
            <p className="mt-2 text-sm text-slate-500">
              Reset the filters or publish a fresh update from the compose section.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
