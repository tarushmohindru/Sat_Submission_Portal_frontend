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
import { LogOut } from "lucide-react";

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
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="Saturnalia" className="h-6 sm:h-7 w-auto shrink-0" />
          <span className="hidden sm:block h-6 w-px bg-white/20" aria-hidden="true" />
          <span className="hidden sm:block truncate text-base font-semibold text-white">
            SatHack Submission Portal
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 sm:pl-3 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 min-w-0"
              aria-label="Account menu"
            >
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-medium text-white truncate max-w-[200px]">{displayName}</p>
                <p className="text-xs text-white/70 truncate max-w-[200px]">{email}</p>
              </div>
              <Avatar className="h-9 w-9 ring-2 ring-white/20">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                )}
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-2 sm:hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
