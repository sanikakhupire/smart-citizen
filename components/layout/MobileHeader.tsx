// components/layout/MobileHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { dbUser, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'My Reports', href: '/citizen', role: 'citizen' },
    { name: 'Report Issue', href: '/report', role: 'citizen' },
    { name: 'Admin Hub', href: '/admin', role: 'admin' },
    { name: 'Analytics', href: '/analytics', role: 'admin' },
    { name: 'Live Map', href: '/map', role: 'all' },
  ];

  return (
    <div className="md:hidden">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white flex items-center justify-between p-4 relative z-50">
        <h2 className="text-xl font-black tracking-tight">Smart<span className="text-blue-500">Citizen</span></h2>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 outline-none">
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[60px] left-0 w-full bg-slate-900 text-white shadow-xl z-40 border-b border-slate-800"
          >
            <nav className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => {
                if (link.role !== 'all' && link.role !== dbUser?.role) return null;
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 mt-2 border-t border-slate-800">
                <button 
                  onClick={() => { setIsOpen(false); logout(); }}
                  className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-slate-800 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}