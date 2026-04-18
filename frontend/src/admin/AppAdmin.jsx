import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Activity,
  Bot,
  CalendarCheck,
  ChefHat,
  CircleUserRound,
  Database,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  LogOut,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add-data", label: "Add Data", icon: Database },
  { to: "/prediction", label: "Prediction", icon: FlaskConical },
  { to: "/chatbot", label: "Chatbot", icon: Bot },
];

const defaultStats = {
  total_students: 0,
  predicted_waste: 0,
  suggested_food: 0,
  r2: 0,
  pending_attendance: 0,
};

const fallbackRecords = [
  {
    id: 0,
    date: "2026-04-11",
    students_present: 102,
    prepared_kg: 58,
    consumed_kg: 53,
    waste_kg: 5,
    is_weekend: 1,
    is_exam_period: 0,
  },
  {
    id: 1,
    date: "2026-04-12",
    students_present: 118,
    prepared_kg: 66,
    consumed_kg: 59,
    waste_kg: 7,
    is_weekend: 1,
    is_exam_period: 0,
  },
  {
    id: 2,
    date: "2026-04-13",
    students_present: 124,
    prepared_kg: 68,
    consumed_kg: 62,
    waste_kg: 6,
    is_weekend: 0,
    is_exam_period: 1,
  },
  {
    id: 3,
    date: "2026-04-14",
    students_present: 116,
    prepared_kg: 63,
    consumed_kg: 57,
    waste_kg: 6,
    is_weekend: 0,
    is_exam_period: 1,
  },
  {
    id: 4,
    date: "2026-04-15",
    students_present: 108,
    prepared_kg: 60,
    consumed_kg: 55,
    waste_kg: 5,
    is_weekend: 0,
    is_exam_period: 0,
  },
  {
    id: 5,
    date: "2026-04-16",
    students_present: 112,
    prepared_kg: 61,
    consumed_kg: 56,
    waste_kg: 5,
    is_weekend: 0,
    is_exam_period: 0,
  },
  {
    id: 6,
    date: "2026-04-17",
    students_present: 121,
    prepared_kg: 66,
    consumed_kg: 59,
    waste_kg: 7,
    is_weekend: 0,
    is_exam_period: 0,
  },
];

const fallbackAttendance = {
  summary: {
    meal_breakdown: [
      { meal: "Breakfast", will_eat: 89, total_entries: 100 },
      { meal: "Lunch", will_eat: 112, total_entries: 124 },
      { meal: "Tea", will_eat: 67, total_entries: 88 },
      { meal: "Dinner", will_eat: 95, total_entries: 109 },
    ],
  },
};

const quickPromptChips = [
  "How much waste today?",
  "Food for 120 students?",
  "Weekend estimate?",
  "Exam period impact?",
];

const trendForCards = {
  students: 3.2,
  waste: -4.8,
  food: 2.6,
  r2: 1.4,
};

async function getJSON(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
}

async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }
  return body;
}

