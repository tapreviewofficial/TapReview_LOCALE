import { useEffect, useState } from "react";

export default function AdminBar() {
  const [state, setState] = useState<{impersonating:boolean}>({ impersonating: false });

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setState({ impersonating: d?.impersonating }));
  }, []);

  if (!state.impersonating) return null;

  const stop = async () => {
    await fetch("/api/admin/stop-impersonate", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-sm px-4 py-2 flex items-center justify-between">
      <span>Stai impersonando un utente. Le azioni verranno eseguite come lui.</span>
      <button onClick={stop} className="underline hover:no-underline">
        Stop impersona
      </button>
    </div>
  );
}