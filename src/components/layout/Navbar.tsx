"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Search, Shield, User, Menu, Home, Info, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsPastHero(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navButtons = [
    { name: "Home", href: "/", icon: Home },
    { name: "How It Works", href: "#how-it-works", icon: Info },
    { name: "Report Lost ID", href: "/login", icon: PlusCircle },
  ];

  return (
    <nav 
      className={cn(
        "bg-[#020202] sticky top-0 z-50 pt-2 transition-all duration-500 ease-in-out",
        isScrolled && "pb-2",
        isPastHero ? "rounded-br-[20px] md:rounded-br-[40px] shadow-lg shadow-white/5" : "rounded-br-0 shadow-none"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Row: Logo, Nav (on scroll), and Auth */}
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <span className="text-2xl font-bold tracking-tight text-white">IRS</span>
            </Link>

            {/* Nav Buttons (Moved to header on scroll) */}
            <AnimatePresence mode="wait">
              {isScrolled && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="hidden md:flex items-center space-x-2"
                >
                  {navButtons.map((btn) => (
                    <Link
                      key={btn.name}
                      href={btn.href}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white text-xs font-medium hover:bg-white/10 transition-all whitespace-nowrap"
                    >
                      {btn.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <Button asChild variant="secondary" className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-6 transition-all duration-300">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-white text-black hover:bg-white/90 font-semibold border-none rounded-full px-6 transition-all duration-300">
                <Link href="/login">Report/Recover ID</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Navigation Buttons (Hidden on scroll) */}
        <AnimatePresence mode="wait">
          {!isScrolled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center space-x-2 pb-4 overflow-x-auto no-scrollbar">
                {navButtons.map((btn) => (
                  <Link
                    key={btn.name}
                    href={btn.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <btn.icon className="h-4 w-4" />
                    {btn.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
