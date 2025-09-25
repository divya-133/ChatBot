// "use client";

// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Moon, Sun, Mic, UploadCloud, Plus, Trash2, Copy, Menu, X } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import rehypeHighlight from "rehype-highlight";

// interface Message { sender: "user" | "bot"; text: string; }
// interface ChatSession { id: string; title: string; messages: Message[]; createdAt: number; }

// declare global { interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; } }

// export default function ChatPage() {
//   const [sessions, setSessions] = useState<ChatSession[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const chatEndRef = useRef<HTMLDivElement | null>(null);

//   const [fileName, setFileName] = useState<string | null>(null);
//   const [fileContext, setFileContext] = useState<string | null>(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const recognitionRef = useRef<any>(null);
//   const [actionsOpen, setActionsOpen] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//     const saved = localStorage.getItem("chatSessions");
//     if (saved) {
//       const parsed = JSON.parse(saved) as ChatSession[];
//       setSessions(parsed);
//       if (parsed.length > 0) setActiveId(parsed[0].id);
//     }
//   }, []);

//   useEffect(() => {
//     if (mounted) localStorage.setItem("chatSessions", JSON.stringify(sessions));
//   }, [sessions, mounted]);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, isTyping]);
//   if (!mounted) return null;

//   const activeSession = sessions.find((s) => s.id === activeId);
//   const updateSession = (updated: ChatSession) => setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));

//   const createNewChat = () => {
//     const newChat: ChatSession = {
//       id: Date.now().toString(),
//       title: "New Chat",
//       messages: [{ sender: "bot", text: "👋 Hey there! I’m your Smart AI assistant." }],
//       createdAt: Date.now(),
//     };
//     setSessions(prev => [newChat, ...prev]);
//     setActiveId(newChat.id);
//     setSidebarOpen(false);
//   };

//   const deleteChat = (id: string) => {
//     const remaining = sessions.filter(s => s.id !== id);
//     setSessions(remaining);
//     setActiveId(remaining.length > 0 ? remaining[0].id : null);
//   };

//   const handleFileChange = async (file: File) => {
//     if (!file || !activeSession) return;
//     setFileName(file.name);
//     const fd = new FormData(); fd.append("file", file);
//     try {
//       const res = await fetch("/api/extract", { method: "POST", body: fd });
//       const data = await res.json();
//       if (data?.text) {
//         setFileContext(data.text);
//         updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: `📎 "${file.name}" uploaded successfully.` }] });
//       } else {
//         updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ Couldn’t extract text from file." }] });
//       }
//     } catch {
//       updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ File upload failed." }] });
//     } finally { setActionsOpen(false); }
//   };

//   const onDropFile = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); };
//   const startRecording = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) return alert("Speech Recognition not supported");
//     const rec = new SpeechRecognition();
//     rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
//     rec.onresult = (ev: any) => setInput(prev => prev ? prev + " " + ev.results[0][0].transcript : ev.results[0][0].transcript);
//     rec.onend = () => setIsRecording(false); rec.onerror = () => setIsRecording(false);
//     recognitionRef.current = rec; rec.start(); setIsRecording(true); setActionsOpen(false);
//   };
//   const stopRecording = () => recognitionRef.current?.stop();
//   const copyToClipboard = (code: string) => navigator.clipboard.writeText(code);

//   const sendMessage = async () => {
//     if (!input.trim() || !activeSession) return;
//     const newMessage: Message = { sender: "user", text: input };
//     const updatedSession: ChatSession = { ...activeSession, messages: [...activeSession.messages, newMessage] };
//     updateSession(updatedSession); setInput(""); setIsTyping(true);

//     try {
//       const chatHistory = updatedSession.messages.map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));
//       const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chatHistory, fileContext }) });
//       if (!res.body) throw new Error("No response body");

//       const reader = res.body.getReader(); const decoder = new TextDecoder();
//       let botMessage = ""; let botSession: ChatSession = { ...updatedSession, messages: [...updatedSession.messages, { sender: "bot", text: "" }] };
//       updateSession(botSession);

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         botMessage += decoder.decode(value, { stream: true });
//         botSession = { ...botSession, messages: [...botSession.messages.slice(0, -1), { sender: "bot", text: botMessage }] };
//         updateSession(botSession);
//       }

//       if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(botMessage));
//       if (botSession.title === "New Chat" && newMessage.text.trim()) { botSession.title = newMessage.text.slice(0, 20) + "..."; updateSession(botSession); }

//     } catch (err) { console.error(err); updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ Error fetching response." }] }); }
//     finally { setIsTyping(false); }
//   };

//   const sidebarBg = darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
//   const sidebarHover = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
//   const chatBg = darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900";
//   const footerBg = darkMode ? "bg-gray-900" : "bg-white/70";

