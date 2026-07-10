import React, { useState } from 'react';
import { 
  Lock, 
  Key, 
  Database, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Github, 
  FileText, 
  Youtube, 
  Calendar, 
  Music, 
  Table, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  Settings,
  X,
  Palette,
  Video
} from 'lucide-react';
import { Episode, StudyProfile, EpisodeSource, Quotation, CustomSection, BookReview, BookChapterRecommendation } from '../types';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  episodes: Episode[];
  onUpdateEpisodes: (newEpisodes: Episode[]) => void;
  onResetEpisodes: () => void;
  currentTheme: string;
  onChangeTheme: (themeId: string) => void;
  onClose: () => void;
}

const THEMES = [
  { id: 'cosmic', name: 'Cosmic Space', desc: 'Deep obsidian and indigo stardust palette' },
  { id: 'emerald', name: 'Emerald Sanctuary', desc: 'Deep forest greens and mint, celebrating creation' },
  { id: 'amber', name: 'Solar Amber', desc: 'Rich charcoal and sand with sunrise amber highlights' },
  { id: 'vatican', name: 'Vatican Gold', desc: 'Royal dark navy and gold, evoking ancient archives (Default)' },
  { id: 'crimson', name: 'Royal Crimson', desc: 'Sacred burgundy and warm rose accents' }
];

const ACTIVE_THEME_HIGHLIGHTS: Record<string, string> = {
  cosmic: 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400 font-semibold shadow-indigo-950/20',
  emerald: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 font-semibold shadow-emerald-950/20',
  amber: 'bg-amber-950/20 border-amber-500/30 text-amber-400 font-semibold shadow-amber-950/20',
  vatican: 'bg-yellow-950/10 border-yellow-500/30 text-yellow-400 font-semibold shadow-yellow-950/20',
  crimson: 'bg-rose-950/20 border-rose-500/30 text-rose-400 font-semibold shadow-rose-950/20'
};

