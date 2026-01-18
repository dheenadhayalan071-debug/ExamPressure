
import React, { useMemo, useState } from 'react';
import { Profile, Paper, LeaderboardEntry } from '../types';
import { db } from '../supabaseMock';

interface DashboardProps {
  profile: Profile;
  onStartPaper: (p: Paper) => void;
  onOpenAnalysis: (p: Paper) => void;
  onUpdateProfile: (p: Profile) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartPaper, onOpenAnalysis, onUpdateProfile }) => {
  const [tab, setTab] = useState<'operations' | 'leaderboard' | 'settings'>('operations');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [groupCode, setGroupCode] = useState(profile.group_id || '');

  const papers = useMemo(() => db.getPapers().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), []);
  const leaderboard = useMemo(() => db.getLeaderboard(regionFilter, levelFilter), [regionFilter, levelFilter]);
  const groupStats = useMemo(() => db.getGroupStats(profile.group_id), [profile.group_id]);

  const daysLeft = useMemo(() => {
    const diff = new Date(profile.exam_date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [profile.exam_date]);

  const zoneColor = {
    'Safe': 'text-emerald-500',
    'Borderline': 'text-yellow-500',
    'Danger': 'text-red-500'
  };

  const todayPaper = papers.find(p => {
    const d = new Date(p.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  });

  const handleJoinGroup = () => {
    if (!groupCode) return;
    const updated = { ...profile, group_id: groupCode };
    db.setProfile(updated);
    onUpdateProfile(updated);
    alert(`Protocol: Joined Group ${groupCode}. Synchronization Complete.`);
  };

  return (
    <div className="p-6">
      <header className="mb-8 border-b-2 border-white pb-4 relative">
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">EXAM<br/>PRESSURE</h1>
        <p className="mt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">Protocol Active // No Flexibility Authorized</p>
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">STRICT MODE</div>
      </header>

      {/* Prominent Days Left Display */}
      <section className="mb-8 bg-white text-black p-6 border-b-8 border-zinc-500">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Time to Target</p>
            <p className="text-7xl font-black tracking-tighter leading-none">{daysLeft}D</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase mb-1">Target</p>
             <p className="text-sm font-black uppercase italic">{profile.exam_name}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 border border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Streak</p>
          <p className="text-4xl font-black">{profile.streak_count}</p>
        </div>
        <div className="bg-[#111] p-4 border border-zinc-800 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Group Progress</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black">{groupStats.attemptedToday}</p>
            <p className="text-xs font-bold text-zinc-600">/ {groupStats.totalMembers}</p>
          </div>
          <p className="text-[8px] font-mono text-zinc-700 uppercase">Attempted Today</p>
        </div>
      </section>

      <div className="flex border border-zinc-800 mb-6 bg-[#111]">
        {['operations', 'leaderboard', 'settings'].map((t) => (
          <button 
            key={t}
            onClick={() => setTab(t as any)}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest ${tab === t ? 'bg-white text-black' : 'text-zinc-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'operations' && (
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daily Deployment</h3>
          
          <div className="bg-[#111] p-5 border border-zinc-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold uppercase tracking-tight text-sm">30Q Precision Script</p>
                <p className="text-[10px] text-zinc-500 uppercase">Daily performance requirement</p>
              </div>
              {todayPaper?.status === 'submitted' ? (
                <span className="bg-zinc-800 text-[10px] font-bold px-2 py-1 text-zinc-400 uppercase">Awaiting Lock</span>
              ) : (
                <span className="bg-emerald-900 text-emerald-300 text-[10px] font-bold px-2 py-1">AVAILABLE</span>
              )}
            </div>
            
            {todayPaper?.status === 'available' ? (
               <button 
                onClick={() => onStartPaper(todayPaper)}
                className="w-full bg-white text-black font-black py-4 text-sm uppercase tracking-tighter hover:invert"
               >
                 ENTER EXAMINATION
               </button>
            ) : todayPaper?.status === 'submitted' ? (
              <div className="bg-zinc-900 p-4 border border-zinc-800 text-center">
                <p className="text-[10px] font-mono text-zinc-500 italic uppercase">System Locked // Unlocks in 24H</p>
              </div>
            ) : null}
          </div>

          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-4">History Log</h3>
          <div className="space-y-2">
            {papers.filter(p => p.status === 'analyzed' || (p.status === 'submitted' && new Date(p.unlocked_at!) < new Date())).map(p => (
              <div key={p.id} className="bg-[#080808] p-4 border border-zinc-900 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase">{new Date(p.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] text-zinc-600 font-mono italic">PRECISION: {p.accuracy}%</p>
                </div>
                <button 
                  onClick={() => onOpenAnalysis(p)}
                  className="text-[10px] font-black border border-zinc-700 px-4 py-2 uppercase hover:bg-zinc-900"
                >
                  DEBRIEF
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'leaderboard' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <select 
              className="bg-black border border-zinc-800 p-2 text-[10px] font-black uppercase text-zinc-400 outline-none"
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
            >
              <option value="">All Regions</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Mumbai">Mumbai</option>
            </select>
            <select 
              className="bg-black border border-zinc-800 p-2 text-[10px] font-black uppercase text-zinc-400 outline-none"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="Board">Board</option>
            </select>
          </div>

          <div className="border border-zinc-800 bg-[#050505]">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center justify-between p-4 border-b border-zinc-900 last:border-0 ${entry.is_current_user ? 'bg-zinc-800/30 border-l-2 border-white' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-zinc-700">#{entry.rank}</span>
                  <div>
                    <p className={`text-xs font-black uppercase ${entry.is_current_user ? 'text-white' : 'text-zinc-500'}`}>{entry.name}</p>
                    <p className="text-[8px] font-mono text-zinc-600 uppercase">{entry.region} // {entry.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{entry.score}%</p>
                  <p className="text-[8px] font-mono text-zinc-600 uppercase">STREAK: {entry.streak}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section className="space-y-8 bg-[#111] p-6 border border-zinc-800">
          <div>
            <h3 className="text-[10px] font-black text-white uppercase mb-4 tracking-widest underline decoration-zinc-800 underline-offset-4">Protocol Assignment</h3>
            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-2">Group Access Code</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-black border border-zinc-800 p-3 text-xs font-black uppercase text-white outline-none focus:border-white"
                placeholder="ENTER CODE"
                value={groupCode}
                onChange={e => setGroupCode(e.target.value.toUpperCase())}
              />
              <button 
                onClick={handleJoinGroup}
                className="bg-white text-black px-4 text-[10px] font-black uppercase hover:invert"
              >
                Sync
              </button>
            </div>
            <p className="mt-2 text-[8px] text-zinc-600 uppercase italic">Synchronization with group allows surveillance of peer failures.</p>
          </div>

          <div className="pt-8 border-t border-zinc-800">
             <p className="text-[8px] font-black text-zinc-700 uppercase mb-2">System Profile</p>
             <p className="text-xs font-bold text-zinc-400 uppercase">{profile.exam_name}</p>
             <p className="text-[8px] font-mono text-zinc-600 uppercase">{profile.region} | {profile.target_level}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
