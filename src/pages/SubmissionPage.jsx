import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlarmClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Github,
  Lock,
  Presentation,
  Users,
  Video,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Background from "@/components/Background";
import SubmissionDialog from "@/components/SubmissionDialog";
import { useAuth } from "@/contexts/useAuth";
import { submitTeamData, getSubmission } from "@/services/submissionService";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";
import { DEADLINE_LABEL, SUBMISSION_DEADLINE, formatTimeLeft } from "@/lib/deadline";

const INITIAL_FORM_STATE = {
  teamName: "",
  leaderName: "",
  leaderPhone: "",
  githubLink: "",
  pptLink: "",
  videoLink: "",
  description: "",
};

// Keep in sync with backend/middlewares/validation_middlewares.js.
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;
const PHONE_PATTERN = /^\+?[0-9\s\-().]{7,20}$/;

const inputClass =
  "h-11 bg-white/10 border-white/25 text-white text-base placeholder:text-white/40 focus-visible:border-white/60 focus-visible:ring-white/20";

/** Labelled form field with optional hint text. */
const Field = ({ id, label, hint, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <label htmlFor={id} className="block text-sm font-medium text-white">
      {label} <span className="text-red-400" aria-hidden="true">*</span>
    </label>
    {children}
    {hint && <p className="text-xs text-white/60">{hint}</p>}
  </div>
);

/** Section heading with an icon. */
const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
    </div>
  </div>
);

/** One label/value row in the read-only summary. */
const SummaryItem = ({ label, children, className }) => (
  <div className={cn("min-w-0", className)}>
    <dt className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</dt>
    <dd className="mt-1 text-base text-white wrap-break-word">{children || "—"}</dd>
  </div>
);

const SummaryLink = ({ icon: Icon, label, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10 hover:border-white/30"
  >
    <Icon className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="truncate text-xs text-sky-300">{href}</p>
    </div>
    <ExternalLink className="h-4 w-4 shrink-0 text-white/50 group-hover:text-white" aria-hidden="true" />
  </a>
);

/** Deadline notice shown to every leader after login, with a live countdown. */
const DeadlineBanner = ({ msLeft }) => {
  const closed = msLeft <= 0;
  const urgent = !closed && msLeft < 30 * 60 * 1000;
  return (
    <div
      role="status"
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border p-4 backdrop-blur",
        closed
          ? "border-red-400/40 bg-red-500/15"
          : urgent
            ? "border-orange-400/40 bg-orange-500/15"
            : "border-amber-400/40 bg-amber-500/15"
      )}
    >
      <AlarmClock
        className={cn("h-6 w-6 shrink-0", closed ? "text-red-300" : urgent ? "text-orange-300" : "text-amber-300")}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className={cn("font-semibold", closed ? "text-red-200" : "text-amber-100")}>
          Submission deadline: {DEADLINE_LABEL} IST
          {!closed && (
            <span className={cn("ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium", urgent ? "bg-orange-400/25 text-orange-100" : "bg-amber-400/20 text-amber-100")}>
              {formatTimeLeft(msLeft)}
            </span>
          )}
        </p>
        <p className={cn("mt-1 text-sm", closed ? "text-red-100/90" : "text-amber-100/90")}>
          {closed
            ? "Submissions are now closed. No submissions will be entertained after 5:30 AM."
            : "No submissions will be entertained after 5:30 AM."}
        </p>
      </div>
    </div>
  );
};

