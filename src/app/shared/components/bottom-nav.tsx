
'use client';

import { Home, Mic, User, Settings, UtensilsCrossed, CircleDollarSign } from 'lucide-react';
import { cn } from '@/app/shared/lib/utils';
import type { View } from '@/app/features/dashboard/dashboard.types';

const navItems = [
  { view: 'home', icon: Home, label: 'Home' },
  { view: 'meal-plan', icon: UtensilsCrossed, label: 'Meal Plan' },
  { view: 'sally', icon: Mic, label: 'SallyPA' },
  { view: 'profile', icon: User, label: 'Profile' },
  { view: 'settings', icon: Settings, label: 'Settings' },
];


interface BottomNavProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  // The 'scan' and 'credits' views don't have a button, but this keeps the UI consistent
  if (activeView === 'scan' || activeView === 'credits') {
    return null;
  }
  
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 sm:bottom-7">
      <div className="mb-2 text-center text-xs text-[#999] sm:mb-2.5 sm:text-[0.85em]">
        Powered by ScanEats
      </div>
      <div className="flex items-center justify-around rounded-[25px] bg-[rgba(26,16,35,0.85)] p-2 shadow-[0_0_12px_1px_rgba(127,0,255,0.65),0_0_25px_5px_rgba(127,0,255,0.35),0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:rounded-[25px] sm:p-4">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              onClick={() => onNavigate(item.view as View)}
              key={item.view}
              className="group flex flex-1 flex-col items-center gap-0.5 text-gray-400 no-underline transition-colors sm:gap-1 bg-transparent border-none cursor-pointer"
            >
              <div
                className={cn(
                  'flex h-[50px] w-[50px] items-center justify-center rounded-full text-[#b0b0b0] transition-all group-hover:scale-105 group-hover:bg-[#7F00FF] group-hover:text-white group-hover:shadow-[0_0_10px_2px_rgba(127,0,255,0.7),0_0_20px_5px_rgba(127,0,255,0.4)] sm:h-[60px] sm:w-[60px]',
                  isActive &&
                    'scale-110 bg-[#7F00FF] text-white shadow-[0_0_10px_2px_rgba(127,0,255,0.7),0_0_20px_5px_rgba(127,0,255,0.4)]'
                )}
              >
                <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <span className={cn('text-[0.9em] font-normal text-[#a0a0a0] transition-colors group-hover:text-white sm:text-base', isActive && 'text-white')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
