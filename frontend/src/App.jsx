import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/* --- UTILS --- */
const uid = () => Math.random().toString(36).slice(2);

const humanSize = (bytes = 0) => {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = bytes;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
};

const getFileCategory = (filename) => {
    if(!filename) return 'Others';
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        document: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
        audio: ['mp3', 'wav', 'ogg']
    };
    if (types.image.includes(ext)) return 'Images';
    if (types.video.includes(ext)) return 'Videos';
    if (types.document.includes(ext)) return 'Documents';
    if (types.audio.includes(ext)) return 'Audio';
    return 'Others';
};

const CATEGORY_COLORS = {
    Images: 'bg-indigo-500',
    Videos: 'bg-rose-500',
    Documents: 'bg-emerald-500',
    Audio: 'bg-amber-500',
    Others: 'bg-slate-400'
};

/* --- ICONS (Added Menu Icon) --- */
const Icon = {
  Cloud: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/><path d="M12 13.5V5"/><path d="M12 5l4 4"/><path d="M12 5L8 9"/></svg>,
  File: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  LogOut: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Heart: (p) => <svg {...p} viewBox="0 0 24 24" fill={p.filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
  Clock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Refresh: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Close: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Star: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Menu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
};

/* --- HOOKS --- */
function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("saas_user")); } catch { return null; }
  });
  const login = (name, email) => {
    const data = { name, email, token: uid(), avatar: name.charAt(0).toUpperCase() };
    localStorage.setItem("saas_user", JSON.stringify(data));
    setUser(data);
  };
  const logout = () => { localStorage.removeItem("saas_user"); setUser(null); };
  return { user, login, logout };
}

function useFileSystem(notify) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/list`);
      if(!res.ok) throw new Error("Failed");
      const data = await res.json();
      setFiles(data.items || []);
    } catch (e) { setFiles([]); } 
    finally { setLoading(false); }
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploadProgress(10);
    const formData = new FormData();
    formData.append("file", file);
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BACKEND}/api/upload`);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status === 200) { notify("Upload complete", "success"); setUploadProgress(0); fetchFiles(); } 
            else { notify("Upload failed", "error"); setUploadProgress(0); }
        };
        xhr.send(formData);
    } catch (err) { notify("Upload failed", "error"); setUploadProgress(0); }
  };

  const toggleFavorite = async (file) => {
      const newStatus = !file.isFavorite;
      setFiles(prev => prev.map(f => f._id === file._id ? { ...f, isFavorite: newStatus } : f));
      await fetch(`${BACKEND}/api/update/${file._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: newStatus })
      });
  };

  const moveToTrash = async (file) => {
      setFiles(prev => prev.map(f => f._id === file._id ? { ...f, isTrash: true } : f));
      notify("Moved to Trash");
      await fetch(`${BACKEND}/api/update/${file._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isTrash: true })
      });
  };

  const restoreFromTrash = async (file) => {
      setFiles(prev => prev.map(f => f._id === file._id ? { ...f, isTrash: false } : f));
      notify("File Restored");
      await fetch(`${BACKEND}/api/update/${file._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isTrash: false })
      });
  };

  const permanentlyDeleteFile = async (file) => {
    try {
        await fetch(`${BACKEND}/api/delete/${file._id}`, { method: "DELETE" });
        setFiles(p => p.filter(f => f._id !== file._id));
        notify("File permanently deleted", "neutral");
        return true;
    } catch(e) { notify("Could not delete file", "error"); return false; }
  };

  const startProUpgrade = async () => {
      try {
          const res = await fetch(`${BACKEND}/api/create-checkout-session`, { method: 'POST' });
          const data = await res.json();
          if(data.url) window.location.href = data.url; 
      } catch(e) { notify("Payment Error", "error"); }
  };

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  return { files, loading, uploadProgress, uploadFile, toggleFavorite, moveToTrash, restoreFromTrash, permanentlyDeleteFile, startProUpgrade };
}

/* --- COMPONENTS --- */

const SidebarItem = ({ icon: IconComp, label, active, onClick, highlight }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${highlight ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105' : active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
        <IconComp width="18" className={active || highlight ? "opacity-100" : "opacity-70"}/> {label}
    </button>
);

const FileCard = ({ file, inTrash, onRestore, onDelete, isLiked, toggleLike }) => (
  <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(79, 70, 229, 0.2)" }} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer">
    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
       {inTrash ? (
         <button onClick={(e) => { e.stopPropagation(); onRestore(file); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Icon.Refresh width="14" /></button>
       ) : (
         <button onClick={(e) => { e.stopPropagation(); toggleLike(file); }} className={`p-1.5 rounded-lg hover:bg-pink-50 ${isLiked ? 'text-pink-500' : 'text-gray-400'}`}><Icon.Heart width="14" filled={isLiked} /></button>
       )}
       <button onClick={(e) => { e.stopPropagation(); onDelete(file); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Icon.Trash width="14" /></button>
    </div>
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300"><Icon.File width="24" /></div>
    <h4 className="font-semibold text-gray-800 text-sm truncate pr-6" title={file.Key}>{file.Key}</h4>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs text-gray-400">{humanSize(file.Size)}</span>
      <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">{getFileCategory(file.Key)}</span>
    </div>
  </motion.div>
);

const StorageBreakdown = ({ stats, totalSize }) => (
    <div className="mt-4 w-full flex h-3 bg-gray-100 rounded-full overflow-hidden">
         {Object.keys(stats).map((cat) => {
             if(stats[cat] === 0) return null;
             const percent = (stats[cat] / totalSize) * 100;
             return <div key={cat} style={{ width: `${percent}%` }} className={`h-full ${CATEGORY_COLORS[cat]}`} title={`${cat}: ${humanSize(stats[cat])}`} />
         })}
    </div>
);

const ProfileModal = ({ user, stats, totalUsed, totalLimit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><Icon.Close width="24"/></button>
            </div>
            <div className="px-8 pb-8 -mt-12 relative">
                <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                    <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center text-3xl font-bold text-indigo-600 border border-indigo-50">{user.avatar}</div>
                </div>
                <div className="mt-4">
                    <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-gray-500">{user.email}</p>
                </div>
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Storage Analytics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-bold text-gray-800">{humanSize(totalUsed)}</span>
                            <span className="text-sm text-gray-400 mb-1">of {humanSize(totalLimit)}</span>
                        </div>
                        <StorageBreakdown stats={stats} totalSize={totalLimit} />
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {Object.entries(stats).map(([cat, size]) => (
                                <div key={cat} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`} />
                                    <div className="flex flex-col"><span className="text-xs font-semibold text-gray-700">{cat}</span><span className="text-[10px] text-gray-400">{humanSize(size)}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
);

