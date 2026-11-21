import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Github,
  LogOut,
  Presentation,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import Background from "@/components/Background";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import {
  addLeader,
  adminLogin,
  deleteLeader,
  getAdminToken,
  getOverview,
  setAdminToken,
} from "@/services/adminService";

const inputClass =
  "h-11 w-full rounded-lg border border-white/25 bg-white/10 px-3 text-base text-white placeholder:text-white/40 outline-none transition focus:border-white/60 focus:ring-2 focus:ring-white/20";

const EMPTY_LEADER = { email: "", leaderName: "", teamName: "", leaderPhone: "", college: "" };

/* ------------------------------------------------------------------------- */
/* CSV export                                                                 */
/* ------------------------------------------------------------------------- */

// Quote every cell; prefix formula-like values so Excel/Sheets don't run them.
const csvCell = (value) => {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------------- */
/* Small UI pieces                                                            */
/* ------------------------------------------------------------------------- */

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-xl border border-white/15 bg-neutral-950/80 p-4 sm:p-5 backdrop-blur">
    <div className="flex items-center gap-3">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tone)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-white leading-none">{value}</p>
        <p className="mt-1 text-sm text-white/60">{label}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ submitted }) =>
  submitted ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Submitted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Pending
    </span>
  );

const LinkButton = ({ href, icon: Icon, label }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/15"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
      <ExternalLink className="h-3.5 w-3.5 text-white/50" aria-hidden="true" />
    </a>
  ) : null;

/* ------------------------------------------------------------------------- */
/* Password screen                                                            */
/* ------------------------------------------------------------------------- */

const AdminLogin = ({ onLoggedIn }) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const { token } = await adminLogin(password);
      setAdminToken(token);
      onLoggedIn();
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-white/60">SatHack submissions dashboard</p>
        </div>

        <label htmlFor="admin-password" className="mt-8 block text-sm font-medium text-white">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="admin-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(inputClass, "pr-11")}
            autoComplete="current-password"
            autoFocus
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/60 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 h-11 w-full rounded-lg bg-white text-base font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------------- */
/* Add-leader form                                                            */
/* ------------------------------------------------------------------------- */

const AddLeaderForm = ({ onAdded, onUnauthorized }) => {
  const [form, setForm] = useState(EMPTY_LEADER);
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await addLeader(form);
      toast.success(res.message);
      setForm(EMPTY_LEADER);
      onAdded();
    } catch (err) {
      if (err.response?.status === 401) return onUnauthorized();
      toast.error(getErrorMessage(err, "Could not add the team leader"));
    } finally {
      setBusy(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="space-y-1.5">
      <label htmlFor={`add-${name}`} className="block text-sm font-medium text-white">
        {label}
        {props.required && <span className="text-red-400"> *</span>}
      </label>
      <input id={`add-${name}`} name={name} value={form[name]} onChange={change} className={inputClass} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/15 bg-neutral-950/80 p-5 sm:p-6 backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">Add team leader</h2>
          <p className="text-sm text-white/60">
            For leaders missing from the list. Once added, they can sign in with Google right away and
            their form is pre-filled. Adding an email that already exists updates its details.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("email", "Leader's Google email", { type: "email", required: true, placeholder: "name@thapar.edu", autoComplete: "off" })}
        {field("leaderName", "Leader name", { required: true, maxLength: 100, placeholder: "Full name" })}
        {field("teamName", "Team name", { required: true, maxLength: 100, placeholder: "Team name" })}
        {field("leaderPhone", "Leader phone", { type: "tel", maxLength: 20, placeholder: "Optional" })}
        <div className="md:col-span-2">
          {field("college", "College", { maxLength: 150, placeholder: "Optional" })}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 h-11 w-full sm:w-auto sm:px-8 rounded-lg bg-white text-base font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Saving..." : "Add & allow login"}
      </button>
    </form>
  );
};

/* ------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* ------------------------------------------------------------------------- */

