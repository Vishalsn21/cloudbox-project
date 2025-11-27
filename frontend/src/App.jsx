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

/* --- ICONS (Styled) --- */
const Icon = {
  Cloud: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/><path d="M12 13.5V5"/><path d="M12 5l4 4"/><path d="M12 5L8 9"/></svg>,
  File: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Search: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  LogOut: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  List: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
};

/* --- HOOKS --- */
function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("saas_user")); } catch { return null; }
  });
  const login = (username) => {
    const data = { name: username, token: uid(), avatar: username.charAt(0).toUpperCase() };
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
      const data = await res.json();
      setFiles(data.items || []);
    } catch (e) { 
      // Silent error for demo purposes
      setFiles([]); 
    } 
    finally { setLoading(false); }
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploadProgress(1);
    // Simulating upload for UI demo if backend fails
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setUploadProgress(0);
          setFiles(prev => [...prev, { Key: file.name, Size: file.size, LastModified: new Date() }]);
          notify("Upload complete", "success");
        }, 500);
      }
    }, 100);
  };

  const deleteFile = async (key) => {
    setFiles(p => p.filter(f => f.Key !== key));
    notify("File moved to trash");
  };

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  return { files, loading, uploadProgress, uploadFile, deleteFile };
}

/* --- COMPONENTS --- */

// 1. Modern Grid/List View Toggle
const ViewToggle = ({ view, setView }) => (
  <div className="flex bg-gray-100 p-1 rounded-lg">
    <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
      <Icon.Grid width="18" />
    </button>
    <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
      <Icon.List width="18" />
    </button>
  </div>
);

