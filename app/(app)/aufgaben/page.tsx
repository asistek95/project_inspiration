"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "hoch" | "mittel" | "niedrig";
type TaskStatus = "offen" | "erledigt";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
}

const STORAGE_KEY = "klarblick.aufgaben";

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  hoch: { label: "Hoch", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  mittel: { label: "Mittel", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  niedrig: { label: "Niedrig", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
};

const CATEGORIES = [
  "Belege", "Steuer", "Mandant", "Frist", "Rückfrage", "Intern", "Sonstiges"
];

const DEMO_TASKS: Task[] = [
  {
    id: "t1",
    title: "Reverse-Charge-Eigenberechnung für Google Ads prüfen",
    description: "3 Belege aus Mai haben Reverse-Charge-Flag — §19 UStG Eigenberechnung eintragen",
    priority: "hoch",
    status: "offen",
    category: "Steuer",
    assignee: "Steuerberater",
    dueDate: "2026-06-30",
    createdAt: "2026-06-15",
  },
  {
    id: "t2",
    title: "Gastro Wien e.U. — Bewirtungsbelege vervollständigen",
    description: "Belege fehlen: Anlass, Teilnehmer, Geschäftszweck (50%-Abzug gefährdet)",
    priority: "hoch",
    status: "offen",
    category: "Mandant",
    assignee: "Mandant",
    dueDate: "2026-06-20",
    createdAt: "2026-06-14",
  },
  {
    id: "t3",
    title: "UVA Juni einreichen",
    description: "Frist: 15. August 2026",
    priority: "mittel",
    status: "offen",
    category: "Frist",
    dueDate: "2026-08-15",
    createdAt: "2026-06-01",
  },
  {
    id: "t4",
    title: "IT Service Huber — Belege nachreichen",
    description: "8 ungeprufte Belege aus April und Mai — Mandant kontaktieren",
    priority: "mittel",
    status: "offen",
    category: "Rückfrage",
    assignee: "Mandant",
    createdAt: "2026-06-10",
  },
  {
    id: "t5",
    title: "Mustermann Bau — Mai-Abschluss freigegeben",
    description: "Alle Belege geprüft, Übergabe an Steuerberater erledigt",
    priority: "niedrig",
    status: "erledigt",
    category: "Mandant",
    createdAt: "2026-06-12",
  },
];

function loadTasks(): Task[] {
  if (typeof window === "undefined") return DEMO_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEMO_TASKS;
  } catch {
    return DEMO_TASKS;
  }
}

function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export default function AufgabenPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<"alle" | TaskStatus>("alle");
  const [filterPriority, setFilterPriority] = useState<"alle" | Priority>("alle");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("mittel");
  const [newCategory, setNewCategory] = useState("Sonstiges");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDue, setNewDue] = useState("");

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  function updateTasks(next: Task[]) {
    setTasks(next);
    saveTasks(next);
  }

  function toggleStatus(id: string) {
    updateTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "erledigt" ? "offen" : "erledigt" }
          : t
      )
    );
  }

  function deleteTask(id: string) {
    updateTasks(tasks.filter((t) => t.id !== id));
  }

  function addTask() {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      priority: newPriority,
      status: "offen",
      category: newCategory,
      assignee: newAssignee.trim() || undefined,
      dueDate: newDue || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    updateTasks([task, ...tasks]);
    setNewTitle("");
    setNewDesc("");
    setNewPriority("mittel");
    setNewCategory("Sonstiges");
    setNewAssignee("");
    setNewDue("");
    setShowForm(false);
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "alle" && t.status !== filterStatus) return false;
    if (filterPriority !== "alle" && t.priority !== filterPriority) return false;
    return true;
  });

  const offen = tasks.filter((t) => t.status === "offen").length;
  const erledigt = tasks.filter((t) => t.status === "erledigt").length;
  const hochPrio = tasks.filter((t) => t.status === "offen" && t.priority === "hoch").length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Aufgaben</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Aufgaben-System</h1>
          <p className="text-sm text-slate-500">
            {offen} offen · {erledigt} erledigt
            {hochPrio > 0 && (
              <span className="ml-2 text-red-600 font-semibold">· {hochPrio} dringend</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </button>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-brand-800">Neue Aufgabe erstellen</h2>
          <div className="space-y-2">
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="Titel *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              autoFocus
            />
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
              placeholder="Beschreibung (optional)"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
              >
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
              <select
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                placeholder="Zuständig"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
              />
              <input
                type="date"
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className="btn-primary text-sm">
              Erstellen
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 font-semibold">Status:</span>
        {(["alle", "offen", "erledigt"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition",
              filterStatus === s
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="text-xs text-slate-500 font-semibold ml-3">Priorität:</span>
        {(["alle", "hoch", "mittel", "niedrig"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition",
              filterPriority === p
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
            Keine Aufgaben gefunden
          </div>
        ) : (
          filtered
            .sort((a, b) => {
              if (a.status !== b.status) return a.status === "offen" ? -1 : 1;
              const pOrder = { hoch: 0, mittel: 1, niedrig: 2 };
              return pOrder[a.priority] - pOrder[b.priority];
            })
            .map((task) => <TaskCard key={task.id} task={task} onToggle={toggleStatus} onDelete={deleteTask} />)
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const p = PRIORITY_CFG[task.priority];
  const isOverdue =
    task.dueDate && task.status === "offen" && task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3.5 flex gap-3 transition hover:shadow-sm group",
        task.status === "erledigt" ? "opacity-60 border-slate-100" : "border-slate-200",
        isOverdue && "border-red-200 bg-red-50/30"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="shrink-0 mt-0.5"
        title={task.status === "erledigt" ? "Als offen markieren" : "Als erledigt markieren"}
      >
        {task.status === "erledigt" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 hover:text-brand-400" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold text-slate-800",
            task.status === "erledigt" && "line-through text-slate-400"
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Priority */}
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
              p.color,
              p.bg,
              p.border
            )}
          >
            {p.label}
          </span>

          {/* Category */}
          <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            <Tag className="h-2.5 w-2.5" />
            {task.category}
          </span>

          {/* Assignee */}
          {task.assignee && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <User className="h-2.5 w-2.5" />
              {task.assignee}
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue ? "text-red-600 font-semibold" : "text-slate-400"
              )}
            >
              {isOverdue && <AlertTriangle className="h-2.5 w-2.5" />}
              {!isOverdue && <Clock className="h-2.5 w-2.5" />}
              {isOverdue ? "Überfällig: " : "Fällig: "}
              {new Date(task.dueDate).toLocaleDateString("de-AT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition text-slate-300 hover:text-red-400"
        title="Aufgabe löschen"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