//   return (
//     <div className={`flex min-h-screen ${chatBg}`} onDragOver={(e) => e.preventDefault()} onDrop={onDropFile}>
//       {/* Sidebar */}
//       <AnimatePresence>
//         {sidebarOpen && (
//           <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "tween" }} className={`fixed z-20 top-0 left-0 w-64 h-full flex flex-col shadow-xl ${sidebarBg}`}>
//             <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
//               <button onClick={createNewChat} className={`flex items-center gap-2 p-2 rounded font-semibold ${sidebarHover}`}>
//                 <Plus size={18} /> New Chat
//               </button>
//               <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-full ${sidebarHover}`}>
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto">
//               {sessions.map((s) => (
//                 <div key={s.id} className={`flex justify-between items-center px-4 py-2 m-2 rounded cursor-pointer ${s.id === activeId ? "bg-indigo-600 text-white" : sidebarHover}`} onClick={() => setActiveId(s.id)}>
//                   <span className="truncate">{s.title}</span>
//                   <button onClick={(e) => { e.stopPropagation(); deleteChat(s.id); }}>
//                     <Trash2 size={16} className="text-red-400 hover:text-red-600" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Chat Window */}
//       <motion.div className="flex-1 h-screen flex flex-col">
//         {/* Header */}
//         <div className={`flex justify-between items-center px-6 py-4 shadow-lg ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"}`}>
//           <div className="flex items-center gap-3">
//             <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-white/20">
//               <Menu size={18} />
//             </button>
//             <span className="font-bold text-lg">🤖 Smart Chatbot</span>
//           </div>
//           <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/20">
//             {darkMode ? <Sun size={18} /> : <Moon size={18} />}
//           </button>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500">
//           {activeSession?.messages.map((msg, i) => (
//             <motion.div key={i} initial={{ opacity: 0, y: msg.sender === "user" ? 20 : -20 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-3 max-w-[80%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
//               <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${msg.sender === "user" ? "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-900"}`}>
//                 {msg.sender === "user" ? "👤" : "🤖"}
//               </div>
//               <div className={`px-5 py-3 rounded-2xl shadow-lg text-sm sm:text-base whitespace-pre-wrap leading-relaxed relative ${msg.sender === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" : darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
//                 {msg.sender === "bot" ? <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.text}</ReactMarkdown> : <div>{msg.text}</div>}
//               </div>
//             </motion.div>
//           ))}
//           {isTyping && <div className="flex items-center gap-2 mr-auto"><div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">🤖</div><div className="bg-gray-800 px-4 py-2 rounded-2xl flex gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" /><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" /><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" /></div></div>}
//           <div ref={chatEndRef} />
//         </div>

//         {/* Footer */}
//         {activeSession && (
//           <div className={`p-4 border-t flex flex-col gap-3 ${footerBg}`}>
//             <div className="flex gap-2 items-center relative">
//               <div className="relative">
//                 <button onClick={() => setActionsOpen(!actionsOpen)} className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-md"><Plus size={20} /></button>
//                 {actionsOpen && (
//                   <div className={`absolute bottom-14 left-0 shadow-lg rounded-xl p-2 w-44 flex flex-col gap-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
//                     <button onClick={() => (isRecording ? stopRecording() : startRecording())} className={`flex items-center gap-2 p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Mic size={18} />{isRecording ? "Stop Recording" : "Voice Input"}</button>
//                     <label className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><UploadCloud size={18} /> Upload File<input type="file" onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} className="hidden" /></label>
//                   </div>
//                 )}
//               </div>
//               <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className={`flex-1 px-4 py-3 rounded-full border shadow-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:ring-purple-400" : "bg-white border-gray-300 focus:ring-indigo-400"}`} />
//               <button onClick={sendMessage} className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:opacity-90">➤</button>
//             </div>
//             {fileName && <span className="text-xs opacity-70 mt-1">📂 {fileName}</span>}
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// }




"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Mic, UploadCloud, Plus, Trash2, Copy, Menu, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface Message { sender: "user" | "bot"; text: string; }
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: number; }

