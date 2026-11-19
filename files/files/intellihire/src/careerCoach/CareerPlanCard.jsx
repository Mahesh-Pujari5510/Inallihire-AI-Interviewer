import React from "react";
import { CalendarDays, Check, Clock3, Save } from "lucide-react";

export default function CareerPlanCard({ plan, onSave, saved }) {
  if (!plan) return null;
  return <section className="coach-plan-card"><div className="coach-plan-heading"><div><p className="coach-kicker">Suggested roadmap</p><h3>{plan.title}</h3><span><CalendarDays size={13} /> {plan.durationDays}-day plan · {plan.tasks?.length || 0} tasks</span></div><button className="coach-save-plan" disabled={saved} onClick={() => onSave(plan)}>{saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save plan</>}</button></div><div className="coach-plan-tasks">{(plan.tasks || []).slice(0, 6).map(task => <div key={`${task.day}-${task.title}`}><div className="coach-plan-day">{task.day}</div><div className="coach-plan-task-copy"><strong>{task.title}</strong><p>{task.reason}</p><small><Clock3 size={12} /> {task.estimatedMinutes} min · {task.priority || "focused"}</small></div></div>)}</div></section>;
}
