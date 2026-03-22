import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function TpcLayout({ children, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_25%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] text-slate-900">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-72">
        <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
          <Topbar onMenuClick={() => setMobileOpen(true)} onLogout={onLogout} />
          {children}
        </main>
      </div>
    </div>
  );
}
