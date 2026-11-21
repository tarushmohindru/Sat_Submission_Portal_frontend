import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      <Background initialScale={1.1} />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card className="w-full backdrop-blur-md bg-white/50 border border-white/10 shadow-2xl">
          <CardHeader className="space-y-6 text-center pt-8 pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
            >
              <div className="w-80 h-32 p-10 mx-auto rounded-xl flex items-center justify-center">
                <img
                  src="/main_logo1.png"
                  alt="SAT HACK"
                  className="w-80 h-auto"
                />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-black to-black/80 bg-clip-text text-transparent mb-0 pb-2">
              SatHack Submission Portal
            </CardTitle>
            <h6 className="text-gray-900">Only team leaders can login</h6>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-14 bg-white hover:bg-white/80 text-black hover:backdrop-blur-sm text-lg font-medium flex items-center justify-center gap-3 transition-all duration-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isLoading}
              >
                <FcGoogle className="w-7 h-7" />
                <span className="ml-2">
                  {isSigningIn ? "Signing in..." : "Continue with Google"}
                </span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
