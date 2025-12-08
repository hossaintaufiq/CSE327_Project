"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Building2,
  Shield,
  Settings,
  Menu,
  X,
  UserCheck,
  ShoppingCart,
  MessageSquare,
  Building,
  Kanban,
  User,
  MessagesSquare,
  Phone,
  Headphones,
  Send,
  List,
  Package,
  Sparkles,
} from "lucide-react";
import useAuthStore from "@/store/authStore";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeCompanyId, activeCompanyRole, companies, isSuperAdmin } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Base menu items for dashboard
  const baseMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: User, label: "My Profile", href: "/dashboard/profile" },
  ];

  // Company-specific menu items based on role
  const companyMenuItems = [];
  
  if (activeCompanyId) {
    // For Company Admin and Manager
    if (activeCompanyRole === "company_admin" || activeCompanyRole === "manager") {
      companyMenuItems.push(
        { icon: Sparkles, label: "AI Assistant", href: "/dashboard/ai-assistant" },
        { icon: Kanban, label: "Pipeline", href: "/pipeline" },
        { icon: UserCheck, label: "Leads", href: "/clients" },
        { icon: ShoppingCart, label: "Sales", href: "/orders" },
        { icon: Users, label: "Employees", href: "/dashboard/employees" },
        { icon: FolderKanban, label: "Projects", href: "/dashboard/projects" },
        { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
        { icon: MessagesSquare, label: "Customer Chats", href: "/dashboard/conversations" },
        { icon: MessageSquare, label: "Announcements", href: "/announcements" },
        { icon: MessageSquare, label: "Team Chat", href: "/chat" },
        { icon: Building2, label: "Company Profile", href: "/dashboard/company-profile" }
      );
    }
    
    // Roles & Permissions and Settings - Only for Company Admin
    if (activeCompanyRole === "company_admin") {
      companyMenuItems.push(
        { icon: Shield, label: "Roles & Permissions", href: "/dashboard/roles" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" }
      );
    }
    // For Employee
    else if (activeCompanyRole === "employee") {
      companyMenuItems.push(
        { icon: Sparkles, label: "AI Assistant", href: "/dashboard/ai-assistant" },
        { icon: UserCheck, label: "My Leads", href: "/clients" },
        { icon: ShoppingCart, label: "My Sales", href: "/orders" },
        { icon: CheckSquare, label: "Tasks", href: "/dashboard/tasks" },
        { icon: MessagesSquare, label: "My Conversations", href: "/dashboard/conversations" },
        { icon: MessageSquare, label: "Announcements", href: "/announcements" },
        { icon: MessageSquare, label: "Team Chat", href: "/chat" }
      );
    }
    // For Client - Focus on orders, companies, and conversations
    else if (activeCompanyRole === "client") {
      companyMenuItems.push(
        { icon: Building, label: "Companies", href: "/companies" },
        { icon: Package, label: "My Orders", href: "/orders" },
        { icon: MessagesSquare, label: "Conversations", href: "/conversations" },
        { icon: MessageSquare, label: "Announcements", href: "/announcements" }
      );
    }

    // Switch Company link (if user has multiple companies)
    if (companies.length > 1) {
      companyMenuItems.push(
        { icon: Building, label: "Switch Company", href: "/company-selection" }
      );
    }
  }

  const menuItems = [...baseMenuItems, ...companyMenuItems];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-[70px] left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-[60px] left-0 h-[calc(100vh-60px)] w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-20
          transform transition-transform duration-300 ease-in-out overflow-hidden
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              {activeCompanyRole === 'client' ? 'Client Portal' : 
               activeCompanyRole === 'employee' ? 'Employee Portal' :
               activeCompanyRole === 'manager' ? 'Manager Portal' :
               activeCompanyRole === 'company_admin' ? 'Admin Panel' : 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Navigation</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          active
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

