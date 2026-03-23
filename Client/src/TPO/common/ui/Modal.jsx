export default function Modal({ open, children }) {
  if (!open) {
    return null;
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">{children}</div>;
}