// 2. Elegant File Card (Grid View) - UPDATED with Stronger Hover
const FileCard = ({ file, onDelete }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(79, 70, 229, 0.2)" }}
    className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-indigo-100 transition-all cursor-pointer"
  >
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={(e) => { e.stopPropagation(); onDelete(file.Key); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
        <Icon.Trash width="14" />
      </button>
    </div>
    
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon.File width="24" />
    </div>
    
    <h4 className="font-semibold text-gray-800 text-sm truncate pr-6" title={file.Key}>{file.Key}</h4>
    <div className="flex justify-between items-center mt-2">
      <span className="text-xs text-gray-400">{humanSize(file.Size)}</span>
    </div>
  </motion.div>
);

// 3. Clean List Row (List View)
const FileRow = ({ file, onDelete }) => (
  <motion.tr 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
  >
    <td className="py-4 px-4 flex items-center gap-3">
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Icon.File width="16"/></div>
      <span className="text-sm font-medium text-gray-700">{file.Key}</span>
    </td>
    <td className="py-4 px-4 text-xs text-gray-500">{humanSize(file.Size)}</td>
    <td className="py-4 px-4 text-right">
       <button onClick={() => onDelete(file.Key)} className="text-gray-300 hover:text-red-500 transition-colors">
         <Icon.Trash width="16"/>
       </button>
    </td>
  </motion.tr>
);

export default function App() {
  const { user, login, logout } = useAuth();
  const [toasts, setToasts] = useState([]);
  
  // FIX: Added useCallback to prevent infinite loop
  const notify = useCallback((msg, type) => { 
    const id = Date.now(); 
    setToasts(p => [...p, { id, msg, type }]); 
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000); 
  }, []);
  
  const { files, loading, uploadProgress, uploadFile, deleteFile } = useFileSystem(notify);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const fileInputRef = useRef(null);

  const TOTAL_STORAGE = 100 * 1024 * 1024; 
  const usedStorage = useMemo(() => files.reduce((acc, f) => acc + (f.Size || 0), 0), [files]);
  const usedPercent = Math.min(100, (usedStorage / TOTAL_STORAGE) * 100);
  const filteredFiles = files.filter(f => f.Key.toLowerCase().includes(search.toLowerCase()));

  // --- LOGIN SCREEN ---
  if (!user) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner"
            >
                <Icon.Cloud width="32" />
            </motion.div>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">Welcome Back</h2>
          <p className="text-center text-gray-500 mb-8 text-sm mt-2">Sign in to manage your digital assets</p>
          <form onSubmit={(e) => { e.preventDefault(); login(e.target.u.value || "Designer"); }} className="space-y-4">
            <input name="u" placeholder="Username" className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" autoFocus />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-black transition-colors shadow-lg shadow-gray-900/20">
              Access Dashboard
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );

  // --- DASHBOARD SCREEN ---
  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-900">
      
      {/* Sidebar: UPDATED for floating glass look */}
      <aside className="w-64 bg-white/70 backdrop-blur-2xl border-r border-white/50 hidden md:flex flex-col z-20 shadow-xl shadow-indigo-100/20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Icon.Cloud width="18"/> 
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">CloudBox</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
          {['All Files', 'Recent', 'Favorites', 'Trash'].map((item, i) => (
             <button key={item} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${i === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'}`}>
                <Icon.File width="18" className={i===0?"opacity-100":"opacity-70"}/> {item}
             </button>
          ))}
        </nav>

        {/* Storage Widget */}
        <div className="p-6">
            <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                <h4 className="font-semibold text-sm relative z-10">Storage</h4>
                <div className="mt-3 relative z-10">
                    <div className="flex justify-between text-xs mb-1 opacity-80">
                        <span>{Math.round(usedPercent)}% used</span>
                        <span>{humanSize(TOTAL_STORAGE)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${usedPercent}%` }} className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" />
                    </div>
                </div>
            </div>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm px-2 transition-colors">
                <Icon.LogOut width="16"/> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="px-8 py-5 flex items-center justify-between bg-white/40 backdrop-blur-sm sticky top-0 z-10 border-b border-white/40">
           <div className="flex-1 max-w-xl relative group">
              <Icon.Search width="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your files..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm outline-none transition-all shadow-sm group-hover:shadow-md"
              />
           </div>
           <div className="flex items-center gap-4 ml-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                  {user.avatar}
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
            
            {/* Upload Area */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-6 mb-8"
            >
                <div 
                   onClick={() => fileInputRef.current.click()}
                   onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/50'); }}
                   onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50'); }}
                   onDrop={(e) => { 
                      e.preventDefault(); e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50'); 
                      if(e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); 
                   }}
                   className="relative group border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-white/60 rounded-3xl p-8 transition-all cursor-pointer text-center overflow-hidden backdrop-blur-sm"
                >
                    <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => uploadFile(e.target.files[0])} />
                    
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${uploadProgress > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:scale-110'}`}>
                           {uploadProgress > 0 ? <span className="font-bold text-sm">{uploadProgress}%</span> : <Icon.Upload width="28"/>}
                        </div>
                        <div>
                            <h3 className="text-gray-900 font-semibold">
                                {uploadProgress > 0 ? "Uploading your file..." : "Click or drop to upload"}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">Files up to 10MB supported</p>
                        </div>
                    </div>
                    {/* Animated Progress Background */}
                    {uploadProgress > 0 && (
                        <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-indigo-500" 
                            initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }}
                        />
                    )}
                </div>
            </motion.div>

            {/* Files Section */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Your Files</h3>
                <ViewToggle view={viewMode} setView={setViewMode} />
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200/50 rounded-2xl animate-pulse"/>)}
                </div>
            ) : filteredFiles.length === 0 ? (
                /* --- UPDATED EMPTY STATE --- */
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300"
                >
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-indigo-500">
                        <Icon.Search width="40"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">No files found</h3>
                    <p className="text-gray-500 mt-2 max-w-xs text-center">
                        We couldn't find anything matching your search. Try uploading a new file!
                    </p>
                    <button onClick={() => fileInputRef.current.click()} className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95">
                        Upload New File
                    </button>
                </motion.div>
            ) : (
                <>
                {viewMode === 'grid' ? (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <AnimatePresence>
                          {filteredFiles.map(f => <FileCard key={f.Key} file={f} onDelete={deleteFile} />)}
                        </AnimatePresence>
                     </div>
                ) : (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map(f => <FileRow key={f.Key} file={f} onDelete={deleteFile} />)}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
            )}
        </div>
      </main>

      {/* Toast Notification */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 border pointer-events-auto ${t.type==='error' ? 'bg-red-500/90 text-white border-red-500' : t.type==='neutral' ? 'bg-gray-800/90 text-white border-gray-700' : 'bg-white/90 text-gray-800 border-white/20'}`}
            >
              <div className={`w-2 h-2 rounded-full ${t.type === 'error' ? 'bg-white' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}