const Dashboard = ({ onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("submissions");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleUnauthorized = useCallback(() => {
    setAdminToken(null);
    toast.error("Admin session expired. Please log in again.");
    onLogout();
  }, [onLogout]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getOverview());
    } catch (err) {
      if (err.response?.status === 401) return handleUnauthorized();
      toast.error(getErrorMessage(err, "Could not load the dashboard"));
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const matches = (...values) => !q || values.some((v) => String(v ?? "").toLowerCase().includes(q));

  // Newest submissions first.
  const submissions = (data?.submissions ?? [])
    .filter((s) => matches(s.teamName, s.leaderName, s.leaderEmail, s.leaderPhone))
    .sort((a, b) => String(b.submissionTime).localeCompare(String(a.submissionTime)));

  const leaders = (data?.leaders ?? []).filter(
    (l) =>
      (statusFilter === "all" || (statusFilter === "submitted") === l.submitted) &&
      matches(l.email, l.leaderName, l.teamName, l.leaderPhone, l.college, l.teamMembers)
  );

  const removeLeader = async (leader) => {
    const note = leader.submitted ? "\n\nTheir existing submission will be kept." : "";
    if (!window.confirm(`Remove ${leader.email} from the leader list? They won't be able to log in.${note}`)) return;
    try {
      await deleteLeader(leader.email);
      toast.success("Team leader removed");
      load();
    } catch (err) {
      if (err.response?.status === 401) return handleUnauthorized();
      toast.error(getErrorMessage(err, "Could not remove the team leader"));
    }
  };

  const exportSubmissions = () =>
    downloadCsv(
      `sathack-submissions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Submission Time", "Team Name", "Leader Name", "Leader Email", "Leader Phone", "GitHub", "PPT", "Video", "Description"],
      (data?.submissions ?? []).map((s) => [s.submissionTime, s.teamName, s.leaderName, s.leaderEmail, s.leaderPhone, s.githubLink, s.pptLink, s.videoLink, s.description])
    );

  const exportLeaders = () =>
    downloadCsv(
      `sathack-leaders-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Email", "Leader Name", "Team Name", "Phone", "College", "Team Members", "Status", "Submitted At", "Added Via"],
      (data?.leaders ?? []).map((l) => [l.email, l.leaderName, l.teamName || l.submission?.teamName, l.leaderPhone, l.college, l.teamMembers, l.submitted ? "Submitted" : "Pending", l.submission?.submissionTime, l.source === "admin" ? "Admin portal" : "Excel list"])
    );

  const stats = data?.stats;

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Saturnalia" className="h-7 w-auto" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-white/60">
              {data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}` : "SatHack submissions"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 text-sm text-white transition hover:bg-white/15 disabled:opacity-50">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" /> Refresh
          </button>
          <button onClick={onLogout} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 text-sm text-white transition hover:bg-white/15">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Team leaders" value={stats?.totalLeaders ?? "—"} tone="bg-sky-500/15 text-sky-300" />
        <StatCard icon={CheckCircle2} label="Submitted" value={stats?.submittedLeaders ?? "—"} tone="bg-emerald-500/15 text-emerald-300" />
        <StatCard icon={Clock} label="Not submitted yet" value={stats?.pendingLeaders ?? "—"} tone="bg-amber-500/15 text-amber-300" />
      </section>

      <AddLeaderForm onAdded={load} onUnauthorized={handleUnauthorized} />

      {/* Tabs + search */}
      <section className="rounded-2xl border border-white/15 bg-neutral-950/80 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 rounded-lg bg-white/5 p-1" role="tablist">
            {[
              ["submissions", `Submissions (${data?.submissions?.length ?? 0})`],
              ["leaders", `Team leaders (${data?.leaders?.length ?? 0})`],
            ].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 lg:flex-none rounded-md px-4 py-2 text-sm font-medium transition",
                  tab === key ? "bg-white text-gray-900" : "text-white/70 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, team, email, phone..."
                className={cn(inputClass, "h-10 pl-9 text-sm")}
                aria-label="Search"
              />
            </div>
            {tab === "leaders" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(inputClass, "h-10 text-sm sm:w-40 [&>option]:bg-neutral-900")}
                aria-label="Filter by status"
              >
                <option value="all">All leaders</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Not submitted</option>
              </select>
            )}
            <button
              onClick={tab === "submissions" ? exportSubmissions : exportLeaders}
              disabled={!data}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> CSV
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loading && !data ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <p className="text-sm text-white/60">Loading...</p>
            </div>
          ) : tab === "submissions" ? (
            submissions.length === 0 ? (
              <p className="py-12 text-center text-white/60">{q ? "No submissions match your search." : "No submissions yet."}</p>
            ) : (
              <ul className="space-y-4">
                {submissions.map((s) => (
                  <li key={`${s.teamId}-${s.submissionTime}`} className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white wrap-break-word">{s.teamName || "—"}</h3>
                        <p className="text-sm text-white/80 wrap-break-word">
                          {s.leaderName} · <span className="text-white/60">{s.leaderEmail}</span> · <span className="text-white/60">{s.leaderPhone}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {!s.leaderOnList && (
                          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300 ring-1 ring-red-400/30">Not on leader list</span>
                        )}
                        <span className="text-xs text-white/60">{s.submissionTime}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <LinkButton href={s.githubLink} icon={Github} label="GitHub" />
                      <LinkButton href={s.pptLink} icon={Presentation} label="PPT" />
                      <LinkButton href={s.videoLink} icon={Video} label="Video" />
                    </div>
                    {s.description && (
                      <details className="mt-4 group">
                        <summary className="cursor-pointer text-sm text-white/70 hover:text-white select-none">Show description</summary>
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-white/90">{s.description}</p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )
          ) : leaders.length === 0 ? (
            <p className="py-12 text-center text-white/60">No team leaders match.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/50">
                    <th className="px-4 py-3 font-medium">Leader</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">College</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((l) => (
                    <tr key={l.email} className="border-b border-white/5 align-top hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{l.leaderName || "—"}</p>
                        <p className="text-white/60 break-all">{l.email}</p>
                        {l.source === "admin" && <span className="mt-1 inline-block rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] text-sky-300">Added by admin</span>}
                      </td>
                      <td className="px-4 py-3 text-white/90">
                        <p>{l.teamName || l.submission?.teamName || "—"}</p>
                        {l.teamMembers && <p className="mt-1 max-w-xs text-xs text-white/50 line-clamp-2" title={l.teamMembers}>{l.teamMembers}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/90">{l.leaderPhone || "—"}</td>
                      <td className="px-4 py-3 text-white/90">{l.college || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge submitted={l.submitted} />
                        {l.submission?.submissionTime && <p className="mt-1 text-xs text-white/50">{l.submission.submissionTime}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeLeader(l)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-500/15"
                          aria-label={`Remove ${l.email}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------------- */

const AdminPage = () => {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getAdminToken()));

  const logout = useCallback(() => {
    setAdminToken(null);
    setLoggedIn(false);
  }, []);

  return (
    <div className="min-h-dvh w-full relative">
      <Background initialScale={1.1} />
      {loggedIn ? <Dashboard onLogout={logout} /> : <AdminLogin onLoggedIn={() => setLoggedIn(true)} />}
    </div>
  );
};

export default AdminPage;
