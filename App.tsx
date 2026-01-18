
import React, { useState, useEffect } from 'react';
import { db, seedMockData } from './supabaseMock';
import { Profile, Paper } from './types';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import TestInterface from './components/TestInterface';
import Analysis from './components/Analysis';

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [view, setView] = useState<'home' | 'test' | 'analysis'>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedMockData();
    const p = db.getProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  if (loading) return <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white font-mono text-xs uppercase tracking-[0.5em]">System Booting...</div>;

  if (!profile) {
    return <Onboarding onComplete={(p) => {
      db.setProfile(p);
      setProfile(p);
    }} />;
  }

  const handleStartPaper = (paper: Paper) => {
    setCurrentPaper(paper);
    setView('test');
  };

  const handleOpenAnalysis = (paper: Paper) => {
    setCurrentPaper(paper);
    setView('analysis');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#000] border-x border-zinc-900 overflow-hidden shadow-2xl">
      {view === 'home' && (
        <Dashboard 
          profile={profile} 
          onStartPaper={handleStartPaper} 
          onOpenAnalysis={handleOpenAnalysis}
          onUpdateProfile={setProfile}
        />
      )}
      {view === 'test' && currentPaper && (
        <TestInterface 
          paper={currentPaper} 
          onFinish={() => setView('home')} 
        />
      )}
      {view === 'analysis' && currentPaper && (
        <Analysis 
          paper={currentPaper} 
          profile={profile}
          onBack={() => setView('home')} 
        />
      )}
    </div>
  );
};

export default App;
