
import React from 'react';

interface ProofCardProps {
  examName: string;
  day: number;
  accuracy: number;
  primaryMistake: string;
  onClose: () => void;
}

const ProofCard: React.FC<ProofCardProps> = ({ examName, day, accuracy, primaryMistake, onClose }) => {
  const shareText = `📉 Day ${day}/90 | Accuracy: ${accuracy}% | Main Error: ${primaryMistake}. #ExamPressure`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    alert('Copied for WhatsApp');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'ExamPressure Proof',
        text: shareText
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
      <div className="w-full bg-[#000] border-2 border-white p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xs font-bold uppercase">Close</button>
        
        <div id="proof-capture" className="bg-[#000]">
           <p className="text-[10px] font-bold uppercase text-zinc-500 mb-8 tracking-[0.2em]">Certified Proof Card</p>
           
           <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter leading-none">{examName}</h2>
           
           <div className="flex gap-8 mb-8 border-y border-zinc-800 py-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Operation Day</p>
                <p className="text-2xl font-black">{day}/90</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Score Accuracy</p>
                <p className="text-2xl font-black">{accuracy}%</p>
              </div>
           </div>

           <div className="mb-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Primary Failure Pattern</p>
              <p className="text-xl font-black text-red-500 uppercase italic">"{primaryMistake}"</p>
           </div>

           <div className="flex justify-between items-center opacity-50">
              <span className="text-[8px] font-mono">ENGR-PRSR-V1.0</span>
              <span className="text-[8px] font-mono">{new Date().toLocaleDateString()}</span>
           </div>
        </div>

        <div className="mt-8 space-y-2">
          <button 
            onClick={handleShare}
            className="w-full bg-white text-black font-black py-4 uppercase text-sm"
          >
            Share Proof
          </button>
          <button 
            onClick={copyToClipboard}
            className="w-full bg-transparent border border-zinc-800 text-zinc-500 font-black py-3 uppercase text-[10px]"
          >
            Copy for WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofCard;
