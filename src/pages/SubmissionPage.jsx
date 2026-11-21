import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Background from "@/components/Background";
import SubmissionDialog from "@/components/SubmissionDialog";
import { useAuth } from "@/contexts/useAuth";
import { submitTeamData, getSubmission } from "@/services/submissionService";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";

const INITIAL_FORM_STATE = {
  teamName: "",
  leaderName: "",
  leaderPhone: "",
  githubLink: "",
  pptLink: "",
  videoLink: "",
  description: "",
};

const Submission = () => {
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);

  // Submissions are final: once one exists, show it read-only.
  const isLocked = hasExistingSubmission || isSubmitting;

  // Load the team's submission (if any) into the form and lock it.
  const loadSubmission = useCallback(async () => {
    try {
      const submissionResponse = await getSubmission();

      if (submissionResponse.hasSubmission && submissionResponse.data) {
        setFormData({
          teamName: submissionResponse.data.teamName || "",
          leaderName: submissionResponse.data.leaderName || "",
          leaderPhone: submissionResponse.data.leaderPhone || "",
          githubLink: submissionResponse.data.githubLink || "",
          pptLink: submissionResponse.data.pptLink || "",
          videoLink: submissionResponse.data.videoLink || "",
          description: submissionResponse.data.description || "",
        });
        setHasExistingSubmission(true);
      }
    } catch (error) {
      console.error("Error loading submission:", error);
      if (error.response?.status !== 404) {
        toast.error(getErrorMessage(error, "Failed to load submission"));
      }
    }
  }, []);

  // Load any existing submission when the component mounts
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
    // Validate required fields
    if (Object.values(formData).some((value) => !value.trim())) {
      toast.error("Please fill in all required fields");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);
      
      await submitTeamData(formData);

      toast.success("Submission successful! Your project has been submitted.");
      setHasExistingSubmission(true);
      setShowConfirmation(false);
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

  return (
    <div className="min-h-screen w-full relative">
      <Background initialScale={1.2} />

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="max-w-3xl mx-auto backdrop-blur-md bg-black/30 border border-white/10 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent">
                Project Submission Form
              </CardTitle>
              {hasExistingSubmission && (
                <p className="text-sm text-green-400 mt-2">
                  Your project has been submitted. Submissions are final and can't be edited.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Team Information</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/70">
                            Team Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            name="teamName"
                            value={formData.teamName}
                            onChange={handleInputChange}
                            type="text"
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Your team name"
                            required
                            maxLength={100}
                            readOnly={hasExistingSubmission}
                            disabled={isLocked}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/70">
                            Team Leader Name <span className="text-red-400">*</span>
                          </label>
                          <Input
                            name="leaderName"
                            value={formData.leaderName}
                            onChange={handleInputChange}
                            type="text"
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Full name"
                            required
                            maxLength={100}
                            readOnly={hasExistingSubmission}
                            disabled={isLocked}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/70">
                            Team Leader Phone <span className="text-red-400">*</span>
                          </label>
                          <Input
                            name="leaderPhone"
                            value={formData.leaderPhone}
                            onChange={handleInputChange}
                            type="tel"
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="+91 98765 43210"
                            required
                            readOnly={hasExistingSubmission}
                            disabled={isLocked}
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-white/70">Team Leader Email</span>
                          <p className="text-white font-medium">{user?.email || "N/A"}</p>
                          <p className="text-xs text-white/50">From your Google account.</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">
                          GitHub Link <span className="text-red-400">*</span>
                        </label>
                        <Input
                          name="githubLink"
                          value={formData.githubLink}
                          onChange={handleInputChange}
                          type="url"
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="https://github.com/your-repo"
                          required
                          readOnly={hasExistingSubmission}
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">
                          PPT Link <span className="text-red-400">*</span>
                        </label>
                        <Input
                          name="pptLink"
                          value={formData.pptLink}
                          onChange={handleInputChange}
                          type="url"
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="https://drive.google.com/..."
                          required
                          readOnly={hasExistingSubmission}
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">
                          Video Link <span className="text-red-400">*</span>
                        </label>
                        <Input
                          name="videoLink"
                          value={formData.videoLink}
                          onChange={handleInputChange}
                          type="url"
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="https://youtube.com/..."
                          required
                          readOnly={hasExistingSubmission}
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">
                          Project Description <span className="text-red-400">*</span>
                        </label>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="bg-white/10 border-white/20 text-white min-h-[150px]"
                          placeholder="Describe your project..."
                          required
                          readOnly={hasExistingSubmission}
                          disabled={isLocked}
                        />
                      </div>
                    </motion.div>

                    {!hasExistingSubmission && (
                      <motion.div
                        whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                        className="pt-6"
                      >
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-12 bg-linear-to-r from-gray-700 to-gray-800 hover:from-slate-700 hover:to-slate-800 border border-white/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Submitting..." : "Submit Project"}
                        </Button>
                      </motion.div>
                    )}
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