declare global { interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; } }

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContext, setFileContext] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("chatSessions");
    if (saved) {
      const parsed = JSON.parse(saved) as ChatSession[];
      setSessions(parsed);
      if (parsed.length > 0) setActiveId(parsed[0].id);
    }
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem("chatSessions", JSON.stringify(sessions)); }, [sessions, mounted]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sessions, isTyping]);
  if (!mounted) return null;

  const activeSession = sessions.find((s) => s.id === activeId);
  const updateSession = (updated: ChatSession) => setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [{ sender: "bot", text: "👋 Hey there! I’m your Smart AI assistant." }],
      createdAt: Date.now(),
    };
    setSessions(prev => [newChat, ...prev]);
    setActiveId(newChat.id);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    setActiveId(remaining.length > 0 ? remaining[0].id : null);
  };

  const handleFileChange = async (file: File) => {
    if (!file || !activeSession) return;
    setFileName(file.name);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.text) {
        setFileContext(data.text);
        updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: `📎 "${file.name}" uploaded successfully.` }] });
      } else {
        updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ Couldn’t extract text from file." }] });
      }
    } catch {
      updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ File upload failed." }] });
    } finally { setActionsOpen(false); }
  };

  const onDropFile = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); };
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported");
    const rec = new SpeechRecognition();
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => setInput(prev => prev ? prev + " " + ev.results[0][0].transcript : ev.results[0][0].transcript);
    rec.onend = () => setIsRecording(false); rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec; rec.start(); setIsRecording(true); setActionsOpen(false);
  };
  const stopRecording = () => recognitionRef.current?.stop();
  const copyToClipboard = (code: string) => navigator.clipboard.writeText(code);

  const sendMessage = async () => {
    if (!input.trim() || !activeSession) return;
    const newMessage: Message = { sender: "user", text: input };
    const updatedSession: ChatSession = { ...activeSession, messages: [...activeSession.messages, newMessage] };
    updateSession(updatedSession); setInput(""); setIsTyping(true);

    try {
      const chatHistory = updatedSession.messages.map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chatHistory, fileContext }) });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader(); const decoder = new TextDecoder();
      let botMessage = ""; let botSession: ChatSession = { ...updatedSession, messages: [...updatedSession.messages, { sender: "bot", text: "" }] };
      updateSession(botSession);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botMessage += decoder.decode(value, { stream: true });
        botSession = { ...botSession, messages: [...botSession.messages.slice(0, -1), { sender: "bot", text: botMessage }] };
        updateSession(botSession);
      }

      if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(botMessage));
      if (botSession.title === "New Chat" && newMessage.text.trim()) { botSession.title = newMessage.text.slice(0, 20) + "..."; updateSession(botSession); }

    } catch (err) { console.error(err); updateSession({ ...activeSession, messages: [...activeSession.messages, { sender: "bot", text: "⚠️ Error fetching response." }] }); }
    finally { setIsTyping(false); }
  };

  // Theme classes
  const sidebarBg = darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const sidebarHover = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const chatBg = darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900";
  const headerBg = darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white";
  const footerBg = darkMode ? "bg-gray-900" : "bg-white/70";

  return (
    <div className={`flex min-h-screen ${chatBg}`} onDragOver={(e) => e.preventDefault()} onDrop={onDropFile}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "tween" }} className={`fixed z-20 top-0 left-0 w-64 h-full flex flex-col shadow-xl ${sidebarBg}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
              <button onClick={createNewChat} className={`flex items-center gap-2 p-2 rounded font-semibold ${sidebarHover}`}>
                <Plus size={18} /> New Chat
              </button>
              <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-full ${sidebarHover}`}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className={`flex justify-between items-center px-4 py-2 m-2 rounded cursor-pointer ${s.id === activeId ? "bg-indigo-600 text-white" : sidebarHover}`} onClick={() => setActiveId(s.id)}>
                  <span className="truncate">{s.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(s.id); }}>
                    <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <motion.div className="flex-1 h-screen flex flex-col">
       {/* Header */}
<div className="flex justify-between items-center px-6 py-4 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
  <div className="flex items-center gap-3">
    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-white/20">
      <Menu size={18} />
    </button>
    <span className="font-bold text-lg">🤖 Smart Chatbot</span>
  </div>
  <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-white/20">
    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
  </button>
</div>


        {/* Messages */}
        <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500">
          {activeSession?.messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: msg.sender === "user" ? 20 : -20 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-3 max-w-[80%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${msg.sender === "user" ? "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-900"}`}>
                {msg.sender === "user" ? "👤" : "🤖"}
              </div>
              <div className={`px-5 py-3 rounded-2xl shadow-lg text-sm sm:text-base whitespace-pre-wrap leading-relaxed relative ${msg.sender === "user" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" : darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
                {msg.sender === "bot" ? <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.text}</ReactMarkdown> : <div>{msg.text}</div>}
              </div>
            </motion.div>
          ))}
          {isTyping && <div className="flex items-center gap-2 mr-auto"><div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">🤖</div><div className="bg-gray-800 px-4 py-2 rounded-2xl flex gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" /><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" /><span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" /></div></div>}
          <div ref={chatEndRef} />
        </div>

        {/* Footer */}
        {activeSession && (
          <div className={`p-4 border-t flex flex-col gap-3 ${footerBg}`}>
            <div className="flex gap-2 items-center relative">
              <div className="relative">
                <button onClick={() => setActionsOpen(!actionsOpen)} className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 shadow-md"><Plus size={20} /></button>
                {actionsOpen && (
                  <div className={`absolute bottom-14 left-0 shadow-lg rounded-xl p-2 w-44 flex flex-col gap-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <button onClick={() => (isRecording ? stopRecording() : startRecording())} className={`flex items-center gap-2 p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Mic size={18} />{isRecording ? "Stop Recording" : "Voice Input"}</button>
                    <label className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><UploadCloud size={18} /> Upload File<input type="file" onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} className="hidden" /></label>
                  </div>
                )}
              </div>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className={`flex-1 px-4 py-3 rounded-full border shadow-sm focus:outline-none focus:ring-2 ${darkMode ? "bg-gray-900 border-gray-700 text-white focus:ring-purple-400" : "bg-white border-gray-300 focus:ring-indigo-400"}`} />
              <button onClick={sendMessage} className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:opacity-90">➤</button>
            </div>
            {fileName && <span className="text-xs opacity-70 mt-1">📂 {fileName}</span>}
          </div>
        )}
      </motion.div>
    </div>
  );
}
