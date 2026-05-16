"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-[#020202] border-t border-white/5 pt-16 pb-8 rounded-tl-[20px] md:rounded-tl-[40px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl font-bold tracking-tight text-white">IRS</span>
            </div>
            <p className="text-white/40 max-w-sm">
              Kenya’s first secure ID recovery platform, built on goodwill ili tusaidie macuzo kupata ID zao bila stress.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#how-it-works" className="text-white/40 hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-white/40 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/20">
            © 2026 IRS. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/20 hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="text-white/20 hover:text-white transition-colors">Facebook</Link>
            <Link href="#" className="text-white/20 hover:text-white transition-colors">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
