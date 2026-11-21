import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Row = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</dt>
    <dd className="mt-0.5 text-sm text-white wrap-break-word">{children || "—"}</dd>
  </div>
);

const LinkRow = ({ label, href }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</dt>
    <dd className="mt-0.5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm text-sky-300 underline-offset-2 hover:underline break-all"
      >
        {href}
      </a>
    </dd>
  </div>
);

const SubmissionDialog = ({ isOpen, onClose, onConfirm, formData, leaderEmail, isSubmitting }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        showCloseButton={!isSubmitting}
        className="bg-neutral-900 border border-white/15 text-white sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-5 sm:p-6"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            Review your submission
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Check every detail and open the links to make sure they work.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2.5 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>Submissions are final. You won&apos;t be able to edit this after confirming.</p>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Team</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Row label="Team name">{formData.teamName}</Row>
              <Row label="Team leader">{formData.leaderName}</Row>
              <Row label="Leader phone">{formData.leaderPhone}</Row>
              <Row label="Leader email">{leaderEmail}</Row>
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Project</h3>
            <dl className="space-y-3">
              <LinkRow label="GitHub" href={formData.githubLink} />
              <LinkRow label="Presentation" href={formData.pptLink} />
              <LinkRow label="Video" href={formData.videoLink} />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-white/50">Description</dt>
                <dd className="mt-0.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-white/90 wrap-break-word">
                  {formData.description}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go back & edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-gray-900 animate-spin" />
            )}
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionDialog;