const UpgradeModal = ({ onClose, onUpgrade }) => {
    const [loading, setLoading] = useState(false);
    const handleBuy = () => { setLoading(true); onUpgrade(); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors z-10"><Icon.Close width="16" /></button>
                <div className="p-8 md:w-1/2 flex flex-col justify-center bg-white">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Go Pro</span>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Upgrade your CloudBox</h2>
                    <p className="text-gray-500 mb-6 text-sm">Get 50GB storage and premium features.</p>
                    <ul className="space-y-3 mb-8">
                        {["50GB Cloud Storage", "Priority Support", "4K Video Uploads", "No File Size Limit"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-700"><div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Icon.Check width="12"/></div>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                        <h3 className="text-lg font-bold text-gray-800">Pro Plan</h3>
                        <div className="flex items-end gap-1 my-2"><span className="text-4xl font-bold text-indigo-600">$9</span><span className="text-gray-400 mb-1">/ month</span></div>
                        <p className="text-xs text-gray-400 mb-6">Billed monthly. Cancel anytime.</p>
                        <div className="space-y-3">
                            <button onClick={handleBuy} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"/> : "Upgrade Now"}
                            </button>
                            <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-medium">No thanks, maybe later</button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default function App() {
  const { user, login, logout } = useAuth();
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((msg, type) => { const id = Date.now(); setToasts(p => [...p, { id, msg, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000); }, []);
  const { files, loading, uploadProgress, uploadFile, toggleFavorite, moveToTrash, restoreFromTrash, permanentlyDeleteFile, startProUpgrade } = useFileSystem(notify);
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [totalLimit, setTotalLimit] = useState(100 * 1024 * 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State

  const handlePermanentDelete = async (file) => { if(confirm("Permanently delete?")) await permanentlyDeleteFile(file); };

  const filteredFiles = useMemo(() => {
    let result = files;
    if (activeTab === 'trash') return result.filter(f => f.isTrash);
    result = result.filter(f => !f.isTrash);
    if(search) result = result.filter(f => f.Key.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'recent') result = [...result].sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    else if (activeTab === 'favorites') result = result.filter(f => f.isFavorite);
    return result;
  }, [files, search, activeTab]);

  const usedStorage = useMemo(() => files.reduce((acc, f) => acc + (f.Size || 0), 0), [files]);
  const storageStats = useMemo(() => {
      const stats = { Images: 0, Videos: 0, Documents: 0, Audio: 0, Others: 0 };
      files.forEach(f => { const cat = getFileCategory(f.Key); stats[cat] += (f.Size || 0); });
      return stats;
  }, [files]);
  
  const fileInputRef = useRef(null);

  if (!user) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner"><Icon.Cloud width="32" /></motion.div>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>
          <form onSubmit={(e) => { e.preventDefault(); login(e.target.name.value, e.target.email.value); }} className="space-y-4 mt-8">
            <input name="name" placeholder="Full Name" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" required />
            <input name="email" type="email" placeholder="Email Address" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" required />
            <button className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-colors shadow-lg mt-4">Access Dashboard</button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-900">
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 z-20 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Modified for Mobile Sliding */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white/70 backdrop-blur-2xl border-r border-white/50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex flex-col shadow-xl shadow-indigo-100/20 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"><Icon.Cloud width="18"/></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">CloudBox</span>
          </div>
          {/* Close Menu Button (Mobile Only) */}
          <button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}><Icon.Close width="20"/></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
          <SidebarItem icon={Icon.File} label="All Files" active={activeTab==='all'} onClick={() => { setActiveTab('all'); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Icon.Clock} label="Recent" active={activeTab==='recent'} onClick={() => { setActiveTab('recent'); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Icon.Heart} label="Favorites" active={activeTab==='favorites'} onClick={() => { setActiveTab('favorites'); setIsMobileMenuOpen(false); }} />
          <SidebarItem icon={Icon.Trash} label="Trash" active={activeTab==='trash'} onClick={() => { setActiveTab('trash'); setIsMobileMenuOpen(false); }} />
          <div className="pt-4"><SidebarItem icon={Icon.Star} label="Upgrade Plan" highlight onClick={() => { setShowUpgrade(true); setIsMobileMenuOpen(false); }} /></div>
        </nav>
        <div className="p-6">
            <div onClick={() => setShowProfile(true)} className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-900/10 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                <h4 className="font-semibold text-sm relative z-10 flex justify-between">Storage {totalLimit > 104857600 && <span className="text-yellow-400 text-[10px]">PRO</span>}</h4>
                <div className="mt-3 relative z-10">
                    <div className="flex justify-between text-xs mb-1 opacity-80"><span>{humanSize(usedStorage)}</span><span>{humanSize(totalLimit)}</span></div>
                    <div className="flex h-1.5 bg-gray-700 rounded-full overflow-hidden w-full">{Object.keys(storageStats).map((cat) => (<div key={cat} style={{ width: `${(storageStats[cat] / totalLimit) * 100}%` }} className={`h-full ${CATEGORY_COLORS[cat]}`} />))}</div>
                </div>
            </div>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm px-2 transition-colors"><Icon.LogOut width="16"/> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="px-8 py-5 flex items-center justify-between bg-white/40 backdrop-blur-sm sticky top-0 z-10 border-b border-white/40">
           <div className="flex items-center gap-4 flex-1 max-w-xl">
              {/* Hamburger Button (Mobile Only) */}
              <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-white/50 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
                  <Icon.Menu width="24" />
              </button>
              
              <div className="relative group flex-1">
                <Icon.Search width="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your files..." className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm outline-none transition-all shadow-sm" />
              </div>
           </div>
           
           <div className="flex items-center gap-4 ml-4 cursor-pointer" onClick={() => setShowProfile(true)}>
              <div className="text-right hidden sm:block"><p className="text-sm font-bold text-gray-800">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm hover:scale-110 transition-transform">{user.avatar}</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
            {activeTab !== 'trash' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 mb-8">
                    <div onClick={() => fileInputRef.current.click()} className="relative group border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-white/60 rounded-3xl p-8 transition-all cursor-pointer text-center overflow-hidden backdrop-blur-sm">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => uploadFile(e.target.files[0])} />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${uploadProgress > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:scale-110'}`}>
                            {uploadProgress > 0 ? <span className="font-bold text-sm">{uploadProgress}%</span> : <Icon.Upload width="28"/>}
                            </div>
                            <div><h3 className="text-gray-900 font-semibold">{uploadProgress > 0 ? "Uploading..." : "Click or drop to upload"}</h3><p className="text-gray-400 text-xs mt-1">Files up to 10MB supported</p></div>
                        </div>
                        {uploadProgress > 0 && <motion.div className="absolute bottom-0 left-0 h-1 bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />}
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 capitalize">{activeTab === 'trash' ? 'Trash Bin' : activeTab === 'recent' ? 'Recent Files' : activeTab === 'favorites' ? 'Your Favorites' : 'All Files'}</h3>
            </div>

            {loading ? ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200/50 rounded-2xl animate-pulse"/>)}</div>
            ) : filteredFiles.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-indigo-500">{activeTab === 'trash' ? <Icon.Trash width="40"/> : <Icon.Search width="40"/>}</div>
                    <h3 className="text-xl font-bold text-gray-800">{activeTab === 'trash' ? "Trash is Empty" : "No files found"}</h3>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {filteredFiles.map(f => ( <FileCard key={f.Key} file={f} inTrash={activeTab === 'trash'} onDelete={activeTab === 'trash' ? handlePermanentDelete : moveToTrash} onRestore={restoreFromTrash} isLiked={f.isFavorite} toggleLike={toggleFavorite} /> ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </main>

      <AnimatePresence>
          {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgrade={startProUpgrade} />}
          {showProfile && <ProfileModal user={user} stats={storageStats} totalUsed={usedStorage} totalLimit={totalLimit} onClose={() => setShowProfile(false)} />}
          {toasts.map(t => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 border pointer-events-auto ${t.type==='error' ? 'bg-red-500/90 text-white border-red-500' : t.type==='success' ? 'bg-green-600 text-white border-green-500' : 'bg-white/90 text-gray-800 border-white/20'}`}>
              <div className={`w-2 h-2 rounded-full ${t.type === 'error' ? 'bg-white' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">{t.msg}</span>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}