const Submission = () => {
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [submittedAt, setSubmittedAt] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Tick so the countdown and the "closed" state update on their own.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const msLeft = SUBMISSION_DEADLINE.getTime() - now;
  const deadlinePassed = msLeft <= 0;

  // Load the team's submission (if any). Submissions are final, so once one
  // exists the page shows a read-only summary instead of the form.
  const loadSubmission = useCallback(async () => {
    try {
      const submissionResponse = await getSubmission();

      if (!submissionResponse.hasSubmission) {
        // Pre-fill team details the organisers stored for this leader (still editable).
        const profile = user?.profile ?? {};
        setFormData((prev) => ({
          ...prev,
          teamName: prev.teamName || profile.teamName || "",
          leaderName: prev.leaderName || profile.leaderName || "",
          leaderPhone: prev.leaderPhone || profile.leaderPhone || "",
        }));
      }

      if (submissionResponse.hasSubmission && submissionResponse.data) {
        const data = submissionResponse.data;
        setFormData({
          teamName: data.teamName || "",
          leaderName: data.leaderName || "",
          leaderPhone: data.leaderPhone || "",
          githubLink: data.githubLink || "",
          pptLink: data.pptLink || "",
          videoLink: data.videoLink || "",
          description: data.description || "",
        });
        setSubmittedAt(data.submissionTime || "");
        setHasExistingSubmission(true);
      }
    } catch (error) {
      console.error("Error loading submission:", error);
      if (error.response?.status !== 404) {
        toast.error(getErrorMessage(error, "Failed to load submission"));
      }
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await loadSubmission();
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadSubmission]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasExistingSubmission) return;
    if (Date.now() >= SUBMISSION_DEADLINE.getTime()) {
      setNow(Date.now());
      toast.error("The submission deadline (5:30 AM) has passed. No submissions are being accepted.");
      return;
    }
    if (Object.values(formData).some((value) => !value.trim())) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!PHONE_PATTERN.test(formData.leaderPhone.trim())) {
      toast.error("Please enter a valid phone number (digits, spaces, dashes, optional +)");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      const response = await submitTeamData(formData);

      toast.success("Submission successful! Your project has been submitted.");
      setSubmittedAt(response?.data?.submissionTime || "");
      setHasExistingSubmission(true);
      setShowConfirmation(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(getErrorMessage(error, "Failed to submit. Please try again."));
      // Already submitted (e.g. from another tab): show the saved submission.
      if (error.response?.data?.alreadySubmitted) {
        setShowConfirmation(false);
        await loadSubmission();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionLength = formData.description.trim().length;

  return (
    <div className="min-h-dvh w-full relative">
      <Background initialScale={1.2} />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Project Submission</h1>
            <p className="mt-1 text-sm sm:text-base text-white/70">
              {hasExistingSubmission
                ? "Here's what your team submitted."
                : "Fill in your team and project details. You can submit only once."}
            </p>
          </header>

          <DeadlineBanner msLeft={msLeft} />

          <div className="rounded-2xl border border-white/15 bg-neutral-950/80 backdrop-blur-md shadow-2xl">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p className="text-sm text-white/60">Loading your submission...</p>
              </div>
            ) : hasExistingSubmission ? (
              /* ---------------- Submitted: read-only summary ---------------- */
              <div className="p-5 sm:p-8 space-y-8">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-emerald-300">Project submitted</p>
                    <p className="text-sm text-emerald-100/80">
                      {submittedAt ? `Submitted on ${submittedAt}. ` : ""}
                      Submissions are final and can&apos;t be edited.
                    </p>
                  </div>
                </div>

                <section className="space-y-4">
                  <SectionTitle icon={Users} title="Team Information" />
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <SummaryItem label="Team name">{formData.teamName}</SummaryItem>
                    <SummaryItem label="Team leader">{formData.leaderName}</SummaryItem>
                    <SummaryItem label="Leader phone">{formData.leaderPhone}</SummaryItem>
                    <SummaryItem label="Leader email">{user?.email}</SummaryItem>
                  </dl>
                </section>

                <section className="space-y-4">
                  <SectionTitle icon={FileText} title="Project Details" />
                  <div className="grid grid-cols-1 gap-3">
                    <SummaryLink icon={Github} label="GitHub repository" href={formData.githubLink} />
                    <SummaryLink icon={Presentation} label="Presentation (PPT)" href={formData.pptLink} />
                    <SummaryLink icon={Video} label="Demo video" href={formData.videoLink} />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/50">Description</p>
                    <p className="mt-2 whitespace-pre-wrap wrap-break-word text-base leading-relaxed text-white">
                      {formData.description}
                    </p>
                  </div>
                </section>
              </div>
            ) : deadlinePassed ? (
              /* ---------------- Deadline passed, nothing submitted ---------------- */
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <AlarmClock className="h-10 w-10 text-red-300" aria-hidden="true" />
                <p className="text-lg font-semibold text-white">Submissions are closed</p>
                <p className="max-w-md text-sm text-white/70">
                  The deadline was {DEADLINE_LABEL} IST. No submissions will be entertained after 5:30 AM.
                </p>
              </div>
            ) : (
              /* ---------------- Not submitted yet: the form ---------------- */
              <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-10">
                <section className="space-y-5">
                  <SectionTitle
                    icon={Users}
                    title="Team Information"
                    subtitle="Details of your team and its leader."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field id="teamName" label="Team name" className="md:col-span-2">
                      <Input
                        id="teamName"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="e.g. Byte Busters"
                        maxLength={MAX_NAME_LENGTH}
                        autoComplete="organization"
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <Field id="leaderName" label="Team leader name">
                      <Input
                        id="leaderName"
                        name="leaderName"
                        value={formData.leaderName}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Full name"
                        maxLength={MAX_NAME_LENGTH}
                        autoComplete="name"
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <Field id="leaderPhone" label="Team leader phone">
                      <Input
                        id="leaderPhone"
                        name="leaderPhone"
                        type="tel"
                        inputMode="tel"
                        value={formData.leaderPhone}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="+91 98765 43210"
                        maxLength={20}
                        autoComplete="tel"
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <div className="md:col-span-2 space-y-2">
                      <span className="block text-sm font-medium text-white">Team leader email</span>
                      <div className="flex h-11 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-base text-white/90">
                        <Lock className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
                        <span className="truncate">{user?.email || "—"}</span>
                      </div>
                      <p className="text-xs text-white/60">Taken from your Google account.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  <SectionTitle
                    icon={FileText}
                    title="Project Details"
                    subtitle="Make sure every link is public or shared with view access."
                  />
                  <div className="space-y-5">
                    <Field id="githubLink" label="GitHub repository link">
                      <Input
                        id="githubLink"
                        name="githubLink"
                        type="url"
                        inputMode="url"
                        value={formData.githubLink}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="https://github.com/your-team/your-repo"
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <Field id="pptLink" label="Presentation (PPT) link" hint="Google Drive / Slides / Canva link with view access.">
                      <Input
                        id="pptLink"
                        name="pptLink"
                        type="url"
                        inputMode="url"
                        value={formData.pptLink}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="https://drive.google.com/..."
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <Field id="videoLink" label="Demo video link" hint="YouTube (unlisted is fine) or Google Drive.">
                      <Input
                        id="videoLink"
                        name="videoLink"
                        type="url"
                        inputMode="url"
                        value={formData.videoLink}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="https://youtube.com/..."
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                    <div className="space-y-2">
                      <label htmlFor="description" className="block text-sm font-medium text-white">
                        Project description <span className="text-red-400" aria-hidden="true">*</span>
                      </label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="min-h-40 bg-white/10 border-white/25 text-white text-base placeholder:text-white/40 focus-visible:border-white/60 focus-visible:ring-white/20"
                        placeholder="What does your project do, how did you build it, and what problem does it solve?"
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        required
                        disabled={isSubmitting}
                      />
                      <p className={cn("text-right text-xs", descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9 ? "text-amber-300" : "text-white/50")}>
                        {descriptionLength} / {MAX_DESCRIPTION_LENGTH}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="space-y-3 border-t border-white/10 pt-6">
                  <p className="flex items-center gap-2 text-sm text-amber-300">
                    <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    You can submit only once. Please double-check everything.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-white text-base font-semibold text-gray-900 shadow-lg transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Review & Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      <SubmissionDialog
        isOpen={showConfirmation}
        onClose={() => !isSubmitting && setShowConfirmation(false)}
        onConfirm={handleConfirmSubmission}
        formData={formData}
        leaderEmail={user?.email}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Submission;
