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
    // Optional: confirm to avoid accidental clears
    // if (!window.confirm("Clear chat?")) return;
    setMessages(initialMessages);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-600 text-white px-4 py-3 shadow-lg hover:bg-blue-700 focus:outline-none"
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        {open ? "Close Chat" : "Chatbot"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white px-3 py-2 flex items-center justify-between">
            <div className="font-semibold">College Assistant</div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded"
                title="Clear chat"
              >
                Clear
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="p-3 space-y-3 h-80 overflow-y-auto bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`whitespace-pre-wrap text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                <div className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left text-sm">
                <div className="inline-block px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-500">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-gray-200 flex items-center gap-2">
            <textarea
              className="flex-1 resize-none rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={2}
              placeholder="Ask about timings, exams, societies... (Gemini)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
