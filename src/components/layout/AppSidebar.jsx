// File: client/src/components/layout/AppSidebar.jsx

import { NavLink } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  LibraryBig,
  MessageCircle,
  HelpCircle,
  Inbox,
  BookMarked,
  Settings,
} from "lucide-react";

const authorNavigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/author/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Your Library",
    items: [
      {
        name: "My Books",
        path: "/author/books",
        icon: LibraryBig,
      },
    ],
  },
  {
    label: "Communication",
    items: [
      {
        name: "Support Tickets",
        path: "/author/tickets",
        icon: MessageCircle,
      },
    ],
  },
];

const adminNavigation = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Ticket Management",
    items: [
      {
        name: "All Tickets",
        path: "/admin/tickets",
        icon: Inbox,
      },
      
    ],
  },
  {
    label: "Resources",
    items: [
      {
        name: "Knowledge Base",
        path: "/admin/knowledge-base",
        icon: BookMarked,
      },
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AppSidebar({
  role = "author",
  onNavigate,
}) {
  const isAdmin = role === "admin";
  const navigation = isAdmin ? adminNavigation : authorNavigation;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#2B2B2B]/10 bg-[#F5EFE6]">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 border-b border-[#2B2B2B]/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6B2D3C] text-[#FAF7F2]">
          <BookOpen size={18} aria-hidden="true" />
        </div>

        <div>
          <span className="font-serif text-lg font-semibold tracking-tight text-[#2B2B2B]">
            BookLeaf
          </span>

          <p className="font-mono text-[10px] uppercase tracking-wider text-[#2B2B2B]/60">
            {isAdmin ? "Admin Portal" : "Author Portal"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {navigation.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#2B2B2B]/50">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={
                      item.path === "/author/tickets" ||
                      item.path === "/admin/tickets"
                    }
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#6B2D3C] text-[#FAF7F2]"
                          : "text-[#2B2B2B]/75 hover:bg-white/60 hover:text-[#6B2D3C]"
                      }`
                    }
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-[#2B2B2B]/10 p-4">
        <div className="rounded-lg border border-[#2B2B2B]/10 bg-white/60 p-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={15} className="text-[#6B2D3C]" />

            <h3 className="text-xs font-semibold text-[#2B2B2B]">
              {isAdmin ? "Support Workspace" : "Editorial Desk"}
            </h3>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-[#2B2B2B]/70">
            {isAdmin
              ? "Review author queries and keep support moving."
              : "Have questions regarding production or royalties?"}
          </p>

          {!isAdmin && (
            <NavLink
              to="/author/tickets/new"
              onClick={onNavigate}
              className="mt-3 block w-full rounded border border-[#2B2B2B]/20 bg-white py-1.5 text-center text-xs font-medium text-[#2B2B2B] transition-colors hover:border-[#6B2D3C] hover:text-[#6B2D3C]"
            >
              Create Inquiries
            </NavLink>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[10px] text-[#2B2B2B]/40">
          BookLeaf Editorial Desk
        </p>
      </div>
    </aside>
  );
}