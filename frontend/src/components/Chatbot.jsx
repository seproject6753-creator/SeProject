import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosWrapper from "../utils/AxiosWrapper";

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const initialMessages = useMemo(
    () => [
      { role: "bot", text: "Hi! I'm your college helper. Ask me about office hours, timetables, exams, societies, and more." },
    ],
    []
  );
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const resp = await axiosWrapper.post("/gemini/ask", { question: q, includeKB: true });
      const data = resp?.data?.data;
      let reply = data?.answer || "Sorry, I couldn't find an answer.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch (e) {
      const serverMsg = e?.response?.data?.message;
      const msg = serverMsg
        ? `Chatbot error: ${serverMsg}`
        : "There was a problem reaching the chatbot. Please check your internet and try again.";
      setMessages((m) => [...m, { role: "bot", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages(initialMessages);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 rounded-full px-4 py-3 shadow-lg focus:outline-none text-white transition-all"
        style={{ backgroundImage: "linear-gradient(90deg,#00D1B2,#7C4DFF)" }}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        {open ? "Close Chat" : "Chatbot"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
          <div className="px-3 py-2 flex items-center justify-between border-b border-white/10" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,209,178,0.2),rgba(124,77,255,0.2))" }}>
            <div className="font-semibold">College Assistant</div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded"
                title="Clear chat"
              >
                Clear
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="p-3 space-y-3 h-80 overflow-y-auto bg-transparent">
            {messages.map((m, idx) => (
              <div key={idx} className={`whitespace-pre-wrap text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                    m.role === "user"
                      ? "text-white"
                      : "bg-slate-800/60 border border-white/10 text-slate-200"
                  }`}
                  style={m.role === "user" ? { backgroundImage: "linear-gradient(90deg,#00D1B2,#7C4DFF)" } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left text-sm">
                <div className="inline-block px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-white/10 flex items-center gap-2 bg-slate-900/60">
            <textarea
              className="flex-1 resize-none rounded-md bg-slate-800/60 border border-white/10 p-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              rows={2}
              placeholder="Ask about timings, exams, societies... (Gemini)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-3 py-2 rounded-md text-white disabled:opacity-50"
              style={{ backgroundImage: "linear-gradient(90deg,#00D1B2,#7C4DFF)" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
