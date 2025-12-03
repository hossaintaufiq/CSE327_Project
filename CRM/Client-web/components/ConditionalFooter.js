"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // List of routes that should NOT show footer (dashboard and authenticated pages)
  const hideFooterPaths = [
    '/dashboard',
    '/super-admin',
    '/clients',
    '/orders',
    '/pipeline',
    '/announcements',
    '/chat',
    '/conversations',
    '/companies',
    '/company-selection',
    '/notifications',
  ];
  
  // Check if current path starts with any of the hideFooterPaths
  const shouldHideFooter = hideFooterPaths.some(path => pathname?.startsWith(path));
  
  // Show footer only on main nav items (public pages)
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}

