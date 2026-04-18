import { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_MEAL_SLOTS = [
  { meal: "Breakfast", start: 480, end: 600, label: "08:00 AM - 10:00 AM" },
  { meal: "Lunch", start: 720, end: 900, label: "12:00 PM - 03:00 PM" },
  { meal: "Tea", start: 1020, end: 1080, label: "05:00 PM - 06:00 PM" },
  { meal: "Dinner", start: 1200, end: 1320, label: "08:00 PM - 10:00 PM" },
];

const shortCodeByMeal = {
  Breakfast: "B",
  Lunch: "L",
  Tea: "T",
  Dinner: "D",
};

function formatDuration(totalSeconds) {
  if (totalSeconds <= 0) {
    return "00h 00m 00s";
  }

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}h ${minutes}m ${seconds}s`;
}

function formatClock(now) {
  return now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function computeRuntime(now, mealSlots) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...mealSlots].sort((a, b) => Number(a.start) - Number(b.start));

  let activeMeal = null;
  for (const slot of sorted) {
    if (nowMinutes >= Number(slot.start) && nowMinutes < Number(slot.end)) {
      activeMeal = slot;
      break;
    }
  }

  const nextMeal = sorted.find((slot) => nowMinutes < Number(slot.start)) || sorted[0] || null;

  if (!nextMeal) {
    return {
      activeMeal: null,
      nextMeal: null,
      secondsRemaining: 0,
    };
  }

  const target = new Date(now);
  if (activeMeal) {
    target.setHours(Math.floor(Number(activeMeal.end) / 60), Number(activeMeal.end) % 60, 0, 0);
  } else {
    target.setHours(Math.floor(Number(nextMeal.start) / 60), Number(nextMeal.start) % 60, 0, 0);
    if (nowMinutes >= Number(nextMeal.start)) {
      target.setDate(target.getDate() + 1);
    }
  }

  return {
    activeMeal,
    nextMeal,
    secondsRemaining: Math.max(0, Math.floor((target - now) / 1000)),
  };
}

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to fetch data.");
  }
  return response.json();
}

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export default function App() {
  const [now, setNow] = useState(new Date());
  const [mealSlots, setMealSlots] = useState(FALLBACK_MEAL_SLOTS);
  const [students, setStudents] = useState([]);
  const [studentSession, setStudentSession] = useState({ logged_in: false, student_name: "" });
  const [loginName, setLoginName] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [mealCounts, setMealCounts] = useState({});
  const [menuBanner, setMenuBanner] = useState({
    meal: "Lunch",
    items: "Dal, Rice, Sabzi, Salad",
    updated_at: "11:30 AM",
  });
  const [history, setHistory] = useState([]);
  const [impactSavedKg, setImpactSavedKg] = useState(0);
  const [currentMealMarked, setCurrentMealMarked] = useState(false);
  const [currentMealStatus, setCurrentMealStatus] = useState("");
  const [canMarkCurrentMeal, setCanMarkCurrentMeal] = useState(true);
  const [statusChoice, setStatusChoice] = useState("Will Eat");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "success" });
  const videoRef = useRef(null);
  const scanTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const runtime = useMemo(() => computeRuntime(now, mealSlots), [now, mealSlots]);

  const currentMealKey = runtime.activeMeal ? runtime.activeMeal.meal : runtime.nextMeal?.meal || "Lunch";
  const currentMealCount = mealCounts[currentMealKey] || { marked: 0, attending: 0 };
  const isMealCutoffSoon = Boolean(runtime.activeMeal && runtime.secondsRemaining > 0 && runtime.secondsRemaining <= 15 * 60);

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!toast.text) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setToast({ text: "", type: "success" });
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isScannerOpen) {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    async function startQrScan() {
      if (!window.BarcodeDetector) {
        setQrError("Camera QR scanning is not supported in this browser. Paste QR payload below.");
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        mediaStreamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        scanTimerRef.current = window.setInterval(async () => {
          try {
            const codes = await detector.detect(video);
            if (!codes.length) {
              return;
            }
            const rawValue = String(codes[0].rawValue || "").trim();
            if (!rawValue) {
              return;
            }
            setQrPayload(rawValue);
            applyQrPayload(rawValue);
            setIsScannerOpen(false);
          } catch {
            // Ignore intermittent detect errors while stream is stabilizing.
          }
        }, 650);
      } catch {
        setQrError("Unable to start camera scanner. Check camera permission and retry.");
      }
    }

    startQrScan();
  }, [isScannerOpen]);

  function applyQrPayload(raw) {
    const text = String(raw || "").trim();
    if (!text) {
      return;
    }

    let name = "";
    let pin = "";
    try {
      const parsed = JSON.parse(text);
      name = String(parsed.student_name || parsed.name || "").trim();
      pin = String(parsed.pin || parsed.passcode || "").trim();
    } catch {
      const splitter = text.includes("|") ? "|" : text.includes(",") ? "," : "";
      if (splitter) {
        const parts = text.split(splitter).map((part) => String(part).trim());
        name = parts[0] || "";
        pin = parts[1] || "";
      } else {
        name = text;
      }
    }

    if (name) {
      setLoginName(name);
    }
    if (pin) {
      setLoginPin(pin);
    }
    setQrError("");
    setToast({ text: "QR data detected. Verify and login.", type: "success" });
  }

  async function loadBootstrap(studentName = "") {
    const query = studentName ? `?student_name=${encodeURIComponent(studentName)}` : "";
    const payload = await getJSON(`/api/student/bootstrap${query}`);

    const incomingStudents = Array.isArray(payload.students) ? payload.students : [];
    const selected = payload.selected_student || incomingStudents[0] || "";

    setMealSlots(Array.isArray(payload.meal_slots) && payload.meal_slots.length ? payload.meal_slots : FALLBACK_MEAL_SLOTS);
    setMealCounts(payload.meal_counts || {});
    setMenuBanner(payload.menu_banner || menuBanner);
    setStudents(incomingStudents);
    setImpactSavedKg(Number(payload.impact_saved_kg || 0));
    setSelectedStudent(selected);
    setSearchQuery((prev) => (prev ? prev : selected));
    setHistory(Array.isArray(payload.selected_student_history) ? payload.selected_student_history : []);
    setCurrentMealMarked(Boolean(payload.current_meal_marked));
    setCurrentMealStatus(String(payload.current_meal_status || ""));
    setCanMarkCurrentMeal(Boolean(payload.can_mark_current_meal));

    if (payload.is_logged_in) {
      const loggedStudent = String(payload.logged_student || selected || "").trim();
      setStudentSession({ logged_in: true, student_name: loggedStudent });
      setLoginName(loggedStudent);
    }
  }

  async function loadSession() {
    try {
      const payload = await getJSON("/api/student/session");
      const loggedIn = Boolean(payload.logged_in);
      const studentName = String(payload.student_name || "").trim();
      setStudentSession({ logged_in: loggedIn, student_name: studentName });
      setLoginName(studentName);
      if (!loggedIn) {
        setSelectedStudent("");
        setSearchQuery("");
      }
      return payload;
    } catch {
      setStudentSession({ logged_in: false, student_name: "" });
      setLoginName("");
      return { logged_in: false, student_name: "" };
    }
  }

  async function loginStudent(event) {
    event.preventDefault();

    const trimmedName = loginName.trim();
    if (!trimmedName) {
      setToast({ text: "Please enter your student name.", type: "error" });
      return;
    }
    const trimmedPin = loginPin.trim();
    if (!trimmedPin) {
      setToast({ text: "Please enter your PIN.", type: "error" });
      return;
    }

    setIsLoggingIn(true);
    try {
      const payload = await postJSON("/api/student/login", { student_name: trimmedName, pin: trimmedPin });
      const loggedStudent = String(payload.student_name || trimmedName).trim();
      setStudentSession({ logged_in: true, student_name: loggedStudent });
      setSelectedStudent(loggedStudent);
      setSearchQuery(loggedStudent);
      setLoginPin("");
      await loadBootstrap(loggedStudent);
      setToast({ text: "Student login successful.", type: "success" });
    } catch (error) {
      setToast({ text: error.message || "Unable to login.", type: "error" });
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function logoutStudent() {
    try {
      await postJSON("/api/student/logout", {});
    } finally {
      setStudentSession({ logged_in: false, student_name: "" });
      setLoginName("");
      setLoginPin("");
      setSelectedStudent("");
      setSearchQuery("");
      setHistory([]);
      setCurrentMealMarked(false);
      setCurrentMealStatus("");
      setCanMarkCurrentMeal(true);
      setOldPin("");
      setNewPin("");
      setToast({ text: "Logged out.", type: "success" });
    }
  }

  async function onChangePin(event) {
    event.preventDefault();

    const oldTrim = oldPin.trim();
    const newTrim = newPin.trim();
    if (!oldTrim || !newTrim) {
      setToast({ text: "Please provide old and new PIN.", type: "error" });
      return;
    }

    setIsChangingPin(true);
    try {
      const payload = await postJSON("/api/student/pin/change", {
        old_pin: oldTrim,
        new_pin: newTrim,
      });
      setOldPin("");
      setNewPin("");
      setToast({ text: payload.message || "PIN updated.", type: "success" });
    } catch (error) {
      setToast({ text: error.message || "Unable to update PIN.", type: "error" });
    } finally {
      setIsChangingPin(false);
    }
  }

  async function onSubmitFeedback(event) {
    event.preventDefault();

    setIsSubmittingFeedback(true);
    try {
      const payload = await postJSON("/api/student/menu-feedback", {
        meal_slot: currentMealKey,
        rating: Number(feedbackRating),
        comment: feedbackComment,
      });
      setFeedbackComment("");
      setToast({ text: payload.message || "Feedback submitted.", type: "success" });
    } catch (error) {
      setToast({ text: error.message || "Unable to submit feedback.", type: "error" });
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  async function loadHistory(studentName) {
    if (!studentName) {
      setHistory([]);
      return;
    }

    try {
      const payload = await getJSON(`/api/student/history?student_name=${encodeURIComponent(studentName)}`);
      setHistory(Array.isArray(payload.history) ? payload.history : []);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    loadSession().catch(() => {});
    loadBootstrap().catch(() => {
      setToast({ text: "Unable to load latest student dashboard data.", type: "error" });
    });
  }, []);

  useEffect(() => {
    if (!studentSession.logged_in || !selectedStudent) {
      return;
    }

    loadHistory(selectedStudent);
  }, [selectedStudent, studentSession.logged_in]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadBootstrap(studentSession.logged_in ? studentSession.student_name : selectedStudent).catch(() => {
        // Keep UI responsive even if refresh fails.
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [selectedStudent, studentSession]);

  async function onSubmitAttendance(event) {
    event.preventDefault();

    if (!runtime.activeMeal) {
      setToast({ text: `Mess is closed. Next meal is ${runtime.nextMeal?.meal || "upcoming"}.`, type: "error" });
      return;
    }

    if (!studentSession.logged_in) {
      setToast({ text: "Please login first.", type: "error" });
      return;
    }

    if (currentMealMarked || !canMarkCurrentMeal) {
      setToast({ text: `You already marked ${runtime.activeMeal.meal} today.`, type: "error" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/mark_attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_slot: runtime.activeMeal.meal,
          status: statusChoice === "Will Eat" ? "Will Eat" : "Skip",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit attendance.");
      }

      await loadBootstrap(studentSession.student_name);
      setToast({ text: `Attendance marked for ${runtime.activeMeal.meal}.`, type: "success" });
    } catch (error) {
      setToast({ text: error.message || "Submission failed. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!studentSession.logged_in) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-100 font-sora text-slate-900">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(39,167,117,0.20),transparent_38%),radial-gradient(circle_at_90%_20%,rgba(148,230,190,0.35),transparent_30%)]" />

        <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-4 py-8 sm:px-6 lg:px-8">
          <section className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                HM
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Student Login</p>
                <h1 className="text-2xl font-extrabold text-slate-900">Hostel Mess Attendance</h1>
                <p className="mt-1 text-sm text-slate-600">Login once to mark your meal preference only one time per meal.</p>
              </div>
            </div>

            <form onSubmit={loginStudent} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Student Name</span>
                <input
                  type="text"
                  list="students-list"
                  value={loginName}
                  onChange={(event) => setLoginName(event.target.value)}
                  placeholder="Start typing your name"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                />
                <datalist id="students-list">
                  {students.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={loginPin}
                  onChange={(event) => setLoginPin(event.target.value)}
                  placeholder="Enter your PIN"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">QR Login Assist</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQrError("");
                      setIsScannerOpen((prev) => !prev);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {isScannerOpen ? "Stop Scanner" : "Scan QR"}
                  </button>
                </div>

                {isScannerOpen && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-300 bg-black">
                    <video ref={videoRef} className="h-48 w-full object-cover" muted playsInline />
                  </div>
                )}

                <label className="mt-2 block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">QR Payload (student|pin or JSON)</span>
                  <input
                    type="text"
                    value={qrPayload}
                    onChange={(event) => setQrPayload(event.target.value)}
                    placeholder="Aarav Sharma|1234"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => applyQrPayload(qrPayload)}
                  className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Apply QR Data
                </button>
                {qrError && <p className="mt-2 text-xs font-semibold text-rose-600">{qrError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn ? "Logging in..." : "Login to Continue"}
              </button>
            </form>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Once logged in, your attendance will be tied to your account and duplicate submissions for the same meal will be blocked.
              <p className="mt-2 font-semibold text-slate-700">Default PIN: 1234</p>
            </div>
          </section>
        </main>

        {toast.text && (
          <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 animate-slideUp">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${
                toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-700 text-white"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.text}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-100 font-sora text-slate-900">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(39,167,117,0.20),transparent_38%),radial-gradient(circle_at_90%_20%,rgba(148,230,190,0.35),transparent_30%)]" />

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-3xl border border-emerald-200/80 bg-white/85 p-4 shadow-card backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-lg shadow-emerald-200">
                HM
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Hostel Mess Smart Check-in</p>
                <h1 className="text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">Hostel Mess Attendance</h1>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <a
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Admin Login
            </a>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                {studentSession.student_name}
              </span>
              <button
                type="button"
                onClick={logoutStudent}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mb-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-5 text-white shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Eat Smart. Waste Less.</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Quick attendance, greener kitchen, better hostel meals.</h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
            Mark your meal plan in a few taps and help the mess team prepare just the right amount of food.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/45 bg-white/15 px-3 py-1 text-xs font-semibold">Fast Check-in</span>
            <span className="rounded-full border border-emerald-300/45 bg-white/15 px-3 py-1 text-xs font-semibold">Lower Waste</span>
            <span className="rounded-full border border-emerald-300/45 bg-white/15 px-3 py-1 text-xs font-semibold">Better Forecast</span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/25 bg-white/10 p-3 text-sm">
              <p className="font-bold">Attendance First</p>
              <p className="mt-1 text-emerald-50/95">Daily responses improve food planning accuracy.</p>
            </article>
            <article className="rounded-2xl border border-white/25 bg-white/10 p-3 text-sm">
              <p className="font-bold">Time-Based Meals</p>
              <p className="mt-1 text-emerald-50/95">Attendance is open only during active meal windows.</p>
            </article>
            <article className="rounded-2xl border border-white/25 bg-white/10 p-3 text-sm">
              <p className="font-bold">Balanced Preparation</p>
              <p className="mt-1 text-emerald-50/95">Supports enough food while avoiding over-cooking.</p>
            </article>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Meal Of The Day</p>
          <p className="mt-2 text-lg font-extrabold text-slate-900 sm:text-xl">
            Today&apos;s {menuBanner.meal}: {menuBanner.items}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Updated by admin at {menuBanner.updated_at}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-emerald-700">Mark Attendance</p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  {runtime.activeMeal ? `${runtime.activeMeal.meal} window is open` : "Mess window closed"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {runtime.activeMeal
                    ? `Closes in ${formatDuration(runtime.secondsRemaining)}`
                    : `Next opens: ${runtime.nextMeal?.meal || "Upcoming"} in ${formatDuration(runtime.secondsRemaining)}`}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">Current Time</p>
                <p className="text-base font-extrabold text-emerald-900">{formatClock(now)}</p>
              </div>
            </div>

            {!runtime.activeMeal && (
              <div className="mb-4 animate-pulseSoft rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Mess Closed</p>
                <p className="text-sm text-amber-700">
                  Attendance opens at {runtime.nextMeal?.label || "next meal slot"}.
                </p>
              </div>
            )}

            {isMealCutoffSoon && runtime.activeMeal && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-bold text-rose-800">Meal cutoff reminder</p>
                <p className="text-sm text-rose-700">
                  {runtime.activeMeal.meal} closes in {formatDuration(runtime.secondsRemaining)}. Mark now.
                </p>
              </div>
            )}

            <form onSubmit={onSubmitAttendance} className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Logged In As</p>
                <p className="mt-1 text-base font-extrabold text-slate-900">{studentSession.student_name}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">Meal Decision</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusChoice("Will Eat")}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition active:scale-95 ${
                      statusChoice === "Will Eat"
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                    }`}
                  >
                    Will Eat
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusChoice("Won't Eat")}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition active:scale-95 ${
                      statusChoice === "Won't Eat"
                        ? "border-slate-700 bg-slate-800 text-white shadow-lg shadow-slate-200"
                        : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Won&apos;t Eat
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!runtime.activeMeal || isSubmitting || !canMarkCurrentMeal || currentMealMarked}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting ? "Submitting..." : "Submit Attendance"}
              </button>
            </form>

            {currentMealMarked && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-800">Already marked for this meal</p>
                <p className="text-sm text-amber-700">Recorded preference: {currentMealStatus || "Submitted"}</p>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Today&apos;s Summary</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {currentMealCount.marked} students have marked for {currentMealKey} so far.
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-emerald-700">Today&apos;s Meal Timings</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900">Timeline</h3>
            </div>

            <div className="relative space-y-3">
              <div className="absolute left-4 top-2 h-[94%] w-0.5 bg-emerald-100" />
              {mealSlots.map((meal) => {
                const mealKey = meal.meal;
                const isActive = runtime.activeMeal && runtime.activeMeal.meal === mealKey;
                const count = mealCounts[mealKey] || { marked: 0, attending: 0 };

                return (
                  <div
                    key={mealKey}
                    className={`relative flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition ${
                      isActive ? "border-emerald-500 bg-emerald-50 shadow-glow" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold ${
                          isActive ? "bg-emerald-600 text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {shortCodeByMeal[mealKey] || mealKey.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{mealKey}</p>
                        <p className="text-xs font-medium text-slate-500">{meal.label}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          isActive
                            ? "bg-emerald-700 text-white"
                            : "border border-slate-300 bg-white text-slate-600"
                        }`}
                      >
                        {count.attending} students attending
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">My Attendance History</p>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">
            7-day streak for {selectedStudent || "Student"}
          </h3>

          <div className="mt-3 grid gap-2 sm:grid-cols-7">
            {history.map((row) => (
              <div key={`${row.date}-${row.day}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-700">{row.day}</p>
                <div className="mt-2 flex gap-1.5">
                  {["B", "L", "T", "D"].map((slot) => (
                    <span
                      key={`${row.date}-${slot}`}
                      className={`h-3 w-3 rounded-full ${row.slots?.[slot] ? "bg-emerald-500" : "bg-slate-300"}`}
                      title={`${row.day} ${slot}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Security</p>
            <h3 className="mt-1 text-lg font-extrabold text-slate-900">Change PIN</h3>
            <form onSubmit={onChangePin} className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Old PIN</span>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(event) => setOldPin(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">New PIN</span>
                <input
                  type="password"
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isChangingPin}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isChangingPin ? "Updating..." : "Update PIN"}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-card sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Meal Feedback</p>
            <h3 className="mt-1 text-lg font-extrabold text-slate-900">Rate {currentMealKey}</h3>
            <form onSubmit={onSubmitFeedback} className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Rating</span>
                <select
                  value={feedbackRating}
                  onChange={(event) => setFeedbackRating(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                >
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score} Star{score > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Comment (optional)</span>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(event) => setFeedbackComment(event.target.value)}
                  placeholder="What should improve?"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </article>
        </section>

        <section className="mt-4 rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-700 to-emerald-500 p-4 text-white shadow-card sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Food Waste Impact</p>
          <p className="mt-2 text-xl font-extrabold">Your check-ins saved ~{impactSavedKg.toFixed(1)} kg of food this month.</p>
          <p className="mt-1 text-sm text-emerald-50">Every timely response improves tomorrow&apos;s preparation.</p>
        </section>
      </main>

      {toast.text && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 animate-slideUp">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-bold shadow-lg ${
              toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-700 text-white"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
