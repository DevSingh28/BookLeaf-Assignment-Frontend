import {
  Bell,
  Search,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "../../store/authStore";

const pageTitles = {
  "/author/dashboard": {
    title: "Dashboard",
    description: "Your publishing overview",
  },
  "/author/books": {
    title: "My Books",
    description: "Manage your published titles",
  },
  "/author/tickets": {
    title: "Support Tickets",
    description: "Manage your support conversations",
  },
  "/author/tickets/new": {
    title: "Create Ticket",
    description: "Tell us how we can help",
  },
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Support operations overview",
  },
  "/admin/tickets": {
    title: "Ticket Management",
    description: "Manage author support conversations",
  },
  "/admin/knowledge-base": {
    title: "Knowledge Base",
    description: "Manage publishing support resources",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Manage portal settings",
  },
};

export default function AppHeader({
  role = "author",
  onMenuClick,
  onLogout,
  logoutLoading = false,
  logoutError = "",
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const isAdmin = role === "admin";

  const fullName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    "User";

  const email = user?.email || "";

  const workspaceLabel = isAdmin
    ? "Admin Workspace"
    : "Author Workspace";

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  const currentPage = pageTitles[location.pathname] || {
    title: location.pathname.includes("/tickets/")
      ? "Ticket Details"
      : "BookLeaf Portal",
    description: location.pathname.includes("/tickets/")
      ? "View your support conversation"
      : "Author and support workspace",
  };

  const profilePath = isAdmin
    ? "/admin/settings"
    : "/author/profile";

  const settingsPath = isAdmin
    ? "/admin/settings"
    : "/author/settings";

  return (
    <header className="relative z-20 flex h-20 items-center justify-between gap-4 border-b border-[#2B2B2B]/10 bg-[#FAF7F2] px-6 sm:px-8 lg:px-10">
      <div className="flex min-w-0 items-center gap-3.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border-[#2B2B2B]/15 bg-white text-[#2B2B2B] hover:bg-[#F5EFE6] hover:text-[#6B2D3C] lg:hidden"
        >
          <Menu size={18} />
        </Button>

        <div className="min-w-0">
          <h2 className="truncate font-serif text-xl font-normal tracking-tight text-[#2B2B2B] sm:text-2xl">
            {currentPage.title}
          </h2>

          <p className="mt-0.5 hidden text-xs text-[#2B2B2B]/60 sm:block">
            {currentPage.description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="relative hidden md:block">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/40"
          />

          <Input
            type="search"
            placeholder="Demo Not work yet..."
            aria-label="Search"
            className="h-10 w-44 rounded-lg border-[#2B2B2B]/15 bg-white pl-9 pr-8 text-xs text-[#2B2B2B] placeholder:text-[#2B2B2B]/35 focus-visible:border-[#6B2D3C] focus-visible:ring-1 focus-visible:ring-[#6B2D3C] lg:w-56"
          />

          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[#2B2B2B]/10 bg-[#FAF7F2] px-1.5 py-0.5 text-[10px] text-[#2B2B2B]/50">
            /
          </kbd>
        </div>

        {/* <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Notifications"
          className="relative h-10 w-10 cursor-pointer rounded-lg border-[#2B2B2B]/15 bg-white text-[#2B2B2B]/80 hover:bg-[#F5EFE6] hover:text-[#6B2D3C]"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#C9A227]" />
        </Button> */}

        <div className="hidden h-8 w-px bg-[#2B2B2B]/10 sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-auto cursor-pointer items-center gap-3 rounded-lg p-1.5 text-left outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#6B2D3C]"
            aria-label="Open account menu"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6B2D3C] text-xs font-semibold text-[#FAF7F2]">
              {initials}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-36 truncate text-xs font-semibold text-[#2B2B2B]">
                {fullName}
              </p>

              <p className="text-[11px] text-[#2B2B2B]/60">
                {workspaceLabel}
              </p>
            </div>

            <ChevronDown
              size={14}
              className="hidden shrink-0 text-[#2B2B2B]/50 sm:block"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-lg border border-[#2B2B2B]/15 bg-white p-1 text-[#2B2B2B] shadow-lg"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="truncate text-xs font-semibold text-[#2B2B2B]">
                {fullName}
              </p>

              <p className="truncate text-[11px] font-normal text-[#2B2B2B]/60">
                {email || workspaceLabel}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#2B2B2B]/10" />

            <DropdownMenuItem
              onClick={() => navigate(profilePath)}
              className="cursor-pointer gap-2.5 rounded px-3 py-2 text-xs font-medium text-[#2B2B2B] focus:bg-[#FAF7F2] focus:text-[#6B2D3C]"
            >
              <UserRound size={15} />
              {isAdmin ? "Admin Profile" : "Author Profile"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate(settingsPath)}
              className="cursor-pointer gap-2.5 rounded px-3 py-2 text-xs font-medium text-[#2B2B2B] focus:bg-[#FAF7F2] focus:text-[#6B2D3C]"
            >
              <Settings size={15} />
              Portal Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#2B2B2B]/10" />

            {logoutError && (
              <div
                role="status"
                className="px-3 py-2 text-xs text-red-600"
              >
                {logoutError}
              </div>
            )}

            <DropdownMenuItem
              disabled={logoutLoading}
              onClick={() => onLogout?.()}
              className="cursor-pointer gap-2.5 rounded px-3 py-2 text-xs font-medium text-[#6B2D3C] focus:bg-[#FAF7F2] focus:text-[#582431]"
            >
              <LogOut size={15} />
              {logoutLoading ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}