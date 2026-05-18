import React, { useState, useRef, useEffect } from 'react';

const ChatbotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C3.99996 9.92179 4.43997 8.37488 5.27008 7.03258C6.10018 5.69028 7.28756 4.60553 8.69939 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3C17.1944 3 21 6.80558 21 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Chatbot({ context }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Data Science AI Tutor. I've reviewed your dataset and the bias findings. What questions do you have?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: context,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch response');
      const data = await response.json();
      
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform z-50"
        style={{
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          display: isOpen ? 'none' : 'flex'
        }}
      >
        <ChatbotIcon />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-50"
             style={{ background: '#0a1628', border: '1px solid rgba(20,184,166,0.3)' }}>
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between text-white"
               style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
            <div className="flex items-center gap-2 font-semibold">
              <ChatbotIcon />
              AI Tutor
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-slate-200">
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#14b8a6] text-white rounded-br-none' 
                    : 'bg-[#1e3a5f] text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1e3a5f] text-slate-200 rounded-xl p-3 text-sm rounded-bl-none border border-slate-700">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'rgba(20,184,166,0.2)', background: '#0d1d36' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data..."
                className="flex-1 bg-[#1e3a5f] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#14b8a6] border border-transparent focus:border-[#14b8a6]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors"
                style={{ background: '#14b8a6', opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
