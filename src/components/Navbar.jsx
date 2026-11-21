import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Team Leader";
  const email = user?.email || "";
  // Only the user's own Google photo; otherwise AvatarFallback shows initials.
  // (Don't send the leader's email to third-party avatar services.)
  const avatarUrl = user?.photoURL || undefined;

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Served from public/ (the old external logo URL's domain is gone). */}
          <img
            src="/logo.png"
            alt="Saturnalia"
            className="h-8 w-auto"
          />
          <div className="h-6 w-px bg-white/20" /> {/* Divider */}
          <h1 className="text-xl font-semibold text-white">
            SatHack Submission Portal
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="text-right mr-2">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-white/60 truncate max-w-[150px]">{email}</p>
              </div>
              <Avatar>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
