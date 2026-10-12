import React from "react";
import { Bot, PanelRight } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import CareerSnapshot from "./CareerSnapshot";

export default function CareerCoachLayout({ children, conversations, selectedId, onSelect, onNew, onRename, onDelete, dashboard, snapshotOpen, onToggleSnapshot }) {
  return <div className="coach-layout"><ChatSidebar conversations={conversations} selectedId={selectedId} onSelect={onSelect} onNew={onNew} onRename={onRename} onDelete={onDelete} /><section className="coach-main"><header className="coach-main-header"><div className="coach-title"><div className="coach-large-avatar"><Bot size={23} /></div><div><p className="coach-kicker">IntelliHire · private guidance</p><h1>AI Career Coach</h1><span>Practical direction for your next placement step</span></div></div><button className="coach-mobile-snapshot-button" onClick={onToggleSnapshot}><PanelRight size={15} /> Snapshot</button></header>{children}</section><CareerSnapshot dashboard={dashboard} open={snapshotOpen} onToggle={onToggleSnapshot} /></div>;
}
