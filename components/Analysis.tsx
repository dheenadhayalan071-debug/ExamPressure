
import React, { useState, useEffect } from 'react';
import { Paper, Profile, Answer, Question, MistakeCategory, StudyMaterial } from '../types';
import { db } from '../supabaseMock';
import { analyzeMistakes, suggestMistakeCategories } from '../geminiService';
import ProofCard from './ProofCard';

interface AnalysisProps {
  paper: Paper;
  profile: Profile;
  onBack: () => void;
}

const MISTAKE_CATEGORIES: MistakeCategory[] = ['Knowledge Gap', 'Trap', 'Overthinking', 'Time Pressure', 'Blind Guess'];

const Analysis: React.FC<AnalysisProps> = ({ paper, profile, onBack }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorizing, setCategorizing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{feedback: string, nextDayPlan: StudyMaterial[], mentorPersona: string, motivation: string}>({ 
    feedback: '', 
    nextDayPlan: [],
    mentorPersona: 'Standard Examiner',
    motivation: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, { category: MistakeCategory, reasoning: string }>>({});
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      const rawAns = db.getAnswers(paper.id);
      const qs = db.getQuestions(paper.id);
      setQuestions(qs);

      let workingAnswers = [...rawAns];

      const wrongAnsObjects = rawAns.filter(a => !a.is_correct).map(a => ({
        answer: a,
        question: qs.find(q => q.id === a.question_id)!
      }));

      // 1. Fetch AI Suggestions for categories
      if (wrongAnsObjects.length > 0) {
        setCategorizing(true);
        try {
          const suggestions = await suggestMistakeCategories(profile.exam_name, wrongAnsObjects);
          setAiSuggestions(suggestions);
          
          workingAnswers = workingAnswers.map(a => {
            // Pre-select the suggested category if it hasn't been set yet
            if (!a.is_correct && (!a.mistake_category || a.mistake_category === 'Knowledge Gap') && suggestions[a.id]) {
              return { ...a, mistake_category: suggestions[a.id].category };
            }
            return a;
          });
        } catch (e) {
          console.error("AI Categorization failed", e);
        }
        setCategorizing(false);
      }
      
      setAnswers(workingAnswers);

      // 2. Full Performance Directive Analysis
      try {
        const result = await analyzeMistakes(profile.exam_name, { 
          paper: { ...paper, status: 'analyzed' }, 
          answers: workingAnswers 
        });
        setAiAnalysis(result);
      } catch (e) {
        console.error("AI Analysis failed", e);
      }
      setLoading(false);
    };
    runAnalysis();
  }, [paper.id, profile.exam_name]);

  const handleCategoryChange = (answerId: string, category: MistakeCategory) => {
    const updatedAnswers = answers.map(a => a.id === answerId ? { ...a, mistake_category: category } : a);
    setAnswers(updatedAnswers);
    
    // Persist to mock DB
    const answer = updatedAnswers.find(a => a.id === answerId);
    if (answer) {
      db.saveAnswer(answer); 
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 bg-black">
      <div className="w-16 h-[2px] bg-red-600 animate-pulse" />
      <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-500">
        {categorizing ? "Analyzing Deviations..." : "Consulting High-Level Examiner..."}
      </p>
    </div>
  );

  const wrongAnswers = answers.filter(a => !a.is_correct);
  const mistakeFrequencies = wrongAnswers.reduce((acc, curr) => {
    const cat = curr.mistake_category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMistake = Object.entries(mistakeFrequencies).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || "None";

  return (
    <div className="p-6">
      <header className="mb-10 flex justify-between items-center">
        <button onClick={onBack} className="text-[10px] font-black uppercase border border-zinc-800 px-5 py-2 hover:bg-zinc-900 transition-colors">Archive</button>
        <button onClick={() => setShowProof(true)} className="text-[10px] font-black uppercase bg-white text-black px-5 py-2 hover:invert transition-all">Generate Proof</button>
      </header>

      {/* Mentor Persona & Brutal Feedback */}
      <section className="mb-12">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-8xl font-black tracking-tighter leading-none">{paper.accuracy}%</h2>
            <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest font-bold font-mono">Precision Index</span>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Mentor Authority</p>
            <p className="text-[10px] font-black text-white uppercase border border-zinc-800 px-2 py-1 bg-zinc-900">{aiAnalysis.mentorPersona}</p>
          </div>
        </div>
        
        <div className="mt-8">
           <p className="text-[10px] font-black uppercase text-zinc-700 mb-3 tracking-[0.2em]">Mechanical Directive (Brutal Mode)</p>
           <div className="p-6 border-l-[6px] border-red-600 bg-[#0a0a0a] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-5">
               <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01709V14H12.017C14.2262 14 16.0171 15.7909 16.0171 18V21H14.017ZM17.0171 21V18C17.0171 15.2386 14.7785 13 12.0171 13H11.0171V11H12.0171C15.8831 11 19.0171 14.134 19.0171 18V21H17.0171ZM12.0171 10C10.3602 10 9.01709 8.65685 9.01709 7C9.01709 5.34315 10.3602 4 12.0171 4C13.674 4 15.0171 5.34315 15.0171 7C15.0171 8.65685 13.674 10 12.0171 10Z"></path></svg>
             </div>
             <p className="text-[13px] font-bold leading-relaxed text-zinc-100 uppercase italic">
               "{aiAnalysis.feedback}"
             </p>
           </div>
           {aiAnalysis.motivation && (
             <div className="mt-4 p-4 border border-zinc-900 bg-[#050505]">
                <p className="text-[9px] font-black uppercase text-zinc-700 mb-1 tracking-widest underline decoration-zinc-800 underline-offset-4">Strict Motivation</p>
                <p className="text-[11px] text-zinc-500 font-mono italic">"{aiAnalysis.motivation}"</p>
             </div>
           )}
        </div>
      </section>

      {/* Remediation Roadmap Cards */}
      <section className="mb-14">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase mb-5 tracking-[0.2em]">Remediation Roadmap (Fixed Progress)</h3>
        <div className="grid gap-4">
          {aiAnalysis.nextDayPlan.map((mat, i) => (
            <div key={i} className="group p-5 bg-[#080808] border border-zinc-900 border-l-2 border-l-zinc-700 hover:border-l-white transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black bg-zinc-800 text-zinc-400 px-2 py-1 uppercase font-mono">Module 0{i+1}</span>
                <span className={`text-[8px] font-black px-2 py-1 uppercase rounded-sm ${mat.priority === 'High' ? 'bg-red-900/30 text-red-500 border border-red-900/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
                  {mat.priority} Priority
                </span>
              </div>
              <p className="text-sm font-black uppercase tracking-tight text-white mb-2">{mat.topic}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed uppercase font-mono">{mat.summary}</p>
              <div className="mt-5 pt-4 border-t border-zinc-900/50 flex justify-between items-center">
                <span className="text-[7px] font-bold text-zinc-800 uppercase tracking-[0.2em]">Follow-Up Enforced</span>
                <span className="text-[7px] font-bold text-zinc-500 uppercase italic">No Excuses Authorized</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Failure Audit Section */}
      <div className="mb-12">
        <h3 className="text-[10px] font-black text-zinc-600 uppercase mb-6 tracking-[0.2em]">Failure Audit // {wrongAnswers.length} Identified Anomalies</h3>
        <div className="space-y-12">
          {wrongAnswers.map(ans => {
            const q = questions.find(item => item.id === ans.question_id);
            const suggestion = aiSuggestions[ans.id];
            const isAiSuggested = ans.mistake_category === suggestion?.category;
            
            return (
              <div key={ans.id} className="border-t border-zinc-800 pt-6">
                <div className="mb-4">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-mono text-zinc-600 uppercase">Ref ID: {ans.id.toUpperCase()}</p>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5">Time Limit: {ans.time_spent}s</p>
                   </div>
                   <p className="text-md font-bold text-zinc-200 leading-snug">{q?.text}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="p-3 border border-red-900/30 bg-red-900/5">
                     <p className="text-[8px] font-black text-red-600 uppercase mb-1.5 tracking-widest font-mono">User Input</p>
                     <p className="text-xs font-bold text-red-400 uppercase">{ans.user_answer || 'NULL_DATA'}</p>
                   </div>
                   <div className="p-3 border border-emerald-900/30 bg-emerald-900/5">
                     <p className="text-[8px] font-black text-emerald-600 uppercase mb-1.5 tracking-widest font-mono">Correct Logic</p>
                     <p className="text-xs font-bold text-emerald-400 uppercase">{q?.correct_answer}</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Mistake Taxonomy</label>
                      {isAiSuggested && (
                        <span className="text-[7px] font-black text-emerald-500 uppercase border border-emerald-900/50 px-1.5 py-0.5 bg-emerald-900/10">Mentor Recommendation</span>
                      )}
                    </div>
                    <select 
                      value={ans.mistake_category || ''}
                      onChange={(e) => handleCategoryChange(ans.id, e.target.value as MistakeCategory)}
                      className="w-full bg-black border border-zinc-800 text-xs font-black uppercase p-4 focus:border-white focus:ring-0 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Category</option>
                      {MISTAKE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat} {suggestion?.category === cat ? "(AI RECOMMENDED)" : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 border border-zinc-900">
                    <p className="text-[9px] font-black uppercase text-zinc-700 mb-2 tracking-widest">Attribution Model Reasoning</p>
                    <p className="text-[11px] text-zinc-400 italic font-mono leading-relaxed border-l border-zinc-800 pl-3">
                      "{suggestion?.reasoning || 'Diagnostic inconclusive.'}"
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showProof && (
        <ProofCard 
          examName={profile.exam_name} 
          day={profile.streak_count} 
          accuracy={paper.accuracy} 
          primaryMistake={topMistake} 
          onClose={() => setShowProof(false)} 
        />
      )}
    </div>
  );
};

export default Analysis;
