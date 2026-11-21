import { motion } from "framer-motion";

/**
 * Fixed, animated page background shared by the login and submission pages.
 */
const Background = ({ initialScale = 1.1 }) => (
  <>
    {/* Gradient */}
    <div className="fixed inset-0 bg-linear-to-br from-gray-800 via-gray-900 to-black animate-gradient" />

    {/* Background image with Ken Burns effect */}
    <motion.img
      src="/Auth_back.png"
      alt=""
      aria-hidden="true"
      className="fixed inset-0 w-full h-full object-cover opacity-50"
      initial={{ scale: initialScale }}
      animate={{ scale: 1 }}
      transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
    />

    {/* Gradient overlay */}
    <div className="fixed inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />

    {/* Glow */}
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse" />
  </>
);

export default Background;
