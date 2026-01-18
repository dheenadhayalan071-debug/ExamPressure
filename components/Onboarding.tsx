
import React, { useState } from 'react';
import { Profile } from '../types';

interface OnboardingProps {
  onComplete: (p: Profile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [examName, setExamName] = useState('');
  const [targetScore, setTargetScore] = useState(90);
  const [examDate, setExamDate] = useState('');
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState<'National' | 'State' | 'Board'>('National');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examDate || !region) return;

    const profile: Profile = {
      id: Math.random().toString(36).substr(2, 9),
      exam_name: examName,
      target_score: targetScore,
      streak_count: 0,
      current_zone: 'Borderline',
      exam_date: new Date(examDate).toISOString(),
      group_id: null,
      region: region,
      target_level: level
    };
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-[#000] p-8 flex flex-col justify-center">
      <header className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.85]">SYSTEM<br/>INITIALIZATION</h1>
        <p className="mt-4 text-xs font-mono text-zinc-500 uppercase tracking-widest italic">Target Protocol Required</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Target Examination Name</label>
          <input 
            type="text" 
            placeholder="e.g. UPSC, CBSE 10, SSLC Science"
            className="w-full bg-transparent border-b-2 border-zinc-800 p-4 focus:border-white outline-none text-2xl font-black uppercase tracking-tighter"
            value={examName}
            onChange={e => setExamName(e.target.value)}
          />
          <p className="text-[8px] text-zinc-600 uppercase mt-2 font-bold tracking-widest">Persona Calibration: UPSC / SSLC / CBSE / GATE</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Region</label>
            <input 
              type="text" 
              placeholder="Delhi, Mumbai..."
              className="w-full bg-transparent border-b-2 border-zinc-800 p-4 focus:border-white outline-none text-xl font-black tracking-tighter uppercase"
              value={region}
              onChange={e => setRegion(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Protocol Level</label>
            <select 
              className="w-full bg-black border-b-2 border-zinc-800 p-4 focus:border-white outline-none text-lg font-black uppercase"
              value={level}
              onChange={e => setLevel(e.target.value as any)}
            >
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="Board">Board</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Target Accuracy (%)</label>
            <input 
              type="number" 
              className="w-full bg-transparent border-b-2 border-zinc-800 p-4 focus:border-white outline-none text-2xl font-black tracking-tighter"
              value={targetScore}
              onChange={e => setTargetScore(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">Examination Date</label>
            <input 
              type="date" 
              className="w-full bg-transparent border-b-2 border-zinc-800 p-4 focus:border-white outline-none text-sm font-black text-zinc-300 uppercase"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-white text-black font-black py-5 uppercase text-lg tracking-tighter mt-12"
        >
          Activate Protocol
        </button>
      </form>

      <footer className="mt-20">
        <p className="text-[10px] font-mono text-zinc-800 uppercase text-center tracking-widest">Strict Mode Active // No Excuses Authorized</p>
      </footer>
    </div>
  );
};

export default Onboarding;
