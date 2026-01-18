
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Paper, Question, Answer } from '../types';
import { db } from '../supabaseMock';

interface TestInterfaceProps {
  paper: Paper;
  onFinish: () => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ paper, onFinish }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins for 30Q
  
  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const qs = db.getQuestions(paper.id);
    setQuestions(qs);
    questionStartTimeRef.current = Date.now();
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paper.id]);

  const updateTimeSpent = useCallback(() => {
    if (!questions[currentIndex]) return;
    const now = Date.now();
    const elapsed = Math.floor((now - questionStartTimeRef.current) / 1000);
    const qId = questions[currentIndex].id;
    
    setTimePerQuestion(prev => ({
      ...prev,
      [qId]: (prev[qId] || 0) + elapsed
    }));
    questionStartTimeRef.current = now;
  }, [currentIndex, questions]);

  const handleNext = () => {
    updateTimeSpent();
    setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
  };

  const handlePrev = () => {
    updateTimeSpent();
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = useCallback(() => {
    updateTimeSpent();
    
    let score = 0;
    questions.forEach(q => {
      const isCorrect = userAnswers[q.id] === q.correct_answer;
      if (isCorrect) score += 1;
      
      const answer: Answer = {
        id: Math.random().toString(36).substr(2, 9),
        paper_id: paper.id,
        question_id: q.id,
        user_answer: userAnswers[q.id] || '',
        is_correct: isCorrect,
        time_spent: timePerQuestion[q.id] || 0,
        mistake_category: isCorrect ? undefined : 'Knowledge Gap'
      };
      db.saveAnswer(answer);
    });

    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const updatedPaper: Paper = {
      ...paper,
      status: 'submitted',
      score,
      accuracy,
      submitted_at: new Date().toISOString(),
      unlocked_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    db.savePaper(updatedPaper);
    onFinish();
  }, [questions, userAnswers, paper, onFinish, updateTimeSpent, timePerQuestion]);

  const currentQ = questions[currentIndex];

  if (!currentQ) return <div className="p-8 text-center text-zinc-500 font-mono text-[10px] uppercase">Retrieving Operational Data...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#000]">
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#050505]">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LIVE EXAMINATION</span>
        <span className={`text-xl font-mono font-black ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-1 mb-8 overflow-x-hidden">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 flex-1 ${i === currentIndex ? 'bg-white' : i < currentIndex ? 'bg-zinc-700' : 'bg-zinc-900'}`} />
          ))}
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-white text-[10px] font-black uppercase tracking-widest bg-zinc-800 px-2 py-0.5">
              Section: {currentQ.section || 'General'}
            </p>
            <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">
              Q{currentIndex + 1} / {questions.length}
            </p>
          </div>
          <h2 className="text-xl font-bold leading-snug text-zinc-100">{currentQ.text}</h2>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setUserAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
              className={`w-full text-left p-4 border text-xs font-bold transition-all ${
                userAnswers[currentQ.id] === option 
                ? 'bg-white border-white text-black' 
                : 'bg-[#080808] border-zinc-800 text-zinc-500 hover:border-zinc-500'
              }`}
            >
              <span className="opacity-50 mr-3">{String.fromCharCode(65 + idx)}.</span> {option}
            </button>
          ))}
        </div>
      </div>

      <footer className="p-4 bg-[#050505] border-t border-zinc-800 grid grid-cols-2 gap-4">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="py-3 text-[10px] font-black uppercase border border-zinc-800 text-zinc-500 disabled:opacity-0"
        >
          Previous
        </button>
        {currentIndex === questions.length - 1 ? (
           <button 
           onClick={handleSubmit}
           className="py-3 text-[10px] font-black uppercase bg-red-600 text-white hover:bg-red-700"
         >
           Final Submit
         </button>
        ) : (
          <button 
            onClick={handleNext}
            className="py-3 text-[10px] font-black uppercase bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Next Question
          </button>
        )}
      </footer>
    </div>
  );
};

export default TestInterface;
