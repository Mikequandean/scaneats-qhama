
'use client';

import {
  useState,
} from 'react';

import type { View } from '@/app/features/dashboard/dashboard.types';

import { HomeView } from '@/app/features/dashboard/presentation/home-view';
import { ScanView } from '@/app/features/scan/presentation/scan-view';
import { SallyView } from '@/app/features/sally/presentation/sally-view';
import { ProfileView } from '@/app/features/profile/presentation/profile-view';
import { SettingsView } from '@/app/features/settings/presentation/settings-view';
import { MealPlanView } from '@/app/features/meal-plan/presentation/meal-plan-view';
import { CreditsView } from '@/app/features/credits/presentation/credits-view';
import { BottomNav } from '@/app/shared/components/bottom-nav';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<View>('home');
  
  const handleNavigate = (view: View) => {
    setActiveView(view);
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} />;
      case 'scan':
        return <ScanView onNavigate={handleNavigate} />;
      case 'meal-plan':
        return <MealPlanView onNavigate={handleNavigate} />;
      case 'sally':
        return <SallyView onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return (
          <SettingsView onNavigateToProfile={() => setActiveView('profile')} onNavigate={(view) => setActiveView(view)} />
        );
      case 'credits':
        return <CreditsView onNavigate={handleNavigate} />;
      default:
        return <HomeView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="relative h-screen">
      {renderView()}
      <BottomNav activeView={activeView} onNavigate={handleNavigate} />
    </div>
  );
}
