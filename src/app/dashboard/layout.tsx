"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  Search,
  PlusCircle,
  FileText,
  UserCheck,
  Settings, 
  LogOut, 
  Shield,
  Loader2,
  AlertCircle,
  ArrowRight,
  Bell,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Search ID", href: "/dashboard/search", icon: Search },
  { name: "Report Found ID", href: "/dashboard/report", icon: PlusCircle },
  { name: "My Uploads", href: "/dashboard/my-uploads", icon: FileText },
  { name: "My Watchlist", href: "/dashboard/watchlist", icon: Bell },
  { name: "My Claims", href: "/dashboard/claims", icon: UserCheck },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = pathname;
      const searchParams = typeof window !== 'undefined' ? window.location.search : '';
      const fullRedirectPath = `${currentPath}${searchParams}`;
      router.push(`/login?redirect=${encodeURIComponent(fullRedirectPath)}`);
    }
  }, [user, loading, router, pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const isProfileIncomplete = !profile?.phoneNumber || !profile?.location;
  const showProfileWarning = isProfileIncomplete && pathname !== "/dashboard/settings";

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white hidden md:flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-[#003580]">IRS</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-slate-100 text-black shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-black"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-[#003580]" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-2xl font-bold tracking-tight text-[#003580]">IRS</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </Button>
              </div>
              
              <nav className="flex-1 space-y-1 px-4 py-6">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl px-4 py-3 text-base font-semibold transition-all",
                        isActive 
                          ? "bg-slate-100 text-[#003580] shadow-sm" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-black"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "text-[#003580]" : "text-slate-400")} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 p-6 space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-[#003580] border border-slate-200">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile?.fullName || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-4 rounded-2xl h-12 text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between md:justify-end border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md">
          {/* Progress Bar Line */}
          <AnimatePresence>
            {isNavigating && (
              <motion.div
                initial={{ width: "0%", left: "0%" }}
                animate={{ width: "100%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute bottom-[-1px] left-0 h-[2px] bg-[#003580] z-50"
              />
            )}
          </AnimatePresence>

          {/* Mobile Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden rounded-xl hover:bg-slate-100"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xl font-bold tracking-tight text-[#003580]">IRS</span>
          </div>

          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-slate-100 md:flex hidden items-center justify-center text-xs font-medium text-slate-600 border border-slate-200">
               {user.email?.charAt(0).toUpperCase()}
             </div>
             <div className="h-8 w-8 rounded-full bg-slate-900 md:hidden flex items-center justify-center text-xs font-medium text-white shadow-lg">
               {user.email?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
        <CompleteProfileModal />
      </main>
    </div>
  );
}
