import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Languages, 
  GraduationCap, 
  Globe, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  BookOpenCheck,
  Zap,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { StudyProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: StudyProfile;
  onChangeProfile: (profile: StudyProfile) => void;
  isBright: boolean;
  tColors: any;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  activeProfile,
  onChangeProfile,
  isBright,
  tColors
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('logos_onboarding_completed', 'true');
    } else {
      localStorage.removeItem('logos_onboarding_completed');
    }
    onClose();
  };

  const stepsData = [
    {
      title: "Welcome to Logos-Explorer",
      subtitle: "The Logos-Transmission Study Companion",
      icon: <Compass className="w-12 h-12 text-yellow-500 animate-spin-slow" />,
      content: (
        <div className="space-y-4">
          <p className={`text-sm leading-relaxed ${isBright ? 'text-neutral-600' : 'text-neutral-300'}`}>
            Explore the intersection of scientific formulations and teleological metaphysics. This workspace is your interactive study system designed to help you analyze each transmission with depth and clarity.
          </p>
          <div className={`p-4 rounded-xl border ${isBright ? 'bg-neutral-50 border-neutral-200 text-neutral-700' : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'} text-xs space-y-2`}>
            <div className="flex items-center gap-2 font-semibold text-yellow-500">
              <Sparkles size={14} />
              <span>Core Features:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-left pl-1">
              <li>Interactive timelines, slides, and specialized reports.</li>
              <li>Dual dynamic Mind Maps charting key theological concepts.</li>
              <li>A high-fidelity Audio Player with adaptive playback controls.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Choose Your Perspective",
      subtitle: "Four custom language and study demographics",
      icon: <Languages className="w-12 h-12 text-indigo-400" />,
      content: (
        <div className="space-y-4">
          <p className={`text-sm leading-relaxed ${isBright ? 'text-neutral-600' : 'text-neutral-300'}`}>
            Select a profile to instantly adjust all vocabularies, slide decks, summaries, and theological alignments:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'academic_en' as StudyProfile,
                label: 'Academic (EN)',
                desc: 'Deep scholarly prose and thermodynamic mathematics.',
                icon: <GraduationCap size={16} className="text-yellow-500" />
              },
              {
                id: 'esl_en' as StudyProfile,
                label: 'Simplified (EN)',
                desc: 'Clear explanations and simplified vocabularies.',
                icon: <HelpCircle size={16} className="text-indigo-400" />
              },
              {
                id: 'translated_es' as StudyProfile,
                label: 'Español (ES)',
                desc: 'Core content and analyses in beautiful Spanish.',
                icon: <Globe size={16} className="text-rose-400" />
              },
              {
                id: 'translated_id' as StudyProfile,
                label: 'Indonesian',
                desc: 'Theological alignments in Bahasa Indonesia.',
                icon: <Globe size={16} className="text-emerald-400" />
              }
            ].map((prof) => (
              <button
                key={prof.id}
                onClick={() => onChangeProfile(prof.id)}
                className={`flex items-start text-left p-3 rounded-xl border transition-all ${
                  activeProfile === prof.id
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : isBright
                      ? 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
                      : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950/80'
                }`}
              >
                <div className="mr-2.5 mt-0.5">{prof.icon}</div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{prof.label}</span>
                    {activeProfile === prof.id && (
                      <Check size={12} className="text-yellow-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-normal">{prof.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Offline-First Study",
      subtitle: "Learn anytime, anywhere",
      icon: <WifiOff className="w-12 h-12 text-rose-400 animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className={`text-sm leading-relaxed ${isBright ? 'text-neutral-600' : 'text-neutral-300'}`}>
            All active episode data, study slides, and summaries are cached in your browser. If you lose internet, the workspace seamlessly switches to Offline Mode so your studies continue uninterrupted.
          </p>

          <div className="p-4 rounded-xl border border-dashed border-neutral-800 bg-[#060609]/40 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle size={14} />
              <span>Ready for Action</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Use the Study Selectors to pick an episode and choose your modules. Visit the Admin Dashboard if you want to import or manage your spreadsheet datasets.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-neutral-700 text-yellow-600 focus:ring-yellow-500 focus:ring-offset-neutral-900 bg-neutral-950"
              />
              <span className="text-xs text-neutral-400">Don't show this guide on future visits</span>
            </label>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = stepsData[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`w-full max-w-2xl border ${
            isBright 
              ? 'bg-white border-neutral-200 text-neutral-900 shadow-2xl' 
              : 'bg-[#0a080d] border-neutral-800 text-neutral-100 shadow-2xl shadow-black'
          } rounded-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className={`p-5 border-b flex items-center justify-between ${isBright ? 'border-neutral-100' : 'border-neutral-900/60'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-900 flex items-center justify-center border border-white/10 shadow">
                <Compass className="text-white animate-spin-slow" size={16} />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-yellow-500 uppercase font-bold block leading-none">Logos-Explorer User Guide</span>
                <h3 className="font-serif text-sm font-bold tracking-tight mt-0.5">Welcome to Logos-Explorer</h3>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isBright ? 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <span className="text-sm">✕</span>
            </button>
          </div>

          {/* Core Wizard Canvas */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col justify-center items-center text-center">
            {/* Slide Icon */}
            <motion.div 
              key={`icon-${step}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-2xl mb-2 ${isBright ? 'bg-neutral-50' : 'bg-neutral-950/50 border border-neutral-900/50'}`}
            >
              {currentStepData.icon}
            </motion.div>

            {/* Slide Title */}
            <div className="space-y-1 max-w-lg">
              <h2 className="font-serif text-xl font-extrabold tracking-tight">{currentStepData.title}</h2>
              <p className="text-xs text-yellow-500 font-mono tracking-tight">{currentStepData.subtitle}</p>
            </div>

            {/* Slide Content */}
            <div className="w-full max-w-lg text-neutral-300">
              {currentStepData.content}
            </div>
          </div>

          {/* Footer controls */}
          <div className={`p-5 border-t flex items-center justify-between ${
            isBright ? 'border-neutral-100 bg-neutral-50/50' : 'border-neutral-900/60 bg-[#050406]/50'
          }`}>
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {stepsData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === step 
                      ? 'w-5 bg-yellow-500' 
                      : `w-1.5 ${isBright ? 'bg-neutral-200 hover:bg-neutral-300' : 'bg-neutral-800 hover:bg-neutral-700'}`
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    isBright 
                      ? 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700' 
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-white bg-yellow-600 hover:bg-yellow-700 shadow-md shadow-yellow-950/20"
              >
                <span>{step === totalSteps - 1 ? 'Get Started' : 'Continue'}</span>
                {step < totalSteps - 1 && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
