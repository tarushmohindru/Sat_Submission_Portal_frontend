import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { auth, provider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../contexts/useAuth";
import Background from "../components/Background";
import { toast } from "react-toastify";

const Auth = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Once the backend login has finished: go to the submission page, or reset
  // the button if the login was rejected. Do nothing while it is still running.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) navigate("/submission");
    else setIsSigningIn(false);
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;

    try {
      setIsSigningIn(true);
      await signInWithPopup(auth, provider);
      // Backend authentication is handled by AuthContext
      // Navigation happens automatically when isAuthenticated becomes true
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error(error.message || "Failed to sign in. Please try again.");
      setIsSigningIn(false);
    }
  };

  const busy = isSigningIn || isLoading;

  return (
    <div className="min-h-dvh w-full relative flex items-center justify-center px-4 py-10 overflow-hidden">
      <Background initialScale={1.1} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl bg-white shadow-2xl shadow-black/50 ring-1 ring-white/20 overflow-hidden">
          {/* Brand colour strip (colours from the SAT HACK logo) */}
          <div className="h-1.5 w-full bg-linear-to-r from-[#6fcf7c] via-[#c8a6f2] to-[#e7f05a]" />

          <div className="px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center text-center">
            <motion.img
              src="/main_logo1.png"
              alt="SAT HACK, powered by Perplexity"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="w-full max-w-[240px] sm:max-w-[280px] h-auto"
            />

            <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Project Submission Portal
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Sign in to submit your team&apos;s project.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={busy}
              className="mt-8 w-full h-12 sm:h-14 rounded-xl bg-gray-900 text-white text-base sm:text-lg font-medium flex items-center justify-center gap-3 shadow-lg transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  <FcGoogle className="h-5 w-5" />
                </span>
              )}
              <span>{busy ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div className="mt-6 w-full flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 ring-1 ring-amber-200">
              <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                <span className="font-semibold">Only team leaders can log in.</span>{" "}
                Use the same email you registered your team with.
              </p>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Auth;