export default function AdminDashboard({
  episodes,
  onUpdateEpisodes,
  onResetEpisodes,
  currentTheme,
  onChangeTheme,
  onClose
}: AdminDashboardProps) {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('logos_admin_logged_in') === 'true';
  });
  const [loginError, setLoginError] = useState('');

  // Editing states
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(episodes[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'meta' | 'notebook' | 'sources' | 'quotes' | 'book_story' | 'excel_import' | 'new_section'>('meta');
  const [tsvPasteText, setTsvPasteText] = useState('');
  
  // State for Github Integration
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('logos_gh_repo') || '');
  const [githubBranch, setGithubBranch] = useState(() => localStorage.getItem('logos_gh_branch') || 'main');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('logos_gh_token') || '');
  const [githubPath, setGithubPath] = useState(() => localStorage.getItem('logos_gh_path') || 'content/episodes/01.json');
  const [githubStatus, setGithubStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Get active editing episode
  const activeEpisodeIndex = episodes.findIndex(ep => ep.id === selectedEpisodeId);
  const activeEpisode = activeEpisodeIndex !== -1 ? episodes[activeEpisodeIndex] : null;

  // Notification Banner State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copyFallbackData, setCopyFallbackData] = useState<{ title: string; text: string } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string, title: string, successMessage: string) => {
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, trying fallback", err);
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("legacy copy failed", err);
      }
    }

    if (success) {
      triggerNotification(successMessage);
    } else {
      setCopyFallbackData({ title, text });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'logos123') {
      setIsLoggedIn(true);
      setLoginError('');
      localStorage.setItem('logos_admin_logged_in', 'true');
      triggerNotification('Successfully authenticated as administrator');
    } else {
      setLoginError('Invalid Administrator Credential. Hint: "logos123"');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('logos_admin_logged_in');
  };

  const saveToState = (updatedEpisode: Episode) => {
    const updated = [...episodes];
    const index = updated.findIndex(ep => ep.id === updatedEpisode.id);
    if (index !== -1) {
      updated[index] = updatedEpisode;
    } else {
      updated.push(updatedEpisode);
    }
    onUpdateEpisodes(updated);
    triggerNotification('Episode changes saved successfully');
  };

  // 1. Meta Updates
  const handleMetaChange = (field: keyof Episode | 'title_profile' | 'desc_profile', profile?: StudyProfile, val?: string) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    if (field === 'title_profile' && profile && val !== undefined) {
      updated.title = { ...updated.title, [profile]: val };
    } else if (field === 'desc_profile' && profile && val !== undefined) {
      updated.description = { ...updated.description, [profile]: val };
    } else if (field === 'publish_date' && val !== undefined) {
      updated.publish_date = val;
    } else if (field === 'youtube_video_id' && val !== undefined) {
      updated.youtube_video_id = val;
    } else if (field === 'id' && val !== undefined) {
      updated.id = val;
      setSelectedEpisodeId(val);
    }
    saveToState(updated);
  };

  // Create empty new episode
  const createNewEpisode = () => {
    const nextId = String(episodes.length + 1).padStart(2, '0');
    const newEp: Episode = {
      id: nextId,
      title: {
        academic_en: `Episode ${nextId}: Custom Scholarly Dialogue`,
        esl_en: `Episode ${nextId}: Simple Overview`,
        translated_es: `Episodio ${nextId}: Diálogo Académico Personalizado`,
        translated_id: `Episode ${nextId}: Dialog Akademis Kustom`
      },
      description: {
        academic_en: "An advanced, teleological study module examining the relationship between scientific parameters and physical law.",
        esl_en: "A simple talk about why physics and chemistry have perfect rules for our world.",
        translated_es: "Un módulo de estudio teleológico avanzado que examina la relación entre los parámetros científicos y la ley física.",
        translated_id: "Modul studi teologis tingkat lanjut yang menyelidiki hubungan antara parameter ilmiah dan hukum fisika."
      },
      publish_date: new Date().toISOString().split('T')[0],
      youtube_video_id: "U2q0L6K77-w",
      audio_overview: {
        podcast_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        brief_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        podcast_url_by_profile: {
          academic_en: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          esl_en: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          translated_es: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
          translated_id: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
        },
        brief_url_by_profile: {
          academic_en: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          esl_en: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
          translated_es: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
          translated_id: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
        }
      },
      scenes: [],
      inspiring_quotations: [],
      study_modules: {
        mind_map: {
          academic_en: { label: "The Logos Divine Concept" },
          esl_en: { label: "God's Intelligence" },
          translated_es: { label: "El Logos Divino" },
          translated_id: { label: "Logos Ilahi" }
        },
        infographic: {
          academic_en: { title: "Cosmic Pillars", metrics: [], takeaways: [] },
          esl_en: { title: "Simple Takeaways", metrics: [], takeaways: [] },
          translated_es: { title: "Pilares Cósmicos", metrics: [], takeaways: [] },
          translated_id: { title: "Pilar Kosmis", metrics: [], takeaways: [] }
        },
        slide_decks: [],
        specialized_reports: {
          academic_en: { title: "Scholarly Report", body: "Scientific details go here." },
          esl_en: { title: "Simple Report", body: "Simple explanations go here." },
          translated_es: { title: "Informe Académico", body: "Detalles científicos van aquí." },
          translated_id: { title: "Laporan Akademis", body: "Detail ilmiah ditulis di sini." }
        },
        data_table: {
          headers: {
            academic_en: ["Constant", "Symbol", "Value", "Tolerance", "Implication"],
            esl_en: ["Constant", "Symbol", "Value", "Tolerance", "Implication"],
            translated_es: ["Constant", "Symbol", "Value", "Tolerance", "Implication"],
            translated_id: ["Constant", "Symbol", "Value", "Tolerance", "Implication"]
          },
          rows: []
        },
        creator_reflection: {
          academic_en: "Personal reflections from the creator regarding deep teleological frameworks.",
          esl_en: "A simple note from the host.",
          translated_es: "Reflexiones personales del creador sobre marcos teleológicos profundos.",
          translated_id: "Refleksi pribadi dari pembuat konten mengenai kerangka teologis yang mendalam."
        }
      }
    };

    const updated = [...episodes, newEp];
    onUpdateEpisodes(updated);
    setSelectedEpisodeId(newEp.id);
    triggerNotification(`Created Episode ${nextId}!`);
  };

  const deleteEpisode = (id: string) => {
    if (confirm(`Are you absolutely sure you want to delete Episode ${id}?`)) {
      const updated = episodes.filter(ep => ep.id !== id);
      onUpdateEpisodes(updated);
      if (selectedEpisodeId === id && updated.length > 0) {
        setSelectedEpisodeId(updated[0].id);
      }
      triggerNotification('Episode deleted successfully');
    }
  };

  // 2. Audio Overview Updates
  const handleAudioChange = (type: 'podcast' | 'brief', val: string, profile?: StudyProfile) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    
    if (profile) {
      if (type === 'podcast') {
        updated.audio_overview.podcast_url_by_profile = {
          ...updated.audio_overview.podcast_url_by_profile,
          [profile]: val
        };
      } else {
        updated.audio_overview.brief_url_by_profile = {
          ...updated.audio_overview.brief_url_by_profile,
          [profile]: val
        };
      }
    } else {
      if (type === 'podcast') {
        updated.audio_overview.podcast_url = val;
      } else {
        updated.audio_overview.brief_url = val;
      }
    }
    saveToState(updated);
  };

  // 2.5 GitHub Asset Updates (Reports, Quizzes, Slide Decks, Infographics)
  const handleGitHubAssetChange = (
    assetType: 'reports' | 'quizzes' | 'slide_decks' | 'infographics',
    val: string,
    profile?: StudyProfile
  ) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    
    if (!updated.study_modules) {
      updated.study_modules = {} as any;
    }
    if (!updated.study_modules.github_assets) {
      updated.study_modules.github_assets = {};
    }

    if (profile) {
      const fieldName = `${assetType}_by_profile` as const;
      if (!updated.study_modules.github_assets[fieldName]) {
        updated.study_modules.github_assets[fieldName] = {};
      }
      updated.study_modules.github_assets[fieldName] = {
        ...updated.study_modules.github_assets[fieldName],
        [profile]: val
      };
    } else {
      updated.study_modules.github_assets[assetType] = val;
    }
    saveToState(updated);
  };

  // 3. Single Source Updates
  const handleAddSource = () => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    const currentSources = updated.sources || [];
    const newSource: EpisodeSource = {
      title: "New Research Source / Scholarly Paper",
      description: "Brief overview of how this publication establishes scientific variables.",
      url: "https://arxiv.org"
    };
    updated.sources = [...currentSources, newSource];
    saveToState(updated);
  };

  const handleSourceChange = (index: number, field: keyof EpisodeSource, val: string) => {
    if (!activeEpisode || !activeEpisode.sources) return;
    const updated = { ...activeEpisode };
    const list = [...activeEpisode.sources];
    list[index] = { ...list[index], [field]: val };
    updated.sources = list;
    saveToState(updated);
  };

  const handleDeleteSource = (index: number) => {
    if (!activeEpisode || !activeEpisode.sources) return;
    const updated = { ...activeEpisode };
    updated.sources = activeEpisode.sources.filter((_, idx) => idx !== index);
    saveToState(updated);
  };

  // 4. Quotations Updates
  const handleAddQuotation = () => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    const newQuote: Quotation = {
      author: "New Scholar/Philosopher",
      historical_role: "Theologian or Scientist",
      quote_text: {
        academic_en: "Classic quote regarding the Logos order of the physical cosmos.",
        esl_en: "A simple quote about the order of nature.",
        translated_es: "Cita clásica sobre el orden del Logos del cosmos físico.",
        translated_id: "Kutipan klasik tentang keteraturan Logos di alam semesta fisik."
      }
    };
    updated.inspiring_quotations = [...updated.inspiring_quotations, newQuote];
    saveToState(updated);
  };

  const handleQuotationChange = (index: number, field: 'author' | 'historical_role' | 'quote_text', val: string, profile?: StudyProfile) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    const list = [...updated.inspiring_quotations];
    if (field === 'quote_text' && profile) {
      list[index] = {
        ...list[index],
        quote_text: {
          ...list[index].quote_text,
          [profile]: val
        }
      };
    } else if (field !== 'quote_text') {
      list[index] = { ...list[index], [field]: val };
    }
    updated.inspiring_quotations = list;
    saveToState(updated);
  };

  const handleDeleteQuotation = (index: number) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    updated.inspiring_quotations = updated.inspiring_quotations.filter((_, idx) => idx !== index);
    saveToState(updated);
  };

  // 5. Book Review & Inspiring Story Updates
  const handleBookReviewChange = (field: keyof BookReview, val: any, profile: StudyProfile, extraIndex?: number, extraField?: string) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    
    // Ensure book_review container exists
    if (!updated.study_modules.book_review) {
      updated.study_modules.book_review = {
        academic_en: { title: "", author: "", publish_year: "", rating: 5, overview: "", key_takeaways: [], scientific_theological_alignment: "", recommended_chapters: [] },
        esl_en: { title: "", author: "", publish_year: "", rating: 5, overview: "", key_takeaways: [], scientific_theological_alignment: "", recommended_chapters: [] },
        translated_es: { title: "", author: "", publish_year: "", rating: 5, overview: "", key_takeaways: [], scientific_theological_alignment: "", recommended_chapters: [] },
        translated_id: { title: "", author: "", publish_year: "", rating: 5, overview: "", key_takeaways: [], scientific_theological_alignment: "", recommended_chapters: [] }
      };
    }

    const currentReview = { ...updated.study_modules.book_review[profile] };

    if (field === 'key_takeaways') {
      currentReview.key_takeaways = val;
    } else if (field === 'recommended_chapters' && extraIndex !== undefined && extraField) {
      const chapters = [...currentReview.recommended_chapters];
      chapters[extraIndex] = { ...chapters[extraIndex], [extraField]: val };
      currentReview.recommended_chapters = chapters;
    } else if (field === 'recommended_chapters' && val === 'add') {
      currentReview.recommended_chapters = [...currentReview.recommended_chapters, { chapter: "Chapter name", description: "Review point" }];
    } else if (field === 'recommended_chapters' && typeof val === 'number') {
      // delete
      currentReview.recommended_chapters = currentReview.recommended_chapters.filter((_, idx) => idx !== val);
    } else {
      // @ts-ignore
      currentReview[field] = val;
    }

    updated.study_modules.book_review = {
      ...updated.study_modules.book_review,
      [profile]: currentReview
    };

    saveToState(updated);
  };

  const handleStoryChange = (profile: StudyProfile, val: string) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    updated.study_modules.inspiring_story = {
      ...updated.study_modules.inspiring_story,
      academic_en: updated.study_modules.inspiring_story?.academic_en || "",
      esl_en: updated.study_modules.inspiring_story?.esl_en || "",
      translated_es: updated.study_modules.inspiring_story?.translated_es || "",
      translated_id: updated.study_modules.inspiring_story?.translated_id || "",
      [profile]: val
    };
    saveToState(updated);
  };

  const handleReflectionChange = (profile: StudyProfile, val: string) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    updated.study_modules.creator_reflection = {
      ...updated.study_modules.creator_reflection,
      [profile]: val
    };
    saveToState(updated);
  };

  // 6. Custom Tab / New Section Addition
  const handleAddCustomSection = (label: string) => {
    if (!activeEpisode) return;
    const updated = { ...activeEpisode };
    const currentSections = updated.study_modules.custom_sections || [];
    const newSection: CustomSection = {
      id: `custom_${Date.now()}`,
      label,
      content: {
        academic_en: "Scholarly material for the custom tab goes here.",
        esl_en: "Simple explanations for the custom tab go here.",
        translated_es: "El material de estudio de la pestaña personalizada va aquí.",
        translated_id: "Konten studi kustom ditulis di sini."
      }
    };
    updated.study_modules.custom_sections = [...currentSections, newSection];
    saveToState(updated);
  };

  const handleCustomSectionContentChange = (id: string, profile: StudyProfile, val: string) => {
    if (!activeEpisode || !activeEpisode.study_modules.custom_sections) return;
    const updated = { ...activeEpisode };
    const list = activeEpisode.study_modules.custom_sections.map(sec => {
      if (sec.id === id) {
        return {
          ...sec,
          content: { ...sec.content, [profile]: val }
        };
      }
      return sec;
    });
    updated.study_modules.custom_sections = list;
    saveToState(updated);
  };

  const handleDeleteCustomSection = (id: string) => {
    if (!activeEpisode || !activeEpisode.study_modules.custom_sections) return;
    const updated = { ...activeEpisode };
    updated.study_modules.custom_sections = activeEpisode.study_modules.custom_sections.filter(sec => sec.id !== id);
    saveToState(updated);
  };

  // 7. GitHub Integration trigger
  const handleGitHubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepo || !githubToken) {
      setGithubStatus({ type: 'error', message: 'GitHub Repo and PAT Token are required.' });
      return;
    }

    setGithubStatus({ type: 'loading', message: 'Contacting GitHub API...' });

    // Store settings
    localStorage.setItem('logos_gh_repo', githubRepo);
    localStorage.setItem('logos_gh_branch', githubBranch);
    localStorage.setItem('logos_gh_token', githubToken);
    localStorage.setItem('logos_gh_path', githubPath);

    try {
      // 1. Get SHA of current file
      const getFileUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubPath}`;
      const response = await fetch(getFileUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (response.ok) {
        const fileData = await response.json();
        sha = fileData.sha;
      } else if (response.status !== 404) {
        throw new Error(`Failed to check file: ${response.statusText}`);
      }

      // 2. Format content of the consolidated json (for the active selected episode or full set)
      // Standard output of episodes:
      const updatedEpisodesJson = JSON.stringify(episodes, null, 2);

      // 3. Put File
      const putResponse = await fetch(getFileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Update episodes data from Logos-Explorer Admin Dashboard`,
          content: btoa(unescape(encodeURIComponent(updatedEpisodesJson))),
          sha: sha || undefined,
          branch: githubBranch
        })
      });

      if (!putResponse.ok) {
        const errDetails = await putResponse.json();
        throw new Error(errDetails.message || 'Error updating repository');
      }

      setGithubStatus({ 
        type: 'success', 
        message: `Successfully pushed updated episodes data to branch: "${githubBranch}"` 
      });
      triggerNotification('GitHub Repository updated successfully!');
    } catch (err: any) {
      console.error(err);
      setGithubStatus({ type: 'error', message: err.message || 'Connection or credential error' });
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(episodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "episodes.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('Consolidated episodes.json generated for download');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(episodes, null, 2));
    triggerNotification('Full episodes JSON copied to clipboard!');
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#040406]/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0b0b11] border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-900/60 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-950/50">
              <Lock size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold text-neutral-100">Logos Admin Console</h2>
            <p className="text-xs text-neutral-400">Please authenticate to configure the Logos-Explorer</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Security Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input
                  type="password"
                  placeholder="Enter administrator password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 text-xs font-mono">
                <AlertCircle size={14} className="text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
            >
              <Database size={15} />
              Unlock Console
            </button>
          </form>

          <div className="text-center">
            <p className="text-[10px] font-mono text-neutral-600">
              Default password: <span className="text-indigo-400">logos123</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#030305]/98 backdrop-blur-xl z-50 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-indigo-900 bg-[#09090f] text-indigo-200 text-xs font-mono shadow-2xl animate-fade-in">
          <Check size={14} className="text-indigo-400" />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="w-full max-w-6xl space-y-8 flex flex-col flex-grow">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-5 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded">
                Admin Console
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                PWA LocalStorage Engine
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-neutral-100 flex items-center gap-2.5">
              <Database className="text-indigo-400" size={24} />
              Logos-Explorer Studio Creator
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-mono transition-all"
            >
              Lock Console
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-all"
            >
              Close Panel
            </button>
          </div>
        </div>

        {/* Outer Layout Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start flex-grow">
          
          {/* Sidebar Left: Selection of Episodes & General App Actions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Visual Theme Selector Card */}
            <div className="bg-[#08080c] border border-neutral-800 rounded-xl p-4 space-y-4">
              <h3 className="font-serif text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <Palette size={14} className={
                  currentTheme === 'cosmic' ? 'text-indigo-400' :
                  currentTheme === 'emerald' ? 'text-emerald-400' :
                  currentTheme === 'amber' ? 'text-amber-400' :
                  currentTheme === 'vatican' ? 'text-yellow-400' : 'text-rose-400'
                } />
                Visual Interface Theme
              </h3>
              <div className="space-y-1.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onChangeTheme(theme.id);
                      triggerNotification(`Changed visual theme to "${theme.name}"`);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                      currentTheme === theme.id
                        ? (ACTIVE_THEME_HIGHLIGHTS[theme.id] || ACTIVE_THEME_HIGHLIGHTS.vatican)
                        : 'bg-neutral-950 border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-900'
                    }`}
                  >
                    <div className="font-bold">{theme.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{theme.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Episode List Box */}
            <div className="bg-[#08080c] border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Layers size={14} className="text-indigo-400" />
                  Episode Registry
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 border border-neutral-900 px-1.5 py-0.5 rounded">
                  {episodes.length} Total
                </span>
              </div>

              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {episodes.map((ep) => (
                  <div 
                    key={ep.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all border ${
                      selectedEpisodeId === ep.id
                        ? 'bg-indigo-950/20 border-indigo-900/60 text-indigo-300'
                        : 'bg-neutral-950 border-transparent hover:bg-neutral-900/40 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedEpisodeId(ep.id)}
                      className="text-left flex-grow text-xs truncate font-mono mr-2"
                    >
                      EP {ep.id}: {ep.title.academic_en.split(':')[1]?.trim() || ep.title.academic_en}
                    </button>
                    <button
                      onClick={() => deleteEpisode(ep.id)}
                      disabled={episodes.length <= 1}
                      className="text-neutral-600 hover:text-red-400 disabled:opacity-30 p-1"
                      title="Delete Episode"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={createNewEpisode}
                className="w-full py-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-indigo-950 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                Create New Episode
              </button>
            </div>

            {/* Quick backup / export tools */}
            <div className="bg-[#08080c] border border-neutral-800 rounded-xl p-4 space-y-3">
              <h3 className="font-serif text-sm font-semibold text-neutral-200">
                Data Utilities
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleExportJSON}
                  className="w-full py-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-[11px] font-mono text-neutral-300 rounded-lg hover:text-white transition-colors"
                >
                  Generate & Download JSON
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="w-full py-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-[11px] font-mono text-neutral-300 rounded-lg hover:text-white transition-colors"
                >
                  Copy JSON to Clipboard
                </button>
                <button
                  onClick={onResetEpisodes}
                  className="w-full py-2 bg-red-950/10 border border-red-900/30 hover:bg-red-950/20 text-[11px] font-mono text-red-300 rounded-lg transition-colors"
                >
                  Reset Cache to Default
                </button>
              </div>
            </div>

          </div>

          {/* Main Content Area Right: The editor and sub tabs */}
          <div className="lg:col-span-3 space-y-6">
            
            {activeEpisode ? (
              <div className="bg-[#08080c] border border-neutral-800 rounded-2xl p-6 space-y-6">
                
                {/* Active Episode Indicator banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">Currently Modifying:</span>
                    <h2 className="font-serif text-lg font-bold text-neutral-100 flex items-center gap-2">
                      <BookOpen className="text-indigo-400" size={16} />
                      Episode {activeEpisode.id} Study Module
                    </h2>
                  </div>
                  
                  {/* Local state save indicator */}
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono bg-emerald-950/20 border border-emerald-900/40 px-3 py-1 rounded-lg">
                    <Check size={14} />
                    <span>Auto-Saved to Live Workspace</span>
                  </div>
                </div>

                {/* Main Tab bar for the selected Episode's configuration */}
                <div className="flex flex-wrap items-center border-b border-neutral-800 pb-px gap-1">
                  <button
                    onClick={() => setActiveSubTab('meta')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'meta'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Settings size={12} />
                    Metadata
                  </button>
                  <button
                    onClick={() => setActiveSubTab('notebook')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'notebook'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Music size={12} />
                    NotebookLM Materials
                  </button>
                  <button
                    onClick={() => setActiveSubTab('sources')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'sources'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Database size={12} />
                    Sources Used
                  </button>
                  <button
                    onClick={() => setActiveSubTab('quotes')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'quotes'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Sparkles size={12} />
                    Quotations
                  </button>
                  <button
                    onClick={() => setActiveSubTab('book_story')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'book_story'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <FileText size={12} />
                    Reviews, Stories & Reflections
                  </button>
                  <button
                    onClick={() => setActiveSubTab('excel_import')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'excel_import'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Table size={12} />
                    Excel/NotebookLM Importer
                  </button>
                  <button
                    onClick={() => setActiveSubTab('new_section')}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeSubTab === 'new_section'
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10 font-bold'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <Plus size={12} />
                    Add Custom Section
                  </button>
                </div>

                {/* Sub Tab Panel Router */}
                <div className="space-y-6 pt-3 min-h-[400px]">
                  
                  {/* TAB 1: METADATA & PROFILE-SPECIFIC NAMES/DESCRIPTIONS */}
                  {activeSubTab === 'meta' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-neutral-400">Episode ID</label>
                          <input
                            type="text"
                            value={activeEpisode.id}
                            onChange={(e) => handleMetaChange('id', undefined, e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-neutral-400">Publish Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                            <input
                              type="date"
                              value={activeEpisode.publish_date}
                              onChange={(e) => handleMetaChange('publish_date', undefined, e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-neutral-400">YouTube Video ID</label>
                          <div className="relative">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                            <input
                              type="text"
                              value={activeEpisode.youtube_video_id}
                              onChange={(e) => handleMetaChange('youtube_video_id', undefined, e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multi-Profile Titles & Descriptions */}
                      <div className="space-y-4 pt-4 border-t border-neutral-900">
                        <h4 className="font-serif text-sm font-semibold text-neutral-200">Localized Title & Description Definitions</h4>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-mono">
                          Logos-Explorer requires distinct, high-fidelity titles and summaries for each target user demographic.
                        </p>
                        
                        {(['esl_en', 'academic_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((prof) => (
                          <div key={prof} className="p-4 rounded-xl border border-neutral-900 bg-[#060609] space-y-3">
                            <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">
                              {prof === 'academic_en' && 'Academic Profile (English)'}
                              {prof === 'esl_en' && 'Simplified Profile (English)'}
                              {prof === 'translated_es' && 'Español (Spanish Translation)'}
                              {prof === 'translated_id' && 'Indonesian Translation'}
                            </span>
                            
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase">Interactive Title</label>
                              <input
                                type="text"
                                value={activeEpisode.title[prof] || ''}
                                onChange={(e) => handleMetaChange('title_profile', prof, e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase">Brief Abstract</label>
                              <textarea
                                value={activeEpisode.description[prof] || ''}
                                onChange={(e) => handleMetaChange('desc_profile', prof, e.target.value)}
                                rows={2}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* TAB 2: NOTEBOOKLM MATERIALS (Audio, Data Table, etc.) */}
                  {activeSubTab === 'notebook' && (
                    <div className="space-y-6">
                      {/* NotebookLM Studio Guide Card */}
                      <div className="p-4 rounded-xl border border-indigo-950 bg-gradient-to-tr from-indigo-950/20 via-[#0a0a0f] to-neutral-950 space-y-2">
                        <h4 className="font-serif text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-indigo-400" />
                          NotebookLM Studio Content Input Guide
                        </h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          Manage outputs generated by your NotebookLM Studio pipeline easily:
                        </p>
                        <ul className="text-[10px] text-neutral-500 font-mono space-y-1 list-disc pl-4 leading-relaxed">
                          <li><strong className="text-indigo-400">Heavy Media</strong> (Audio Overviews, Short Video Overview): Specify <span className="text-neutral-300">Vercel Blob Hyperlinks</span> (direct HTTPS mp3/mp4 links).</li>
                          <li><strong className="text-indigo-400">GitHub Assets</strong> (Specialized Reports, Quizzes, Slide Decks, Infographics): Specify <span className="text-neutral-300">GitHub Repository Hyperlinks</span> to locate raw or interactive assets.</li>
                          <li><strong className="text-indigo-400">Other Non-NotebookLM Content</strong> (Citations & Reflections): Use the dedicated <span className="text-indigo-300 underline cursor-pointer" onClick={() => setActiveSubTab('quotes')}>Quotations</span> and <span className="text-indigo-300 underline cursor-pointer" onClick={() => setActiveSubTab('book_story')}>Reviews/Reflections</span> tabs above!</li>
                        </ul>
                      </div>

                      {/* Heavy Media: Audio Overview Section */}
                      <div className="bg-[#060609] border border-neutral-900 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music size={16} className="text-indigo-400" />
                            <h4 className="font-serif text-sm font-semibold text-neutral-200">Audio Overviews (Vercel Blob Hyperlinks)</h4>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-850">Heavy Media Asset</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-mono">
                          Specify direct .mp3 Vercel Blob URLs for full podcast dialogues and summarized briefings. Profile-specific overrides are supported.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase">Default Audio Podcast URL (Vercel Blob)</label>
                            <input
                              type="text"
                              placeholder="https://xxx.public.blob.vercel-storage.com/podcast.mp3"
                              value={activeEpisode.audio_overview?.podcast_url || ''}
                              onChange={(e) => handleAudioChange('podcast', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase">Default Summary Briefing URL (Vercel Blob)</label>
                            <input
                              type="text"
                              placeholder="https://xxx.public.blob.vercel-storage.com/briefing.mp3"
                              value={activeEpisode.audio_overview?.brief_url || ''}
                              onChange={(e) => handleAudioChange('brief', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Profiles Override Links */}
                        <div className="space-y-3 pt-3 border-t border-neutral-900">
                          <h5 className="text-[10px] font-mono text-neutral-400 uppercase">Demographic Audio Overrides (Vercel Blob)</h5>
                          {(['esl_en', 'academic_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                            <div key={p} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <input
                                type="text"
                                placeholder={`Podcast override URL for ${p}...`}
                                value={activeEpisode.audio_overview?.podcast_url_by_profile?.[p] || ''}
                                onChange={(e) => handleAudioChange('podcast', e.target.value, p)}
                                className="bg-neutral-950 border border-neutral-900 rounded-lg px-2.5 py-1 text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                placeholder={`Brief override URL for ${p}...`}
                                value={activeEpisode.audio_overview?.brief_url_by_profile?.[p] || ''}
                                onChange={(e) => handleAudioChange('brief', e.target.value, p)}
                                className="bg-neutral-950 border border-neutral-900 rounded-lg px-2.5 py-1 text-[11px] text-neutral-300 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Heavy Media: Short Video Overview Section */}
                      <div className="bg-[#060609] border border-neutral-900 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video size={16} className="text-indigo-400" />
                            <h4 className="font-serif text-sm font-semibold text-neutral-200">Short Video Overviews (Vercel Blob Hyperlinks)</h4>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-850">Heavy Media Asset</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-mono">
                          Specify Vercel Blob URL coordinates for the short video overview (e.g., .mp4 format) and define localized metadata.
                        </p>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-neutral-400 uppercase">Video Asset URL (Vercel Blob)</label>
                            <input
                              type="text"
                              placeholder="https://xxx.public.blob.vercel-storage.com/short_video.mp4"
                              value={activeEpisode.short_video_overview?.video_url || ''}
                              onChange={(e) => {
                                const updated = { ...activeEpisode };
                                if (!updated.short_video_overview) {
                                  updated.short_video_overview = { video_url: '' };
                                }
                                updated.short_video_overview.video_url = e.target.value;
                                saveToState(updated);
                              }}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase block border-b border-neutral-900 pb-1">Localized Titles</label>
                              {(['esl_en', 'academic_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                                <div key={p} className="flex gap-2 items-center text-xs">
                                  <span className="w-24 text-[9px] font-mono text-neutral-500 shrink-0 uppercase">
                                    {p === 'academic_en' && 'Acad EN:'}
                                    {p === 'esl_en' && 'Simp EN:'}
                                    {p === 'translated_es' && 'Español:'}
                                    {p === 'translated_id' && 'Indo ID:'}
                                  </span>
                                  <input
                                    type="text"
                                    value={activeEpisode.short_video_overview?.title?.[p] || ''}
                                    onChange={(e) => {
                                      const updated = { ...activeEpisode };
                                      if (!updated.short_video_overview) {
                                        updated.short_video_overview = { video_url: '' };
                                      }
                                      updated.short_video_overview.title = {
                                        ...updated.short_video_overview.title,
                                        [p]: e.target.value
                                      };
                                      saveToState(updated);
                                    }}
                                    placeholder="Title..."
                                    className="w-full bg-neutral-950 border border-neutral-900 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase block border-b border-neutral-900 pb-1">Localized Descriptions</label>
                              {(['esl_en', 'academic_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                                <div key={p} className="flex gap-2 items-center text-xs">
                                  <span className="w-24 text-[9px] font-mono text-neutral-500 shrink-0 uppercase">
                                    {p === 'academic_en' && 'Acad EN:'}
                                    {p === 'esl_en' && 'Simp EN:'}
                                    {p === 'translated_es' && 'Español:'}
                                    {p === 'translated_id' && 'Indo ID:'}
                                  </span>
                                  <input
                                    type="text"
                                    value={activeEpisode.short_video_overview?.description?.[p] || ''}
                                    onChange={(e) => {
                                      const updated = { ...activeEpisode };
                                      if (!updated.short_video_overview) {
                                        updated.short_video_overview = { video_url: '' };
                                      }
                                      updated.short_video_overview.description = {
                                        ...updated.short_video_overview.description,
                                        [p]: e.target.value
                                      };
                                      saveToState(updated);
                                    }}
                                    placeholder="Description..."
                                    className="w-full bg-neutral-950 border border-neutral-900 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* GitHub Hosted Assets (Reports, Quizzes, Slide Decks, Infographics) */}
                      <div className="bg-[#060609] border border-neutral-900 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Github size={16} className="text-indigo-400" />
                            <h4 className="font-serif text-sm font-semibold text-neutral-200">GitHub Repository Assets (Reports, Quizzes, Slide Decks, Infographics)</h4>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-850">Code Repo Assets</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed font-mono">
                          Specify standard GitHub hyperlinks or file URLs for your study assets. Enter default URLs or demographic profile overrides for precise routing.
                        </p>

                        <div className="space-y-4">
                          {(['reports', 'quizzes', 'slide_decks', 'infographics'] as const).map((assetKey) => {
                            const assetLabel = assetKey === 'reports' ? 'Specialized Reports' :
                                               assetKey === 'quizzes' ? 'Interactive Quizzes' :
                                               assetKey === 'slide_decks' ? 'Slide Decks' : 'Infographics';
                            
                            const defaultVal = activeEpisode.study_modules?.github_assets?.[assetKey] || '';
                            
                            return (
                              <div key={assetKey} className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-mono font-bold text-indigo-300 uppercase">{assetLabel} GitHub URL</label>
                                  <span className="text-[9px] font-mono text-neutral-500">Default Hyperlink</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder={`https://github.com/username/repo/blob/main/content/${assetKey}/ep_${activeEpisode.id}.md`}
                                  value={defaultVal}
                                  onChange={(e) => handleGitHubAssetChange(assetKey, e.target.value)}
                                  className="w-full bg-[#0c0c12] border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                                />

                                {/* Demographic Overrides */}
                                <div className="space-y-2 pt-2 border-t border-neutral-900">
                                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">Demographic Localized Overrides</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {(['esl_en', 'academic_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => {
                                      const profileOverride = activeEpisode.study_modules?.github_assets?.[`${assetKey}_by_profile` as const]?.[p] || '';
                                      return (
                                        <div key={p} className="flex items-center gap-1.5">
                                          <span className="w-16 text-[9px] font-mono text-neutral-500 uppercase shrink-0">
                                            {p === 'academic_en' ? 'Acad EN:' : p === 'esl_en' ? 'Simp EN:' : p === 'translated_es' ? 'Español:' : 'Indo ID:'}
                                          </span>
                                          <input
                                            type="text"
                                            placeholder={`Override link for ${p}...`}
                                            value={profileOverride}
                                            onChange={(e) => handleGitHubAssetChange(assetKey, e.target.value, p)}
                                            className="w-full bg-[#0c0c12] border border-neutral-900 rounded px-2 py-1 text-[10px] text-neutral-300 font-mono focus:outline-none focus:border-indigo-500"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mind Map, Slides, Infographics, etc. */}
                      <div className="p-4 rounded-xl border border-neutral-900 bg-[#060609] space-y-4">
                        <div className="flex items-center gap-2">
                          <Table size={16} className="text-indigo-400" />
                          <h4 className="font-serif text-sm font-semibold text-neutral-200">Physical Constants Data Table</h4>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                          Verify data points representing fine-tuning properties. Click "Add Custom Section" to build bespoke modules if you want to configure slide structure or custom visuals.
                        </p>
                        
                        <div className="border border-neutral-850 rounded-lg overflow-hidden bg-neutral-950">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#0c0c12] border-b border-neutral-850 text-neutral-400 uppercase font-mono tracking-wider">
                              <tr>
                                <th className="p-2">Constant</th>
                                <th className="p-2">Symbol</th>
                                <th className="p-2">Precision Value</th>
                                <th className="p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeEpisode.study_modules.data_table?.rows.map((row, idx) => (
                                <tr key={idx} className="border-b border-neutral-900 text-neutral-300 font-mono">
                                  <td className="p-2 truncate max-w-[120px]">{row.constant.academic_en}</td>
                                  <td className="p-2">{row.symbol}</td>
                                  <td className="p-2">{row.value}</td>
                                  <td className="p-2">
                                    <button 
                                      onClick={() => {
                                        const updated = { ...activeEpisode };
                                        updated.study_modules.data_table.rows = updated.study_modules.data_table.rows.filter((_, i) => i !== idx);
                                        saveToState(updated);
                                      }}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {(!activeEpisode.study_modules.data_table?.rows || activeEpisode.study_modules.data_table.rows.length === 0) && (
                                <tr>
                                  <td colSpan={4} className="p-3 text-center text-neutral-600">No rows configured. Use "Reset Cache" to inspect pre-seeded values.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={() => {
                            const updated = { ...activeEpisode };
                            const newRow = {
                              constant: { academic_en: "Cosmological Constant", esl_en: "Space Speed", translated_es: "Constante", translated_id: "Konstanta" },
                              symbol: "Λ",
                              value: "10^-120",
                              tolerance: { academic_en: "1 in 10^120", esl_en: "Very narrow", translated_es: "1 en 10^120", translated_id: "1 di 10^120" },
                              implication: { academic_en: "Expansion speeds", esl_en: "Perfect stars", translated_es: "Estrellas perfectas", translated_id: "Bintang sempurna" }
                            };
                            updated.study_modules.data_table.rows = [...(updated.study_modules.data_table.rows || []), newRow];
                            saveToState(updated);
                          }}
                          className="px-3 py-1.5 rounded bg-indigo-950/40 border border-indigo-900/40 hover:bg-indigo-900/40 text-[10px] font-mono font-bold text-indigo-300"
                        >
                          + Seed Mock Tuning Row
                        </button>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: SOURCES USED */}
                  {activeSubTab === 'sources' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-semibold text-neutral-200">Literature & Scholarly Sources Utilized</h4>
                        <button
                          onClick={handleAddSource}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Source
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                        Expose the real publications, books, or database URLs backing the theological or astrophysical claims in this episode.
                      </p>

                      <div className="space-y-4">
                        {(activeEpisode.sources || []).map((source, index) => (
                          <div key={index} className="p-4 rounded-xl border border-neutral-900 bg-[#060609] space-y-3 relative group">
                            <button
                              onClick={() => handleDeleteSource(index)}
                              className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 transition-colors"
                              title="Delete Source"
                            >
                              <Trash2 size={14} />
                            </button>
                            <span className="text-[10px] font-mono text-indigo-400 font-bold">SOURCE 0{index + 1}</span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-neutral-500 uppercase">Source Title</label>
                                <input
                                  type="text"
                                  value={source.title}
                                  onChange={(e) => handleSourceChange(index, 'title', e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-850 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-neutral-500 uppercase">Target URI Link</label>
                                <input
                                  type="text"
                                  value={source.url}
                                  onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-850 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase">Scientific Context Description</label>
                              <textarea
                                value={source.description}
                                onChange={(e) => handleSourceChange(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full bg-neutral-950 border border-neutral-850 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                              />
                            </div>
                          </div>
                        ))}

                        {(!activeEpisode.sources || activeEpisode.sources.length === 0) && (
                          <div className="text-center py-12 bg-neutral-950/20 border border-dashed border-neutral-900 rounded-xl">
                            <Database size={24} className="mx-auto text-neutral-700 mb-2 stroke-1" />
                            <p className="text-xs text-neutral-500">No external scholarly references documented for this module.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: QUOTATIONS */}
                  {activeSubTab === 'quotes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-semibold text-neutral-200">Inspiring Historical Quotations</h4>
                        <button
                          onClick={handleAddQuotation}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Quote
                        </button>
                      </div>

                      <div className="space-y-6">
                        {activeEpisode.inspiring_quotations.map((quote, index) => (
                          <div key={index} className="p-4 rounded-xl border border-neutral-900 bg-[#060609] space-y-4 relative">
                            <button
                              onClick={() => handleDeleteQuotation(index)}
                              className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 transition-colors"
                              title="Delete Quotation"
                            >
                              <Trash2 size={14} />
                            </button>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">HISTORICAL QUOTE 0{index + 1}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-neutral-500 uppercase">Author Name</label>
                                <input
                                  type="text"
                                  value={quote.author}
                                  onChange={(e) => handleQuotationChange(index, 'author', e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-neutral-500 uppercase">Historical Role / Academic Status</label>
                                <input
                                  type="text"
                                  value={quote.historical_role}
                                  onChange={(e) => handleQuotationChange(index, 'historical_role', e.target.value)}
                                  className="w-full bg-neutral-950 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-neutral-900">
                              <label className="text-[9px] font-mono text-neutral-500 uppercase block">Localized Translation Blocks</label>
                              {(['academic_en', 'esl_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                                <div key={p} className="flex gap-2 items-center text-xs">
                                  <span className="w-24 text-[9px] font-mono text-neutral-500 shrink-0 uppercase">{p}:</span>
                                  <input
                                    type="text"
                                    value={quote.quote_text[p] || ''}
                                    onChange={(e) => handleQuotationChange(index, 'quote_text', e.target.value, p)}
                                    placeholder={`Quote text in ${p}...`}
                                    className="w-full bg-neutral-950 border border-neutral-900 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {activeEpisode.inspiring_quotations.length === 0 && (
                          <div className="text-center py-12 bg-neutral-950/20 border border-dashed border-neutral-900 rounded-xl">
                            <Sparkles size={24} className="mx-auto text-neutral-700 mb-2 stroke-1" />
                            <p className="text-xs text-neutral-500">No quotes added yet. Create inspiring citations for this module.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: REVIEWS, STORIES & REFLECTIONS */}
                  {activeSubTab === 'book_story' && (
                    <div className="space-y-8">
                      
                      {/* Inspiring Story Section */}
                      <div className="p-5 rounded-xl border border-neutral-900 bg-[#060609] space-y-4">
                        <h4 className="font-serif text-sm font-semibold text-indigo-300 flex items-center gap-2">
                          <Sparkles size={14} />
                          Featured Inspiring Story (Philosophical Narrative)
                        </h4>
                        <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                          Add a beautiful, narrative-driven story emphasizing the connection of physical laws to faith and divine logic.
                        </p>

                        <div className="space-y-4">
                          {(['academic_en', 'esl_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                            <div key={p} className="space-y-1.5">
                              <label className="text-[10px] font-mono text-neutral-400 uppercase">
                                Narrative Block [{p.toUpperCase()}]
                              </label>
                              <textarea
                                value={activeEpisode.study_modules.inspiring_story?.[p] || ''}
                                onChange={(e) => handleStoryChange(p, e.target.value)}
                                rows={3}
                                placeholder="Once upon a time, a cosmologist looked at the fine-tuned constant..."
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Creator Reflection Area */}
                      <div className="p-5 rounded-xl border border-neutral-900 bg-[#060609] space-y-4">
                        <h4 className="font-serif text-sm font-semibold text-indigo-300 flex items-center gap-2">
                          <FileText size={14} />
                          Host / Creator Theological Reflection Notes
                        </h4>
                        <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                          The creator reflection panel is always visible at the base of the episode, offering core takeaways.
                        </p>

                        <div className="space-y-4">
                          {(['academic_en', 'esl_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                            <div key={p} className="space-y-1.5">
                              <label className="text-[10px] font-mono text-neutral-400 uppercase">
                                Reflection Outline [{p.toUpperCase()}]
                              </label>
                              <textarea
                                value={activeEpisode.study_modules.creator_reflection[p] || ''}
                                onChange={(e) => handleReflectionChange(p, e.target.value)}
                                rows={3}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Book Review Form */}
                      <div className="p-5 rounded-xl border border-neutral-900 bg-[#060609] space-y-4">
                        <h4 className="font-serif text-sm font-semibold text-indigo-300 flex items-center gap-2">
                          <BookOpen size={14} />
                          Selected Literature Review (Bridging Science and Creation)
                        </h4>
                        
                        {(['academic_en', 'esl_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => {
                          const review = activeEpisode.study_modules.book_review?.[p] || { title: "", author: "", publish_year: "", rating: 5, overview: "", key_takeaways: [], scientific_theological_alignment: "", recommended_chapters: [] };
                          return (
                            <div key={p} className="p-4 rounded-lg bg-neutral-950 border border-neutral-900 space-y-3">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Book Review [{p}]</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  placeholder="Book Title"
                                  value={review.title || ''}
                                  onChange={(e) => handleBookReviewChange('title', e.target.value, p)}
                                  className="bg-[#0c0c12] border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Author"
                                  value={review.author || ''}
                                  onChange={(e) => handleBookReviewChange('author', e.target.value, p)}
                                  className="bg-[#0c0c12] border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Year"
                                  value={review.publish_year || ''}
                                  onChange={(e) => handleBookReviewChange('publish_year', e.target.value, p)}
                                  className="bg-[#0c0c12] border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200"
                                />
                                <select
                                  value={review.rating || 5}
                                  onChange={(e) => handleBookReviewChange('rating', Number(e.target.value), p)}
                                  className="bg-[#0c0c12] border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300"
                                >
                                  <option value={5}>5 Stars</option>
                                  <option value={4}>4 Stars</option>
                                  <option value={3}>3 Stars</option>
                                </select>
                              </div>
                              <textarea
                                placeholder="Summary overview of the text's thesis..."
                                value={review.overview || ''}
                                onChange={(e) => handleBookReviewChange('overview', e.target.value, p)}
                                rows={2}
                                className="w-full bg-[#0c0c12] border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                  {/* TAB: EXCEL / NOTEBOOKLM DIRECT TSV BULK IMPORTER */}
                  {activeSubTab === 'excel_import' && (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl border border-indigo-900/30 bg-indigo-950/10 space-y-4">
                        <div className="flex items-center gap-2">
                          <Table className="text-indigo-400" size={18} />
                          <h4 className="font-serif text-base font-bold text-neutral-100">Direct Excel/Google Sheets Bulk Importer</h4>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          To completely skip building complex Airtable databases, manage each episode directly using a single flat spreadsheet! 
                          Each row represents a content element, and columns define the four demographic profiles. 
                          Copy a range of cells from **Excel or Google Sheets** and paste them directly below—the app parses and deploys them to your live workspace instantly.
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1.5">
                          <button
                            onClick={() => {
                              const header = "Row Identifier\tField or Index\tAcademic (EN)\tSimplified (EN)\tEspañol (ES)\tIndonesian\n";
                              const rows = [
                                "EPISODE_META\tid\t01\t\t\t",
                                "EPISODE_META\tpublish_date\t2026-06-25\t\t\t",
                                "EPISODE_META\tyoutube_video_id\tU2q0L6K77-w\t\t\t",
                                "EPISODE_META\ttitle\tEpisode 01: Cosmic Fine-Tuning\tEpisode 01: Setup of Space\tEpisodio 01: El Ajuste\tEpisode 01: Penyelarasan",
                                "EPISODE_META\tdescription\tAn academic analysis...\tHow the world was made...\tUna investigación...\tAnalisis akademis...",
                                "EPISODE_AUDIO\tpodcast_url\thttps://example.com/podcast.mp3\t\t\t",
                                "EPISODE_AUDIO\tbrief_url\thttps://example.com/brief.mp3\t\t\t",
                                "SCENE_TIME\t0\t0\t\t\t",
                                "SCENE_TITLE\t0\tIntroduction\tIntroduction\tIntroducción\tPendahuluan",
                                "SCENE_DESC\t0\tIntroduction to Fine Tuning\tStarting the video...\tIntroducción...\tPendahuluan...",
                                "QUOTE_AUTHOR\t0\tDr. Roger Penrose\t\t\t",
                                "QUOTE_ROLE\t0\tMathematical Physicist\t\t\t",
                                "QUOTE_TEXT\t0\tThe precision is amazing...\tThe numbers are perfect...\tLa precisión es increíble...\tPresisinya luar biasa...",
                                "MINDMAP_ROOT\t\tThe Fine-Tuning Paradox\tThe Perfect Setup\tParadoja del Ajuste\tParadoks Penyelarasan",
                                "MINDMAP_BRANCH\t0\tThermodynamics\tHow Space Started\tTermodinámica\tTermodinamika",
                                "MINDMAP_LEAVES\t0\tLow Entropy;Arrow of Time\tVery clean start;Time moves forward\tBaja entropía;Flecha del tiempo\tEntropi rendah;Panah waktu",
                                "INFOGRAPHIC_TITLE\t\tCosmic Pillars\tSimple Metrics\tPilares Cósmicos\tPilar Kosmis",
                                "INFOGRAPHIC_METRIC_LABEL\t0\tEntropy\tCleanliness\tEntropía\tEntropi",
                                "INFOGRAPHIC_METRIC_VALUE\t0\t1 in 10^10^123\t1 in 10^10^123\t1 en 10^10^123\t1 berbanding 10^10^123",
                                "INFOGRAPHIC_METRIC_SUB\t0\tPenrose Limit\tAlmost impossible\tLímite de Penrose\tBatas Penrose",
                                "INFOGRAPHIC_TAKEAWAY\t\tLow initial entropy\tThe space started clean\tBaja entropía inicial\tEntropi awal yang rendah",
                                "REPORT_TITLE\t\tAstrophysical Report\tSimple Summary\tInforme Astrofísico\tLaporan Astrofisika",
                                "REPORT_BODY\t\tPenrose discusses initial entropy...\tSpace started neat and clean.\tPenrose analiza la entropía...\tPenrose membahas entropi...",
                                "BOOK_TITLE\t\tA Fine-Tuned Universe\tA Fine-Tuned Universe\tUn Universo Ajustado\tA Fine-Tuned Universe",
                                "BOOK_AUTHOR\t\tAlister E. McGrath\tAlister E. McGrath\tAlister E. McGrath\tAlister E. McGrath",
                                "BOOK_YEAR\t\t2009\t2009\t2009\t2009",
                                "BOOK_RATING\t\t5\t5\t5\t5",
                                "BOOK_OVERVIEW\t\tA masterwork on theology...\tA great book about space...\tUna obra maestra...\tSebuah karya luar biasa...",
                                "BOOK_TAKEAWAYS\t\tConcept of design;Anthropic Principle\tNumbers are perfect;God is an artist\tConcepto de diseño;Principio antrópico\tKonsep desain;Prinsip antropik",
                                "BOOK_ALIGNMENT\t\tAligns science and faith.\tAligns space and God.\tAlinea ciencia y fe.\tMenyelaraskan sains dan iman.",
                                "CREATOR_REFLECTION\t\tThinking God's thoughts after Him.\tScience shows how God thinks.\tPensando los pensamientos de Dios.\tMemikirkan pikiran Tuhan.",
                                "INSPIRING_STORY\t\tA cosmologist looked up...\tA kid looked up at the stars...\tUn cosmólogo miró...\tSeorang kosmolog melihat...",
                                "EXECUTIVE_SUMMARY\t\tThe entropy calculation is low;Parameters have narrow thresholds\tThe universe started clean;The rules of nature are set perfect\tLa entropía es baja;Los parámetros son estrechos\tEntropi sangat rendah;Parameter sangat sempit"
                              ];
                              const fullText = header + rows.join("\n");
                              copyToClipboard(fullText, "Empty Excel Template", "Excel template structure copied! Paste into Excel / Sheets.");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[10px] font-mono text-indigo-300 transition-colors"
                          >
                            📋 Copy Empty Excel Template
                          </button>

                          <button
                            onClick={() => {
                              const sampleText = `Row Identifier\tField or Index\tAcademic (EN)\tSimplified (EN)\tEspañol (ES)\tIndonesian
EPISODE_META\tid\t01
EPISODE_META\tpublish_date\t2026-06-25
EPISODE_META\tyoutube_video_id\tU2q0L6K77-w
EPISODE_META\ttitle\tEpisode 01: Cosmic Fine-Tuning\tEpisode 01: Why the Universe is Perfect\tEpisodio 01: El Ajuste Fino Cósmico\tEpisode 01: Penyelarasan Kosmik
EPISODE_META\tdescription\tAn exhaustive investigation...\tIn this video, we look at why...\tUna investigación exhaustiva...\tPenyelidikan mendalam terhadap...
EPISODE_AUDIO\tpodcast_url\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3
EPISODE_AUDIO\tbrief_url\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3\thttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3
SCENE_TIME\t0\t0
SCENE_TITLE\t0\tIntroduction: The Convergence of Physics and Metaphysics\tIntroduction: Connecting Science and Faith\tIntroducción: La Convergencia de la Física y la Metafísica\tPendahuluan: Pertemuan Fisika dan Metafisika
SCENE_DESC\t0\tSetting the stage for the dialogue...\tWe start the video. We talk about...\tSentando las bases para el diálogo...\tMempersiapkan panggung untuk dialog...
SCENE_TIME\t1\t320
SCENE_TITLE\t1\tThe Second Law of Thermodynamics and Cosmic Entropy\tThe Law of Mess (Entropy) in Space\tLa Segunda Ley de la Termodinámica y la Entropía Cósmica\tHukum Kedua Termodinamika dan Entropi Kosmik
SCENE_DESC\t1\tAnalyzing Roger Penrose's calculation...\tWe discuss how things in the universe...\tAnalizando el cálculo de Roger Penrose...\tMenganalisis kalkulasi Roger Penrose...
SCENE_TIME\t2\t780
SCENE_TITLE\t2\tThe Anthropic Coincidences and Fundamental Constants\tThe Perfect Numbers of Nature\tLas Coincidencias Antrópicas y Constantes Fundamentales\tKebetulan Antropik dan Konstanta Fundamental
SCENE_DESC\t2\tA close-up examination...\tWe look at the special numbers...\tUn examen detallado...\tPemeriksaan mendalam terhadap...
QUOTE_AUTHOR\t0\tDr. Roger Penrose
QUOTE_ROLE\t0\tNobel Laureate in Physics
QUOTE_TEXT\t0\tThis now tells us how extraordinarily precise...\tThe universe started with amazing precision...\tEsto nos dice cuán extraordinariamente precisa...\tIni menunjukkan kepada kita betapa luar biasa...
QUOTE_AUTHOR\t1\tDr. Francis Collins
QUOTE_ROLE\t1\tGeneticist & Director of NIH
QUOTE_TEXT\t1\tWhen something is fine-tuned to one part...\tWhen numbers in nature are perfect...\tCuando algo está ajustado con precisión...\tKetika sesuatu diselaraskan hingga satu...
MINDMAP_ROOT\t\tThe Fine-Tuning Paradox\tThe Perfect Setup for Life\tParadoja del Ajuste Fino\tParadoks Penyelarasan Kosmik
MINDMAP_BRANCH\t0\tThermodynamics\tHow Space Started\tTermodinámica\tTermodinamika
MINDMAP_LEAVES\t0\tLow Entropy State at Big Bang;Arrow of Time (Second Law)\tVery clean start;Time flows forward\tBaja entropía inicial;Flecha del tiempo\tKeadaan entropi rendah;Panah waktu
MINDMAP_BRANCH\t1\tCosmological Constants\tThe Perfect Numbers\tConstantes Cosmológicas\tKonstanta Kosmologis
MINDMAP_LEAVES\t1\tCosmological Constant;Gravitational Coupling Force\tCosmological Constant;Gravity Power\tConstante Cosmológica;Fuerza Gravitacional\tKonstanta Kosmologis;Gaya Gravitasi
INFOGRAPHIC_TITLE\t\tCosmic Pillars\tSimple Takeaways\tPilares Cósmicos\tPilar Kosmis
INFOGRAPHIC_METRIC_LABEL\t0\tEntropy Precision\tSpace Cleanliness\tPrecisión de la Entropía\tPresisi Entropi
INFOGRAPHIC_METRIC_VALUE\t0\t1 in 10^10^123\t1 in 10^10^123\t1 en 10^10^123\t1 berbanding 10^10^123
INFOGRAPHIC_METRIC_SUB\t0\tPenrose bound\tAlmost impossible order\tLímite de Penrose\tKalkulasi Penrose
INFOGRAPHIC_TAKEAWAY\t\tExtremely low entropy;Narrow physical boundaries\tSpace started organized;Every number is perfect\tBaja entropía inicial;Límites físicos estrechos\tEntropi awal sangat rendah;Batas fisik sangat sempit
REPORT_TITLE\t\tScholarly Report\tSimple Report\tInforme Académico\tLaporan Akademis
REPORT_BODY\t\tRoger Penrose discusses initial phase volume...\tThings in your room get messy. The universe started neat.\tRoger Penrose analiza el espacio de fases inicial.\tRoger Penrose membahas volume ruang fase awal.
BOOK_TITLE\t\tA Fine-Tuned Universe: The Quest for God\tA Fine-Tuned Universe: The Quest for God\tUn Universo Ajustado Fino\tA Fine-Tuned Universe
BOOK_AUTHOR\t\tAlister E. McGrath\tAlister E. McGrath\tAlister E. McGrath\tAlister E. McGrath
BOOK_YEAR\t\t2009\t2009\t2009\t2009
BOOK_RATING\t\t5\t5\t5\t5
BOOK_OVERVIEW\t\tA masterwork bridging the precision...\tA great book that helps us see...\tUna obra maestra que tiende...\tSebuah karya besar yang...
BOOK_TAKEAWAYS\t\tThe concepts of fine-tuning extend...;The anthropic principle...;Classic Christian teleology...\tThe perfect numbers in nature...;We should not say the universe...;God is like a great artist...\tLos conceptos de ajuste fino...;El principio antrópico...;La teleología cristiana...\tKonsep penyelarasan halus...;Prinsip antropik...;Teleologi klasik...
BOOK_ALIGNMENT\t\tMcGrath masterfully demonstrates that...\tMcGrath shows that the hard math...\tMcGrath demuestra magistralmente que...\tMcGrath secara luar biasa menunjukkan...
CREATOR_REFLECTION\t\tWe are thinking God's thoughts after Him.\tThe math of science shows how God thinks.\tPensamos los pensamientos de Dios después de Él.\tKita memikirkan pikiran-pikiran Tuhan setelah Dia.
INSPIRING_STORY\t\tOnce upon a time, a cosmologist looked at the fine-tuned constant...\tA simple story about stars...\tHabía una vez un cosmólogo...\tDahulu kala, seorang kosmolog...
EXECUTIVE_SUMMARY\t\tThe universe's initial state exhibits entropy of 1 in 10^10^123;Fundamental physical parameters possess narrow thresholds\tThe universe started clean. Roger Penrose calculated this;The rules of nature are set to perfect numbers\tEl estado inicial del universo exhibe baja entropía;Los parámetros físicos fundamentales poseen límites estrechos\tKeadaan awal alam semesta menunjukkan tingkat entropi rendah;Parameter fisik fundamental memiliki batas sempit`;
                              copyToClipboard(sampleText, "Pre-Populated Episode 01", "Pre-populated Episode 01 TSV copied! Paste into Excel to inspect.");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[10px] font-mono text-indigo-300 transition-colors"
                          >
                            🚀 Copy Pre-Populated Episode 01
                          </button>

                          <button
                            onClick={() => {
                              const promptText = `Act as an expert theological curriculum designer and research assistant.
Transform the single-source theological or scientific narrative story into a structured, flat Tab-Separated Values (TSV) dataset. 

Your output MUST be a single clean markdown block containing only TSV rows separated by tab characters (\\t). Do not write introductory or explanatory text. Follow this schema exactly:

Columns:
Row Identifier\\tField or Index\\tAcademic (EN)\\tSimplified (EN)\\tEspañol (ES)\\tIndonesian

The row definitions to produce:
EPISODE_META\\tid\\t[Episode ID (e.g. 02)]
EPISODE_META\\tpublish_date\\t[YYYY-MM-DD]
EPISODE_META\\tyoutube_video_id\\t[Video ID (11 chars)]
EPISODE_META\\ttitle\\t[Academic Title]\\t[ESL Title]\\t[Spanish Title]\\t[Indonesian Title]
EPISODE_META\\tdescription\\t[Academic Brief]\\t[ESL Brief]\\t[Spanish Brief]\\t[Indonesian Brief]
EPISODE_AUDIO\\tpodcast_url\\t[Default Podcast MP3 URL]
EPISODE_AUDIO\\tbrief_url\\t[Default Brief MP3 URL]
SCENE_TIME\\t0\\t[Scene 0 start seconds]
SCENE_TITLE\\t0\\t[Scene 0 Title Acad]\\t[Scene 0 Title ESL]\\t[Scene 0 Title ES]\\t[Scene 0 Title ID]
SCENE_DESC\\t0\\t[Scene 0 Description Acad]\\t[Scene 0 Description ESL]\\t[Scene 0 Description ES]\\t[Scene 0 Description ID]
SCENE_TIME\\t1\\t[Scene 1 start seconds]
SCENE_TITLE\\t1\\t[Scene 1 Title Acad]\\t[Scene 1 Title ESL]\\t[Scene 1 Title ES]\\t[Scene 1 Title ID]
SCENE_DESC\\t1\\t[Scene 1 Description Acad]\\t[Scene 1 Description ESL]\\t[Scene 1 Description ES]\\t[Scene 1 Description ID]
SCENE_TIME\\t2\\t[Scene 2 start seconds]
SCENE_TITLE\\t2\\t[Scene 2 Title Acad]\\t[Scene 2 Title ESL]\\t[Scene 2 Title ES]\\t[Scene 2 Title ID]
SCENE_DESC\\t2\\t[Scene 2 Description Acad]\\t[Scene 2 Description ESL]\\t[Scene 2 Description ES]\\t[Scene 2 Description ID]
QUOTE_AUTHOR\\t0\\t[Author Name]
QUOTE_ROLE\\t0\\t[Author Role / Title]
QUOTE_TEXT\\t0\\t[Quote Acad]\\t[Quote ESL]\\t[Quote ES]\\t[Quote ID]
MINDMAP_ROOT\\t\\t[Mind Map Title Acad]\\t[Mind Map Title ESL]\\t[Mind Map Title ES]\\t[Mind Map Title ID]
MINDMAP_BRANCH\\t0\\t[Branch 0 Label Acad]\\t[Branch 0 Label ESL]\\t[Branch 0 Label ES]\\t[Branch 0 Label ID]
MINDMAP_LEAVES\\t0\\t[Leaf1;Leaf2;Leaf3 (separated by semi-colon)]
MINDMAP_BRANCH\\t1\\t[Branch 1 Label Acad]\\t[Branch 1 Label ESL]\\t[Branch 1 Label ES]\\t[Branch 1 Label ID]
MINDMAP_LEAVES\\t1\\t[Leaf1;Leaf2 (separated by semi-colon)]
INFOGRAPHIC_TITLE\\t\\t[Infographic Title Acad]\\t[Title ESL]\\t[Title ES]\\t[Title ID]
INFOGRAPHIC_METRIC_LABEL\\t0\\t[Metric 0 Title Acad]\\t[Title ESL]\\t[Title ES]\\t[Title ID]
INFOGRAPHIC_METRIC_VALUE\\t0\\t[Metric 0 Value Acad]\\t[Value ESL]\\t[Value ES]\\t[Value ID]
INFOGRAPHIC_METRIC_SUB\\t0\\t[Metric 0 Sub Acad]\\t[Sub ESL]\\t[Sub ES]\\t[Sub ID]
INFOGRAPHIC_TAKEAWAY\\t\\t[Takeaway1;Takeaway2;Takeaway3 (separated by semi-colon)]
REPORT_TITLE\\t\\t[Report Title Acad]\\t[Title ESL]\\t[Title ES]\\t[Title ID]
REPORT_BODY\\t\\t[Report Body Acad (multiline or clean text)]\\t[Body ESL]\\t[Body ES]\\t[Body ID]
BOOK_TITLE\\t\\t[Review Book Title]
BOOK_AUTHOR\\t\\t[Review Book Author]
BOOK_YEAR\\t\\t[Publish Year]
BOOK_RATING\\t\\t[Rating 5]
BOOK_OVERVIEW\\t\\t[Book summary Acad]\\t[Summary ESL]\\t[Summary ES]\\t[Summary ID]
BOOK_TAKEAWAYS\\t\\t[Takeaway1;Takeaway2;Takeaway3 (separated by semi-colon)]
BOOK_ALIGNMENT\\t\\t[Alignment thesis Acad]\\t[Thesis ESL]\\t[Thesis ES]\\t[Thesis ID]
CREATOR_REFLECTION\\t\\t[Reflection Acad]\\t[Reflection ESL]\\t[Reflection ES]\\t[Reflection ID]
INSPIRING_STORY\\t\\t[Narrative Story Acad]\\t[Story ESL]\\t[Story ES]\\t[Story ID]
EXECUTIVE_SUMMARY\\t\\t[Bullet1;Bullet2 (separated by semi-colon)]

Translate all blocks with top-tier, elegant depth.
Here is the raw story text to parse:
`;
                              copyToClipboard(promptText, "NotebookLM / Gemini Prompt Builder", "Custom NotebookLM/Gemini Prompt copied to clipboard!");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[10px] font-mono text-indigo-300 transition-colors"
                          >
                            🤖 Copy NotebookLM / Gemini Prompt Builder
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-neutral-400">Paste Copied Tabular Cells from Google Sheets / Excel</label>
                        <textarea
                          value={tsvPasteText}
                          onChange={(e) => setTsvPasteText(e.target.value)}
                          rows={12}
                          placeholder="Row Identifier	Field or Index	Academic (EN)	Simplified (EN)	Español (ES)	Indonesian..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500 placeholder:text-neutral-700"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            if (!tsvPasteText.trim()) {
                              triggerNotification("Paste space cannot be empty!", "error");
                              return;
                            }
                            try {
                              const lines = tsvPasteText.split('\n');
                              if (lines.length <= 1) {
                                triggerNotification("No tabular data rows detected.", "error");
                                return;
                              }

                              const newEpisode: Episode = {
                                id: activeEpisode?.id || '01',
                                title: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' },
                                description: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' },
                                publish_date: activeEpisode?.publish_date || new Date().toISOString().split('T')[0],
                                youtube_video_id: activeEpisode?.youtube_video_id || 'U2q0L6K77-w',
                                audio_overview: {
                                  podcast_url: '',
                                  brief_url: '',
                                  podcast_url_by_profile: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' },
                                  brief_url_by_profile: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' }
                                },
                                scenes: [],
                                inspiring_quotations: [],
                                study_modules: {
                                  mind_map: {
                                    academic_en: { label: '' },
                                    esl_en: { label: '' },
                                    translated_es: { label: '' },
                                    translated_id: { label: '' }
                                  },
                                  infographic: {
                                    academic_en: { title: '', metrics: [], takeaways: [] },
                                    esl_en: { title: '', metrics: [], takeaways: [] },
                                    translated_es: { title: '', metrics: [], takeaways: [] },
                                    translated_id: { title: '', metrics: [], takeaways: [] }
                                  },
                                  slide_decks: [],
                                  specialized_reports: {
                                    academic_en: { title: '', body: '' },
                                    esl_en: { title: '', body: '' },
                                    translated_es: { title: '', body: '' },
                                    translated_id: { title: '', body: '' }
                                  },
                                  data_table: {
                                    headers: {
                                      academic_en: ["Physical Constant", "Symbol", "Precise Value", "Tolerance Limit", "Philosophical Weight"],
                                      esl_en: ["Law / Number", "Symbol", "Number Value", "Allowed Change", "What it Means"],
                                      translated_es: ["Constante Física", "Símbolo", "Valor Preciso", "Límite de Tolerancia", "Peso Filosófico"],
                                      translated_id: ["Konstanta Fisika", "Simbol", "Nilai Presisi", "Batas Toleransi", "Bobot Filosofis"]
                                    },
                                    rows: []
                                  },
                                  creator_reflection: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' },
                                  book_review: {
                                    academic_en: { title: '', author: '', publish_year: '', rating: 5, overview: '', key_takeaways: [], scientific_theological_alignment: '', recommended_chapters: [] },
                                    esl_en: { title: '', author: '', publish_year: '', rating: 5, overview: '', key_takeaways: [], scientific_theological_alignment: '', recommended_chapters: [] },
                                    translated_es: { title: '', author: '', publish_year: '', rating: 5, overview: '', key_takeaways: [], scientific_theological_alignment: '', recommended_chapters: [] },
                                    translated_id: { title: '', author: '', publish_year: '', rating: 5, overview: '', key_takeaways: [], scientific_theological_alignment: '', recommended_chapters: [] }
                                  },
                                  inspiring_story: { academic_en: '', esl_en: '', translated_es: '', translated_id: '' },
                                  executive_summary: { academic_en: [], esl_en: [], translated_es: [], translated_id: [] }
                                }
                              };

                              const scenesMap: Record<number, { timestamp_seconds: number; title: Record<string, string>; description: Record<string, string> }> = {};
                              const quotesMap: Record<number, { author: string; historical_role: string; quote_text: Record<string, string> }> = {};
                              const mindmapBranches: Record<number, { title: Record<string, string>; leaves: Record<string, string[]> }> = {};
                              const infographicMetrics: Record<number, { label: Record<string, string>; value: Record<string, string>; sub: Record<string, string> }> = {};

                              for (let i = 1; i < lines.length; i++) {
                                const line = lines[i];
                                if (!line.trim()) continue;
                                const parts = line.split('\t');
                                if (parts.length < 3) continue;

                                const rowId = parts[0].trim().toUpperCase();
                                const fieldOrIndex = parts[1].trim();
                                const ac_en = parts[2]?.trim() || '';
                                const esl_en = parts[3]?.trim() || '';
                                const tr_es = parts[4]?.trim() || '';
                                const tr_id = parts[5]?.trim() || '';

                                const setProfileMapped = (obj: any) => {
                                  obj.academic_en = ac_en || obj.academic_en || '';
                                  obj.esl_en = esl_en || ac_en || '';
                                  obj.translated_es = tr_es || ac_en || '';
                                  obj.translated_id = tr_id || ac_en || '';
                                };

                                switch (rowId) {
                                  case 'EPISODE_META':
                                    if (fieldOrIndex === 'id' && ac_en) newEpisode.id = ac_en;
                                    else if (fieldOrIndex === 'publish_date' && ac_en) newEpisode.publish_date = ac_en;
                                    else if (fieldOrIndex === 'youtube_video_id' && ac_en) newEpisode.youtube_video_id = ac_en;
                                    else if (fieldOrIndex === 'title') setProfileMapped(newEpisode.title);
                                    else if (fieldOrIndex === 'description') setProfileMapped(newEpisode.description);
                                    break;

                                  case 'EPISODE_AUDIO':
                                    if (fieldOrIndex === 'podcast_url') {
                                      newEpisode.audio_overview.podcast_url = ac_en;
                                      newEpisode.audio_overview.podcast_url_by_profile = {
                                        academic_en: ac_en,
                                        esl_en: esl_en || ac_en,
                                        translated_es: tr_es || ac_en,
                                        translated_id: tr_id || ac_en
                                      };
                                    } else if (fieldOrIndex === 'brief_url') {
                                      newEpisode.audio_overview.brief_url = ac_en;
                                      newEpisode.audio_overview.brief_url_by_profile = {
                                        academic_en: ac_en,
                                        esl_en: esl_en || ac_en,
                                        translated_es: tr_es || ac_en,
                                        translated_id: tr_id || ac_en
                                      };
                                    }
                                    break;

                                  case 'SCENE_TIME': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!scenesMap[idx]) scenesMap[idx] = { timestamp_seconds: 0, title: {}, description: {} };
                                      scenesMap[idx].timestamp_seconds = parseInt(ac_en, 10) || 0;
                                    }
                                    break;
                                  }
                                  case 'SCENE_TITLE': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!scenesMap[idx]) scenesMap[idx] = { timestamp_seconds: 0, title: {}, description: {} };
                                      setProfileMapped(scenesMap[idx].title);
                                    }
                                    break;
                                  }
                                  case 'SCENE_DESC': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!scenesMap[idx]) scenesMap[idx] = { timestamp_seconds: 0, title: {}, description: {} };
                                      setProfileMapped(scenesMap[idx].description);
                                    }
                                    break;
                                  }

                                  case 'QUOTE_AUTHOR': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!quotesMap[idx]) quotesMap[idx] = { author: '', historical_role: '', quote_text: {} };
                                      quotesMap[idx].author = ac_en;
                                    }
                                    break;
                                  }
                                  case 'QUOTE_ROLE': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!quotesMap[idx]) quotesMap[idx] = { author: '', historical_role: '', quote_text: {} };
                                      quotesMap[idx].historical_role = ac_en;
                                    }
                                    break;
                                  }
                                  case 'QUOTE_TEXT': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!quotesMap[idx]) quotesMap[idx] = { author: '', historical_role: '', quote_text: {} };
                                      setProfileMapped(quotesMap[idx].quote_text);
                                    }
                                    break;
                                  }

                                  case 'MINDMAP_ROOT': {
                                    const rootText = { academic_en: '', esl_en: '', translated_es: '', translated_id: '' };
                                    setProfileMapped(rootText);
                                    newEpisode.study_modules.mind_map.academic_en.label = rootText.academic_en;
                                    newEpisode.study_modules.mind_map.esl_en.label = rootText.esl_en;
                                    newEpisode.study_modules.mind_map.translated_es.label = rootText.translated_es;
                                    newEpisode.study_modules.mind_map.translated_id.label = rootText.translated_id;
                                    break;
                                  }

                                  case 'MINDMAP_BRANCH': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!mindmapBranches[idx]) mindmapBranches[idx] = { title: {}, leaves: {} };
                                      setProfileMapped(mindmapBranches[idx].title);
                                    }
                                    break;
                                  }
                                  case 'MINDMAP_LEAVES': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!mindmapBranches[idx]) mindmapBranches[idx] = { title: {}, leaves: {} };
                                      mindmapBranches[idx].leaves = {
                                        academic_en: ac_en.split(';').map(x => x.trim()).filter(Boolean),
                                        esl_en: (esl_en || ac_en).split(';').map(x => x.trim()).filter(Boolean),
                                        translated_es: (tr_es || ac_en).split(';').map(x => x.trim()).filter(Boolean),
                                        translated_id: (tr_id || ac_en).split(';').map(x => x.trim()).filter(Boolean)
                                      };
                                    }
                                    break;
                                  }

                                  case 'INFOGRAPHIC_TITLE':
                                    newEpisode.study_modules.infographic.academic_en.title = ac_en;
                                    newEpisode.study_modules.infographic.esl_en.title = esl_en || ac_en;
                                    newEpisode.study_modules.infographic.translated_es.title = tr_es || ac_en;
                                    newEpisode.study_modules.infographic.translated_id.title = tr_id || ac_en;
                                    break;

                                  case 'INFOGRAPHIC_METRIC_LABEL': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!infographicMetrics[idx]) infographicMetrics[idx] = { label: {}, value: {}, sub: {} };
                                      setProfileMapped(infographicMetrics[idx].label);
                                    }
                                    break;
                                  }
                                  case 'INFOGRAPHIC_METRIC_VALUE': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!infographicMetrics[idx]) infographicMetrics[idx] = { label: {}, value: {}, sub: {} };
                                      setProfileMapped(infographicMetrics[idx].value);
                                    }
                                    break;
                                  }
                                  case 'INFOGRAPHIC_METRIC_SUB': {
                                    const idx = parseInt(fieldOrIndex, 10);
                                    if (!isNaN(idx)) {
                                      if (!infographicMetrics[idx]) infographicMetrics[idx] = { label: {}, value: {}, sub: {} };
                                      setProfileMapped(infographicMetrics[idx].sub);
                                    }
                                    break;
                                  }

                                  case 'INFOGRAPHIC_TAKEAWAY': {
                                    const list_ac = ac_en.split(';').map(x => x.trim()).filter(Boolean);
                                    const list_esl = (esl_en || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    const list_es = (tr_es || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    const list_id = (tr_id || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.infographic.academic_en.takeaways = list_ac;
                                    newEpisode.study_modules.infographic.esl_en.takeaways = list_esl;
                                    newEpisode.study_modules.infographic.translated_es.takeaways = list_es;
                                    newEpisode.study_modules.infographic.translated_id.takeaways = list_id;
                                    break;
                                  }

                                  case 'REPORT_TITLE':
                                    newEpisode.study_modules.specialized_reports.academic_en.title = ac_en;
                                    newEpisode.study_modules.specialized_reports.esl_en.title = esl_en || ac_en;
                                    newEpisode.study_modules.specialized_reports.translated_es.title = tr_es || ac_en;
                                    newEpisode.study_modules.specialized_reports.translated_id.title = tr_id || ac_en;
                                    break;
                                  case 'REPORT_BODY':
                                    newEpisode.study_modules.specialized_reports.academic_en.body = ac_en;
                                    newEpisode.study_modules.specialized_reports.esl_en.body = esl_en || ac_en;
                                    newEpisode.study_modules.specialized_reports.translated_es.body = tr_es || ac_en;
                                    newEpisode.study_modules.specialized_reports.translated_id.body = tr_id || ac_en;
                                    break;

                                  case 'BOOK_TITLE':
                                    newEpisode.study_modules.book_review.academic_en.title = ac_en;
                                    newEpisode.study_modules.book_review.esl_en.title = esl_en || ac_en;
                                    newEpisode.study_modules.book_review.translated_es.title = tr_es || ac_en;
                                    newEpisode.study_modules.book_review.translated_id.title = tr_id || ac_en;
                                    break;
                                  case 'BOOK_AUTHOR':
                                    newEpisode.study_modules.book_review.academic_en.author = ac_en;
                                    newEpisode.study_modules.book_review.esl_en.author = esl_en || ac_en;
                                    newEpisode.study_modules.book_review.translated_es.author = tr_es || ac_en;
                                    newEpisode.study_modules.book_review.translated_id.author = tr_id || ac_en;
                                    break;
                                  case 'BOOK_YEAR':
                                    newEpisode.study_modules.book_review.academic_en.publish_year = ac_en;
                                    newEpisode.study_modules.book_review.esl_en.publish_year = esl_en || ac_en;
                                    newEpisode.study_modules.book_review.translated_es.publish_year = tr_es || ac_en;
                                    newEpisode.study_modules.book_review.translated_id.publish_year = tr_id || ac_en;
                                    break;
                                  case 'BOOK_RATING': {
                                    const val = parseInt(ac_en, 10) || 5;
                                    newEpisode.study_modules.book_review.academic_en.rating = val;
                                    newEpisode.study_modules.book_review.esl_en.rating = val;
                                    newEpisode.study_modules.book_review.translated_es.rating = val;
                                    newEpisode.study_modules.book_review.translated_id.rating = val;
                                    break;
                                  }
                                  case 'BOOK_OVERVIEW':
                                    newEpisode.study_modules.book_review.academic_en.overview = ac_en;
                                    newEpisode.study_modules.book_review.esl_en.overview = esl_en || ac_en;
                                    newEpisode.study_modules.book_review.translated_es.overview = tr_es || ac_en;
                                    newEpisode.study_modules.book_review.translated_id.overview = tr_id || ac_en;
                                    break;
                                  case 'BOOK_TAKEAWAYS':
                                    newEpisode.study_modules.book_review.academic_en.key_takeaways = ac_en.split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.book_review.esl_en.key_takeaways = (esl_en || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.book_review.translated_es.key_takeaways = (tr_es || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.book_review.translated_id.key_takeaways = (tr_id || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    break;
                                  case 'BOOK_ALIGNMENT':
                                    newEpisode.study_modules.book_review.academic_en.scientific_theological_alignment = ac_en;
                                    newEpisode.study_modules.book_review.esl_en.scientific_theological_alignment = esl_en || ac_en;
                                    newEpisode.study_modules.book_review.translated_es.scientific_theological_alignment = tr_es || ac_en;
                                    newEpisode.study_modules.book_review.translated_id.scientific_theological_alignment = tr_id || ac_en;
                                    break;

                                  case 'CREATOR_REFLECTION':
                                    setProfileMapped(newEpisode.study_modules.creator_reflection);
                                    break;

                                  case 'INSPIRING_STORY':
                                    setProfileMapped(newEpisode.study_modules.inspiring_story);
                                    break;

                                  case 'EXECUTIVE_SUMMARY':
                                    newEpisode.study_modules.executive_summary.academic_en = ac_en.split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.executive_summary.esl_en = (esl_en || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.executive_summary.translated_es = (tr_es || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    newEpisode.study_modules.executive_summary.translated_id = (tr_id || ac_en).split(';').map(x => x.trim()).filter(Boolean);
                                    break;
                                }
                              }

                              // Compile lists
                              const scenesKeys = Object.keys(scenesMap).map(Number).sort((a,b)=>a-b);
                              newEpisode.scenes = scenesKeys.map(k => {
                                const s = scenesMap[k];
                                return {
                                  timestamp_seconds: s.timestamp_seconds,
                                  title: {
                                    academic_en: s.title.academic_en || '',
                                    esl_en: s.title.esl_en || s.title.academic_en || '',
                                    translated_es: s.title.translated_es || s.title.academic_en || '',
                                    translated_id: s.title.translated_id || s.title.academic_en || ''
                                  },
                                  description: {
                                    academic_en: s.description.academic_en || '',
                                    esl_en: s.description.esl_en || s.description.academic_en || '',
                                    translated_es: s.description.translated_es || s.description.academic_en || '',
                                    translated_id: s.description.translated_id || s.description.academic_en || ''
                                  }
                                };
                              });

                              const quotesKeys = Object.keys(quotesMap).map(Number).sort((a,b)=>a-b);
                              newEpisode.inspiring_quotations = quotesKeys.map(k => {
                                const q = quotesMap[k];
                                return {
                                  author: q.author,
                                  historical_role: q.historical_role,
                                  quote_text: {
                                    academic_en: q.quote_text.academic_en || '',
                                    esl_en: q.quote_text.esl_en || q.quote_text.academic_en || '',
                                    translated_es: q.quote_text.translated_es || q.quote_text.academic_en || '',
                                    translated_id: q.quote_text.translated_id || q.quote_text.academic_en || ''
                                  }
                                };
                              });

                              // Compile mindmap branches
                              const mindBranchesKeys = Object.keys(mindmapBranches).map(Number).sort((a,b)=>a-b);
                              const profiles: StudyProfile[] = ['academic_en', 'esl_en', 'translated_es', 'translated_id'];
                              profiles.forEach(p => {
                                const rootLabel = newEpisode.study_modules.mind_map[p]?.label || 'Mind Map';
                                newEpisode.study_modules.mind_map[p] = {
                                  label: rootLabel,
                                  children: mindBranchesKeys.map(bk => {
                                    const branch = mindmapBranches[bk];
                                    const branchLabel = branch.title[p] || branch.title.academic_en || '';
                                    const leafLabels = branch.leaves[p] || branch.leaves.academic_en || [];
                                    return {
                                      label: branchLabel,
                                      children: leafLabels.map(l => ({ label: l }))
                                    };
                                  })
                                };
                              });

                              // Compile infographic metrics
                              const metricKeys = Object.keys(infographicMetrics).map(Number).sort((a,b)=>a-b);
                              profiles.forEach(p => {
                                newEpisode.study_modules.infographic[p].metrics = metricKeys.map(mk => {
                                  const metric = infographicMetrics[mk];
                                  return {
                                    label: metric.label[p] || metric.label.academic_en || '',
                                    value: metric.value[p] || metric.value.academic_en || '',
                                    sub: metric.sub[p] || metric.sub.academic_en || ''
                                  };
                                });
                              });

                              // Set static slide decks and data tables defaults if empty
                              newEpisode.study_modules.data_table = activeEpisode?.study_modules.data_table || {
                                headers: {
                                  academic_en: ["Physical Constant", "Symbol", "Precise Value", "Tolerance Limit", "Philosophical Weight"],
                                  esl_en: ["Law / Number", "Symbol", "Number Value", "Allowed Change", "What it Means"],
                                  translated_es: ["Constante Física", "Símbolo", "Valor Preciso", "Límite de Tolerancia", "Peso Filosófico"],
                                  translated_id: ["Konstanta Fisika", "Simbol", "Nilai Presisi", "Batas Toleransi", "Bobot Filosofis"]
                                },
                                rows: []
                              };
                              newEpisode.study_modules.slide_decks = activeEpisode?.study_modules.slide_decks || [];

                              saveToState(newEpisode);
                              setTsvPasteText('');
                              triggerNotification(`Success! Parsed and loaded Episode "${newEpisode.id}" with high fidelity.`);
                            } catch (err: any) {
                              console.error(err);
                              triggerNotification("Failed to parse. Check tab separation and row key spelling.", "error");
                            }
                          }}
                          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-xs transition-colors shadow-lg shadow-indigo-950/40"
                        >
                          Import and Apply to Current Episode
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: NEW SECTION (ADD CUSTOM ASSET TAB) */}
                  {activeSubTab === 'new_section' && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-indigo-900/20 bg-gradient-to-r from-indigo-950/20 to-neutral-950 space-y-4">
                        <div className="flex items-center gap-2">
                          <Plus size={16} className="text-indigo-400" />
                          <h4 className="font-serif text-sm font-semibold text-neutral-200">Generate a New Custom Resource Section</h4>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Do you want to add an extra, completely customized study asset tab to this specific episode? 
                          Enter the name below, and it will render dynamically in the student view as a tab featuring localization mappings.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Enter section tab label (e.g. 'Historical Physics Debate')..."
                            id="new-tab-label-input"
                            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 flex-grow"
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('new-tab-label-input') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                handleAddCustomSection(input.value.trim());
                                input.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-950/50 transition-all whitespace-nowrap"
                          >
                            + Deploy Custom Section
                          </button>
                        </div>
                      </div>

                      {/* Display / edit configured custom tabs */}
                      <div className="space-y-4">
                        <h4 className="font-serif text-sm font-semibold text-neutral-300">Existing Custom Tabs</h4>
                        {(activeEpisode.study_modules.custom_sections || []).map((section) => (
                          <div key={section.id} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 space-y-3 relative">
                            <button
                              onClick={() => handleDeleteCustomSection(section.id)}
                              className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 transition-colors"
                              title="Delete Tab"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="text-xs font-mono font-bold text-indigo-400 uppercase">
                              TAB LABEL: <span className="text-neutral-100 font-sans font-medium">{section.label}</span>
                            </div>

                            <div className="space-y-3 pt-2">
                              {(['academic_en', 'esl_en', 'translated_es', 'translated_id'] as StudyProfile[]).map((p) => (
                                <div key={p} className="space-y-1">
                                  <span className="text-[9px] font-mono text-neutral-500 uppercase">{p} content override:</span>
                                  <textarea
                                    value={section.content[p] || ''}
                                    onChange={(e) => handleCustomSectionContentChange(section.id, p, e.target.value)}
                                    rows={2}
                                    className="w-full bg-neutral-950 border border-neutral-850 rounded px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {(!activeEpisode.study_modules.custom_sections || activeEpisode.study_modules.custom_sections.length === 0) && (
                          <p className="text-xs text-neutral-600 font-mono italic">No custom sections appended to this study module.</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="text-center py-24 bg-neutral-950/20 border border-neutral-900 rounded-2xl">
                <Database size={48} className="mx-auto text-neutral-700 mb-4 stroke-1" />
                <h3 className="font-serif text-lg text-neutral-400">No episodes found</h3>
                <p className="text-xs text-neutral-500 mt-1">Please create a new episode using the left panel.</p>
              </div>
            )}

            {/* GitHub Integration panel */}
            <div className="bg-[#08080c] border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Github size={20} className="text-indigo-400" />
                <h3 className="font-serif text-base font-bold text-neutral-100">
                  GitHub Repository Sync Integration
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Publish your updated consolidated database direct to your GitHub codebase with an automated commit.
                Requires a Personal Access Token (PAT) with repository write permissions.
              </p>

              <form onSubmit={handleGitHubSync} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">GitHub Repository (owner/repo)</label>
                  <input
                    type="text"
                    placeholder="e.g. yourusername/logos-explorer"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Target Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. main"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">Target JSON Path</label>
                  <input
                    type="text"
                    placeholder="e.g. content/episodes/01.json"
                    value={githubPath}
                    onChange={(e) => setGithubPath(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase">GitHub Personal Access Token (PAT)</label>
                  <input
                    type="password"
                    placeholder="Enter gh_pat_..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {githubStatus.type !== 'idle' && (
                  <div className={`md:col-span-2 flex items-center gap-2.5 p-3 rounded-lg text-xs font-mono border ${
                    githubStatus.type === 'loading' ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300' :
                    githubStatus.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' :
                    'bg-red-950/20 border-red-900/40 text-red-300'
                  }`}>
                    {githubStatus.type === 'loading' && <RefreshCw size={14} className="animate-spin text-indigo-400" />}
                    {githubStatus.type === 'success' && <Check size={14} className="text-emerald-400" />}
                    {githubStatus.type === 'error' && <AlertCircle size={14} className="text-red-400" />}
                    <span>{githubStatus.message}</span>
                  </div>
                )}

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={githubStatus.type === 'loading'}
                    className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Github size={14} />
                    Commit and Push to GitHub Repository
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>

      {copyFallbackData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">📋</span>
                <h3 className="font-serif text-base font-bold text-neutral-100">{copyFallbackData.title}</h3>
              </div>
              <button
                onClick={() => setCopyFallbackData(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300 leading-relaxed">
              <strong>IFrame Security Notice:</strong> Your browser blocked automatic clipboard copying due to sandboxed iframe security. Please manually copy the selected text below using <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-100 font-mono text-[10px]">Ctrl + C</kbd> (or <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-100 font-mono text-[10px]">Cmd + C</kbd> on Mac).
            </div>

            <div className="flex-1 overflow-hidden flex flex-col space-y-2">
              <textarea
                readOnly
                id="copy-fallback-textarea"
                value={copyFallbackData.text}
                className="w-full flex-1 min-h-[250px] bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 focus:outline-none focus:border-amber-500 overflow-y-auto"
                onClick={(e) => {
                  (e.target as HTMLTextAreaElement).select();
                }}
              />
              <div className="text-[10px] text-neutral-500 text-right">
                Click inside the box above to select all text automatically.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  const el = document.getElementById('copy-fallback-textarea') as HTMLTextAreaElement;
                  if (el) {
                    el.select();
                    document.execCommand('copy');
                    triggerNotification("Copied manually!");
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Select All & Copy
              </button>
              <button
                onClick={() => setCopyFallbackData(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