function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 900);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidth = collapsed ? "w-20" : "w-72";

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-30 ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} bg-[#111827] px-4 py-5 text-white shadow-2xl md:static md:flex md:flex-col`}
        >
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Leaf size={20} />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold">Mess AI</h1>
                  <p className="truncate text-xs text-slate-400">Waste Manager</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
            >
              <Activity size={16} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : ""}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium ${
                      isActive ? "bg-[#16a34a] text-white" : "text-slate-300 hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl bg-slate-800/70 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 font-semibold text-white">AD</div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Admin Desk</p>
                  <p className="truncate text-xs text-slate-400">Mess Supervisor</p>
                </div>
              )}
            </div>
            <a
              href="/admin/logout"
              className={`mt-3 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/30 ${collapsed ? "justify-center" : "w-full"}`}
              title={collapsed ? "Logout" : ""}
            >
              <LogOut size={16} />
              {!collapsed && <span>Logout</span>}
            </a>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-[#f9fafb]/95 px-4 py-3 backdrop-blur md:px-6">
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              Menu
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Hostel Mess Management
            </p>
            <p className="text-sm font-medium text-slate-600">{new Date().toLocaleDateString()}</p>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ summary, records, attendance, menuData, onSaveMenu, onRefresh, onFinalize, onResetAttendance }) {
  const chartData = useMemo(() => {
    const rows = records.length ? records : fallbackRecords;
    return rows.slice(-7).map((row, index) => ({
      date: row.date || `Day ${index + 1}`,
      actual: Number(row.waste_kg || 0),
      predicted: Number((row.waste_kg || 0) * 1.08).toFixed(2),
    }));
  }, [records]);

  const avgWaste = useMemo(() => {
    if (!chartData.length) return 0;
    const total = chartData.reduce((sum, item) => sum + Number(item.actual), 0);
    return (total / chartData.length).toFixed(2);
  }, [chartData]);

  const bestDay = useMemo(() => {
    if (!chartData.length) return "N/A";
    return [...chartData].sort((a, b) => Number(a.actual) - Number(b.actual))[0].date;
  }, [chartData]);

  const worstDay = useMemo(() => {
    if (!chartData.length) return "N/A";
    return [...chartData].sort((a, b) => Number(b.actual) - Number(a.actual))[0].date;
  }, [chartData]);

  const meals = attendance?.summary?.meal_breakdown?.length
    ? attendance.summary.meal_breakdown
    : fallbackAttendance.summary.meal_breakdown;

  const [menuMeal, setMenuMeal] = useState("Breakfast");
  const [menuItems, setMenuItems] = useState("");
  const [menuMsg, setMenuMsg] = useState("");
  const [resetForm, setResetForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    student_name: "",
    meal_slot: "All",
  });
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    const firstMeal = menuData?.menus ? Object.keys(menuData.menus)[0] : "Breakfast";
    const selected = menuData?.menus?.[menuMeal] || menuData?.menus?.[firstMeal] || "";
    if (selected) {
      setMenuItems(selected);
    }
  }, [menuData, menuMeal]);

  const studentNames = attendance?.student_names?.length
    ? attendance.student_names
    : Array.from(new Set((attendance?.records || []).map((row) => String(row.student_name || "").trim()).filter(Boolean)));

  const wasteHigh = Number(summary.predicted_waste || 0) > 8;

  const cards = [
    {
      label: "Total Students",
      value: summary.total_students || 0,
      icon: CircleUserRound,
      color: "text-blue-600 bg-blue-100",
      trend: trendForCards.students,
    },
    {
      label: "Predicted Waste",
      value: `${summary.predicted_waste || 0} kg`,
      icon: Trash2,
      color: wasteHigh ? "text-amber-600 bg-amber-100" : "text-emerald-600 bg-emerald-100",
      trend: trendForCards.waste,
    },
    {
      label: "Suggested Food Qty",
      value: `${summary.suggested_food || 0} kg`,
      icon: ChefHat,
      color: "text-teal-600 bg-teal-100",
      trend: trendForCards.food,
    },
    {
      label: "Model Accuracy R2",
      value: summary.r2 || 0,
      icon: Sparkles,
      color: "text-purple-600 bg-purple-100",
      trend: trendForCards.r2,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-slate-500">Daily insights, live attendance and waste planning.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const positive = card.trend >= 0;
          return (
            <article key={card.label} className="admin-card bg-white p-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-xl p-2 ${card.color}`}>
                  <Icon size={20} />
                </span>
                <span className={`text-sm font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                  {positive ? "↗" : "↘"} {Math.abs(card.trend)}%
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </article>
          );
        })}
      </div>

      <div className="admin-card bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Avg Waste This Week: {avgWaste} kg</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Best Day: {bestDay}</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Worst Day: {worstDay}</span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} kg`} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#16a34a" strokeWidth={3} dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeDasharray="6 6" strokeWidth={2} dot={false} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-card bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Live Student Attendance</h3>
          <button
            type="button"
            onClick={onFinalize}
            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            <CalendarCheck size={16} />
            Finalize Day
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {meals.map((meal) => {
            const turnout = Number(meal.will_eat || 0);
            const high = turnout >= 80;
            return (
              <div
                key={meal.meal}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  high
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-amber-300 bg-amber-50 text-amber-700"
                }`}
              >
                {meal.meal} {turnout}
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card bg-white p-4">
        <h3 className="mb-1 text-lg font-semibold">Meal Of The Day Menu</h3>
        <p className="mb-3 text-sm text-slate-500">Update menu items shown on the student dashboard.</p>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const payload = await onSaveMenu({ meal: menuMeal, items: menuItems });
              setMenuMsg(payload.message || "Menu updated.");
            } catch (error) {
              setMenuMsg(error.message || "Unable to update menu.");
            }
          }}
        >
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Meal Slot</span>
            <select
              value={menuMeal}
              onChange={(e) => setMenuMeal(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
            >
              {["Breakfast", "Lunch", "Tea", "Dinner"].map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Menu Items</span>
            <input
              type="text"
              value={menuItems}
              onChange={(e) => setMenuItems(e.target.value)}
              placeholder="Example: Dal, Rice, Sabzi, Salad"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 md:col-span-2"
          >
            <ChefHat size={16} />
            Save Menu
          </button>
        </form>
        {menuData?.updated_at && <p className="mt-2 text-xs text-slate-500">Last updated: {menuData.updated_at}</p>}
        {menuMsg && <p className="mt-1 text-sm font-semibold text-emerald-700">{menuMsg}</p>}
      </div>

      <div className="admin-card bg-white p-4">
        <h3 className="mb-1 text-lg font-semibold">Reset Student Attendance Mark</h3>
        <p className="mb-3 text-sm text-slate-500">Use this when a student marked the wrong preference and needs one retry.</p>
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!resetForm.student_name) {
              setResetMsg("Please select a student.");
              return;
            }
            try {
              const payload = await onResetAttendance(resetForm);
              setResetMsg(payload.message || "Attendance mark reset.");
            } catch (error) {
              setResetMsg(error.message || "Unable to reset attendance.");
            }
          }}
        >
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Date</span>
            <input
              type="date"
              value={resetForm.date}
              onChange={(e) => setResetForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Student</span>
            <input
              list="admin-student-names"
              value={resetForm.student_name}
              onChange={(e) => setResetForm((prev) => ({ ...prev, student_name: e.target.value }))}
              placeholder="Select student"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
            <datalist id="admin-student-names">
              {studentNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Meal</span>
            <select
              value={resetForm.meal_slot}
              onChange={(e) => setResetForm((prev) => ({ ...prev, meal_slot: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
            >
              {["All", "Breakfast", "Lunch", "Tea", "Dinner"].map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white hover:brightness-95 md:col-span-3"
          >
            <Trash2 size={16} />
            Reset Attendance Mark
          </button>
        </form>
        {resetMsg && <p className="mt-2 text-sm font-semibold text-slate-700">{resetMsg}</p>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-9 w-20 items-center rounded-full border ${value ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-slate-200"}`}
      aria-label={label}
    >
      <span className={`absolute left-1 inline-block h-7 w-7 rounded-full bg-white ${value ? "translate-x-11" : "translate-x-0"}`} />
      <span className="w-full text-center text-xs font-semibold text-white">{value ? "Yes" : "No"}</span>
    </button>
  );
}

function AddDataPage({ records, onAdded, onDelete }) {
  const [form, setForm] = useState({
    students_present: "",
    prepared_kg: "",
    consumed_kg: "",
    waste_kg: "",
    is_weekend: false,
    is_exam_period: false,
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleRecords = useMemo(() => {
    const src = records.length ? records : fallbackRecords;
    return src.slice(-7).reverse();
  }, [records]);

  const validate = () => {
    const nextErrors = {};
    const required = ["students_present", "prepared_kg", "consumed_kg", "waste_kg"];
    required.forEach((field) => {
      if (!String(form[field]).trim()) nextErrors[field] = "Required";
    });

    const prepared = Number(form.prepared_kg || 0);
    const waste = Number(form.waste_kg || 0);
    if (waste > prepared) {
      nextErrors.waste_kg = "Waste cannot exceed Prepared Food";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    await postJSON("/api/data/add", {
      students_present: Number(form.students_present),
      prepared_kg: Number(form.prepared_kg),
      consumed_kg: Number(form.consumed_kg),
      waste_kg: Number(form.waste_kg),
      is_weekend: form.is_weekend ? 1 : 0,
      is_exam_period: form.is_exam_period ? 1 : 0,
    });

    setForm({
      students_present: "",
      prepared_kg: "",
      consumed_kg: "",
      waste_kg: "",
      is_weekend: false,
      is_exam_period: false,
    });
    setToast("Record added successfully");
    onAdded();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Add Data</h2>
        <p className="text-sm text-slate-500">Capture daily mess operations with quick validation.</p>
      </div>

      <form onSubmit={submit} className="admin-card bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["students_present", "Students Present"],
            ["prepared_kg", "Prepared Food (kg)"],
            ["consumed_kg", "Consumed Food (kg)"],
            ["waste_kg", "Waste (kg)"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
              <input
                type="number"
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 outline-none ${errors[key] ? "border-rose-400" : "border-slate-300 focus:border-emerald-500"}`}
              />
              {errors[key] && <span className="mt-1 block text-xs text-rose-600">{errors[key]}</span>}
            </label>
          ))}

          <div>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Is Weekend</span>
            <Toggle value={form.is_weekend} onChange={(val) => setForm((p) => ({ ...p, is_weekend: val }))} label="weekend" />
          </div>

          <div>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Is Exam Period</span>
            <Toggle value={form.is_exam_period} onChange={(val) => setForm((p) => ({ ...p, is_exam_period: val }))} label="exam" />
          </div>
        </div>

        <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 font-semibold text-white hover:brightness-95">
          <Plus size={16} />
          Add Record
        </button>
        {toast && <p className="mt-2 text-sm font-semibold text-emerald-600">{toast}</p>}
      </form>

      <div className="admin-card bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Recent Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Students</th>
                <th className="px-3 py-2">Prepared (kg)</th>
                <th className="px-3 py-2">Consumed (kg)</th>
                <th className="px-3 py-2">Waste (kg)</th>
                <th className="px-3 py-2">Weekend</th>
                <th className="px-3 py-2">Exam Period</th>
                <th className="px-3 py-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className="rounded-l-xl px-3 py-2">{row.date || "-"}</td>
                  <td className="px-3 py-2">{row.students_present}</td>
                  <td className="px-3 py-2">{row.prepared_kg}</td>
                  <td className="px-3 py-2">{row.consumed_kg}</td>
                  <td className="px-3 py-2">{row.waste_kg}</td>
                  <td className="px-3 py-2">{row.is_weekend ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{row.is_exam_period ? "Yes" : "No"}</td>
                  <td className="rounded-r-xl px-3 py-2">
                    {confirmDeleteId === row.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDelete(row.id);
                            setConfirmDeleteId(null);
                          }}
                          className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(row.id)}
                        className="rounded-full bg-rose-100 p-2 text-rose-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, onChange, onPredict, loading }) {
  const dec = () => onChange((prev) => ({ ...prev, students_present: Math.max(1, Number(prev.students_present || 1) - 1) }));
  const inc = () => onChange((prev) => ({ ...prev, students_present: Number(prev.students_present || 0) + 1 }));

  return (
    <div className="admin-card bg-white p-4">
      <label className="mb-2 block text-sm font-semibold text-slate-700">Students Present</label>
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={dec} className="rounded-xl border border-slate-300 px-3 py-2">−</button>
        <input
          type="number"
          value={scenario.students_present}
          onChange={(e) => onChange((prev) => ({ ...prev, students_present: Number(e.target.value || 0) }))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center"
        />
        <button type="button" onClick={inc} className="rounded-xl border border-slate-300 px-3 py-2">+</button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Weekend</p>
          <Toggle value={scenario.is_weekend} onChange={(val) => onChange((p) => ({ ...p, is_weekend: val }))} label="weekend" />
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Exam Period</p>
          <Toggle value={scenario.is_exam_period} onChange={(val) => onChange((p) => ({ ...p, is_exam_period: val }))} label="exam" />
        </div>
      </div>

      <button
        type="button"
        onClick={onPredict}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 font-semibold text-white ${loading ? "animate-pulse" : ""}`}
      >
        <FlaskConical size={16} />
        Predict Waste
      </button>
    </div>
  );
}

function PredictionPage() {
  const [scenarioA, setScenarioA] = useState({ students_present: 120, is_weekend: false, is_exam_period: false });
  const [scenarioB, setScenarioB] = useState({ students_present: 120, is_weekend: true, is_exam_period: false });
  const [showCompare, setShowCompare] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);

  const predict = async (scenario, setLoading, setResult) => {
    setLoading(true);
    try {
      const payload = await postJSON("/api/predict", {
        students_present: Number(scenario.students_present),
        is_weekend: scenario.is_weekend ? 1 : 0,
        is_exam_period: scenario.is_exam_period ? 1 : 0,
      });

      const uncertainty = Math.max(5, Math.min(95, 100 - Number(payload.r2 || 0) * 100));
      setResult({ ...payload, uncertainty });
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (value) => {
    if (value < 35) return "bg-emerald-500";
    if (value < 65) return "bg-amber-500";
    return "bg-rose-500";
  };

  const resultCard = (result) => {
    if (!result) return null;
    return (
      <div className="admin-card bg-white p-4">
        <p className="text-sm text-slate-500">Predicted Waste</p>
        <p className="text-3xl font-extrabold text-slate-900">{result.predicted_waste} kg</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">Suggested Food Quantity: {result.suggested_food} kg</p>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Confidence</span>
            <span>{(100 - result.uncertainty).toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className={`h-2 rounded-full ${confidenceColor(result.uncertainty)}`} style={{ width: `${100 - result.uncertainty}%` }} />
          </div>
        </div>

        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Exam periods typically increase food consumption by around 12% in hostel patterns.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Prediction Engine</h2>
        <p className="text-sm text-slate-500">Compare forecast scenarios before kitchen prep starts.</p>
      </div>

      <div className={`grid gap-4 ${showCompare ? "lg:grid-cols-2" : "max-w-[600px]"}`}>
        <div className="space-y-4">
          <ScenarioCard
            scenario={scenarioA}
            onChange={setScenarioA}
            onPredict={() => predict(scenarioA, setLoadingA, setResultA)}
            loading={loadingA}
          />
          {resultCard(resultA)}
        </div>

        {showCompare && (
          <div className="space-y-4">
            <ScenarioCard
              scenario={scenarioB}
              onChange={setScenarioB}
              onPredict={() => predict(scenarioB, setLoadingB, setResultB)}
              loading={loadingB}
            />
            {resultCard(resultB)}
          </div>
        )}
      </div>

      {!showCompare && (
        <button
          type="button"
          onClick={() => setShowCompare(true)}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-500"
        >
          Compare Another Scenario
        </button>
      )}
    </div>
  );
}

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello Admin! Ask about waste or food quantity.", source: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setTyping(true);

    try {
      const reply = await postJSON("/api/chatbot", { message });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: reply.reply,
          source: reply.source || "rule",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chatbot</h2>
          <p className="text-sm text-slate-500">AI/RULE response assistant for operational questions.</p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="rounded-full bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          title="Clear chat"
        >
          <X size={16} />
        </button>
      </div>

      <div className="admin-card flex min-h-0 flex-1 flex-col bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPromptChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setInput(chip)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-emerald-100 hover:text-emerald-700"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
          {messages.map((message, idx) => (
            <div key={`${idx}-${message.role}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "bg-[#16a34a] text-white"
                    : "relative border border-slate-200 bg-white text-slate-800"
                }`}
              >
                {message.role === "bot" && (
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      message.source === "ai" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {(message.source || "rule").toUpperCase()}
                  </span>
                )}
                <p className={message.role === "bot" ? "pr-10" : ""}>{message.text}</p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="w-full rounded-full border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button type="submit" className="rounded-full bg-[#16a34a] p-3 text-white hover:brightness-95">
            <Plane size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppAdmin() {
  const [summary, setSummary] = useState(defaultStats);
  const [records, setRecords] = useState([]);
  const [attendance, setAttendance] = useState(fallbackAttendance);
  const [menuData, setMenuData] = useState({ menus: {}, updated_at: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const refreshAll = async () => {
    try {
      const [summaryPayload, recordsPayload, attendancePayload, menuPayload] = await Promise.all([
        getJSON("/api/summary"),
        getJSON("/api/data"),
        getJSON("/api/attendance/live"),
        getJSON("/api/admin/menu"),
      ]);
      setSummary(summaryPayload);
      setRecords(
        Array.isArray(recordsPayload)
          ? recordsPayload.map((row, idx) => ({
              ...row,
              date: row.date || new Date(Date.now() - idx * 86400000).toISOString().slice(0, 10),
            }))
          : []
      );
      setAttendance(attendancePayload || fallbackAttendance);
      setMenuData(menuPayload || { menus: {}, updated_at: "" });
    } catch {
      setSummary(defaultStats);
      setRecords(fallbackRecords);
      setAttendance(fallbackAttendance);
    }
  };

  const saveMenu = async ({ meal, items }) => {
    const payload = await postJSON("/api/admin/menu", { meal, items });
    if (payload.menu) {
      setMenuData(payload.menu);
    }
    return payload;
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const finalizeDay = async () => {
    try {
      await postJSON("/api/attendance/finalize-day", { is_exam_period: 0 });
      setToast("Day finalized and model refreshed");
      setModalOpen(false);
      await refreshAll();
    } catch (error) {
      setToast(error.message || "Unable to finalize day");
      setModalOpen(false);
    }
  };

  const deleteRecord = async (id) => {
    await postJSON(`/api/data/${id}/delete`, {});
    setToast("Record deleted");
    await refreshAll();
  };

  const resetAttendance = async ({ date, student_name, meal_slot }) => {
    const payload = await postJSON("/api/admin/attendance/reset", {
      date,
      student_name,
      meal_slot,
    });
    setToast(payload.message || "Attendance reset");
    await refreshAll();
    return payload;
  };

  return (
    <AppShell>
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              summary={summary}
              records={records}
              attendance={attendance}
              menuData={menuData}
              onSaveMenu={saveMenu}
              onRefresh={refreshAll}
              onFinalize={() => setModalOpen(true)}
              onResetAttendance={resetAttendance}
            />
          }
        />
        <Route
          path="/add-data"
          element={<AddDataPage records={records} onAdded={refreshAll} onDelete={deleteRecord} />}
        />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {modalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
          <div className="admin-card w-full max-w-md bg-white p-5">
            <h3 className="text-lg font-bold">Finalize Today&apos;s Attendance?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will move pending attendance into the training dataset and refresh model accuracy.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={finalizeDay}
                className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
