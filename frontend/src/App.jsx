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

// --- FILE CATEGORY LOGIC ---
const getFileCategory = (filename) => {
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

/* --- ICONS --- */
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
  Close: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
    } catch (e) { 
      setFiles([]); 
    } 
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

  const permanentlyDeleteFile = async (key) => {
    try {
        await fetch(`${BACKEND}/api/delete?key=${encodeURIComponent(key)}`, { method: "DELETE" });
        setFiles(p => p.filter(f => f.Key !== key));
        notify("File permanently deleted", "neutral");
        return true;
    } catch(e) { notify("Could not delete file", "error"); return false; }
  };

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  return { files, loading, uploadProgress, uploadFile, permanentlyDeleteFile };
}

/* --- COMPONENTS --- */

const SidebarItem = ({ icon: IconComp, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
        <IconComp width="18" className={active ? "opacity-100" : "opacity-70"}/> {label}
    </button>
);

const FileCard = ({ file, inTrash, onRestore, onDelete, isLiked, toggleLike }) => (
  <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(79, 70, 229, 0.2)" }} className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer">
    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
       {inTrash ? (
         <button onClick={(e) => { e.stopPropagation(); onRestore(file.Key); }} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Icon.Refresh width="14" /></button>
       ) : (
         <button onClick={(e) => { e.stopPropagation(); toggleLike(file.Key); }} className={`p-1.5 rounded-lg hover:bg-pink-50 ${isLiked ? 'text-pink-500' : 'text-gray-400'}`}><Icon.Heart width="14" filled={isLiked} /></button>
       )}
       <button onClick={(e) => { e.stopPropagation(); onDelete(file.Key); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Icon.Trash width="14" /></button>
    </div>
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300"><Icon.File width="24" /></div>
    <h4 className="font-semibold text-gray-800 text-sm truncate pr-6" title={file.Key}>{file.Key}</h4>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs text-gray-400">{humanSize(file.Size)}</span>
      <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">{getFileCategory(file.Key)}</span>
    </div>
  </motion.div>
);

// --- NEW COMPONENT: Storage Breakdown Bar ---
const StorageBreakdown = ({ stats, totalSize }) => {
    return (
        <div className="mt-4 w-full flex h-3 bg-gray-100 rounded-full overflow-hidden">
             {Object.keys(stats).map((cat) => {
                 if(stats[cat] === 0) return null;
                 const percent = (stats[cat] / totalSize) * 100;
                 return (
                     <div key={cat} style={{ width: `${percent}%` }} className={`h-full ${CATEGORY_COLORS[cat]}`} title={`${cat}: ${humanSize(stats[cat])}`} />
                 )
             })}
        </div>
    )
}

// --- NEW COMPONENT: Profile Modal ---
const ProfileModal = ({ user, stats, totalUsed, totalLimit, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><Icon.Close width="24"/></button>
            </div>
            <div className="px-8 pb-8 -mt-12 relative">
                <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                    <div className="w-full h-full bg-indigo-100 rounded-xl flex items-center justify-center text-3xl font-bold text-indigo-600 border border-indigo-50">
                        {user.avatar}
                    </div>
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
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-700">{cat}</span>
                                        <span className="text-[10px] text-gray-400">{humanSize(size)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
);

export default function App() {
  const { user, login, logout } = useAuth();
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((msg, type) => { const id = Date.now(); setToasts(p => [...p, { id, msg, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000); }, []);
  const { files, loading, uploadProgress, uploadFile, permanentlyDeleteFile } = useFileSystem(notify);
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem("cloudbox_favs")) || []; } catch { return []; }});
  const [trash, setTrash] = useState(() => { try { return JSON.parse(localStorage.getItem("cloudbox_trash")) || []; } catch { return []; }});
  const [showProfile, setShowProfile] = useState(false);

  const toggleFavorite = (key) => setFavorites(p => { const n = p.includes(key) ? p.filter(k => k !== key) : [...p, key]; localStorage.setItem("cloudbox_favs", JSON.stringify(n)); return n; });
  const moveToTrash = (key) => { setTrash(p => { const n = [...p, key]; localStorage.setItem("cloudbox_trash", JSON.stringify(n)); return n; }); notify("Moved to Trash"); };
  const restoreFromTrash = (key) => { setTrash(p => { const n = p.filter(k => k !== key); localStorage.setItem("cloudbox_trash", JSON.stringify(n)); return n; }); notify("File Restored"); };
  const handlePermanentDelete = async (key) => { if(confirm("Permanently delete?")) { await permanentlyDeleteFile(key); setTrash(p => p.filter(k => k !== key)); }};

  const filteredFiles = useMemo(() => {
    let result = files;
    if (activeTab === 'trash') return result.filter(f => trash.includes(f.Key));
    result = result.filter(f => !trash.includes(f.Key)); // Hide trash from normal views
    if(search) result = result.filter(f => f.Key.toLowerCase().includes(search.toLowerCase()));
    if (activeTab === 'recent') result = [...result].sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    else if (activeTab === 'favorites') result = result.filter(f => favorites.includes(f.Key));
    return result;
  }, [files, search, activeTab, favorites, trash]);

  // --- ANALYTICS CALCULATION ---
  const TOTAL_STORAGE = 100 * 1024 * 1024; 
  const usedStorage = useMemo(() => files.reduce((acc, f) => acc + (f.Size || 0), 0), [files]);
  const storageStats = useMemo(() => {
      const stats = { Images: 0, Videos: 0, Documents: 0, Audio: 0, Others: 0 };
      files.forEach(f => {
          const cat = getFileCategory(f.Key);
          stats[cat] += (f.Size || 0);
      });
      return stats;
  }, [files]);
  
  const fileInputRef = useRef(null);

  // --- LOGIN SCREEN ---
  if (!user) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner"><Icon.Cloud width="32" /></motion.div>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>
          <form onSubmit={(e) => { e.preventDefault(); login(e.target.name.value, e.target.email.value); }} className="space-y-4 mt-8">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                <input name="name" placeholder="John Doe" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all mt-1" required />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <input name="email" type="email" placeholder="john@example.com" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all mt-1" required />
            </div>
            <button className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-colors shadow-lg mt-4">Access Dashboard</button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white/70 backdrop-blur-2xl border-r border-white/50 hidden md:flex flex-col z-20 shadow-xl shadow-indigo-100/20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30"><Icon.Cloud width="18"/></div>
          <span className="font-bold text-xl tracking-tight text-gray-900">CloudBox</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
          <SidebarItem icon={Icon.File} label="All Files" active={activeTab==='all'} onClick={() => setActiveTab('all')} />
          <SidebarItem icon={Icon.Clock} label="Recent" active={activeTab==='recent'} onClick={() => setActiveTab('recent')} />
          <SidebarItem icon={Icon.Heart} label="Favorites" active={activeTab==='favorites'} onClick={() => setActiveTab('favorites')} />
          <SidebarItem icon={Icon.Trash} label="Trash" active={activeTab==='trash'} onClick={() => setActiveTab('trash')} />
        </nav>

        {/* Storage Widget with Color Bar */}
        <div className="p-6">
            <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-900/10 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowProfile(true)}>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                <h4 className="font-semibold text-sm relative z-10 flex justify-between items-center">
                    Storage 
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">View Details</span>
                </h4>
                <div className="mt-3 relative z-10">
                    <div className="flex justify-between text-xs mb-1 opacity-80">
                        <span>{humanSize(usedStorage)}</span>
                        <span>{humanSize(TOTAL_STORAGE)}</span>
                    </div>
                    {/* Multi-color Progress Bar */}
                    <div className="flex h-1.5 bg-gray-700 rounded-full overflow-hidden w-full">
                        {Object.keys(storageStats).map((cat) => (
                             <div key={cat} style={{ width: `${(storageStats[cat] / TOTAL_STORAGE) * 100}%` }} className={`h-full ${CATEGORY_COLORS[cat]}`} />
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm px-2 transition-colors"><Icon.LogOut width="16"/> Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="px-8 py-5 flex items-center justify-between bg-white/40 backdrop-blur-sm sticky top-0 z-10 border-b border-white/40">
           <div className="flex-1 max-w-xl relative group">
              <Icon.Search width="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your files..." className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm outline-none transition-all shadow-sm" />
           </div>
           {/* Profile Trigger */}
           <div className="flex items-center gap-4 ml-4 cursor-pointer" onClick={() => setShowProfile(true)}>
              <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
              </div>
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
                            <div>
                                <h3 className="text-gray-900 font-semibold">{uploadProgress > 0 ? "Uploading..." : "Click or drop to upload"}</h3>
                                <p className="text-gray-400 text-xs mt-1">Supports Images, Videos, PDFs</p>
                            </div>
                        </div>
                        {uploadProgress > 0 && <motion.div className="absolute bottom-0 left-0 h-1 bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />}
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 capitalize">{activeTab === 'trash' ? 'Trash Bin' : activeTab === 'recent' ? 'Recent Files' : activeTab === 'favorites' ? 'Your Favorites' : 'All Files'}</h3>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200/50 rounded-2xl animate-pulse"/>)}</div>
            ) : filteredFiles.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-indigo-500">{activeTab === 'trash' ? <Icon.Trash width="40"/> : <Icon.Search width="40"/>}</div>
                    <h3 className="text-xl font-bold text-gray-800">{activeTab === 'trash' ? "Trash is Empty" : "No files found"}</h3>
                </motion.div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {filteredFiles.map(f => (
                        <FileCard key={f.Key} file={f} inTrash={activeTab === 'trash'} onDelete={activeTab === 'trash' ? handlePermanentDelete : moveToTrash} onRestore={restoreFromTrash} isLiked={favorites.includes(f.Key)} toggleLike={toggleFavorite} />
                      ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
          {showProfile && <ProfileModal user={user} stats={storageStats} totalUsed={usedStorage} totalLimit={TOTAL_STORAGE} onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 border pointer-events-auto ${t.type==='error' ? 'bg-red-500/90 text-white border-red-500' : 'bg-white/90 text-gray-800 border-white/20'}`}>
              <div className={`w-2 h-2 rounded-full ${t.type === 'error' ? 'bg-white' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}