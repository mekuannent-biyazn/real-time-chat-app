import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

const ChatWindow = () => {
  const {
    messages,
    getMessages,
    selectedUser,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const messagesEndRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    setShowScrollBtn(!isNearBottom);
  };

  const isTyping = typingUsers[selectedUser?._id];
  const isOnline = onlineUsers.includes(selectedUser?._id);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-dark-950/50">
      <ChatHeader user={selectedUser} isOnline={isOnline} />

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {isMessagesLoading ? (
          <div className="flex flex-col gap-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
              >
                <div className="w-8 h-8 rounded-xl bg-dark-700 animate-pulse flex-shrink-0" />
                <div
                  className={`h-10 bg-dark-700 rounded-2xl animate-pulse ${
                    i % 2 === 0 ? "w-48" : "w-36"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Say hello to {selectedUser?.fullName}!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-slate-500 px-2 py-1 bg-dark-800 rounded-full">
                  {new Date(date).toDateString() === new Date().toDateString()
                    ? "Today"
                    : new Date(date).toDateString() ===
                      new Date(Date.now() - 86400000).toDateString()
                    ? "Yesterday"
                    : date}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {msgs.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={
                    (message.senderId?._id || message.senderId) === authUser._id
                  }
                  showAvatar={
                    index === 0 ||
                    (msgs[index - 1]?.senderId?._id || msgs[index - 1]?.senderId) !==
                      (message.senderId?._id || message.senderId)
                  }
                />
              ))}
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator user={selectedUser} />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-full shadow-lg flex items-center justify-center text-white transition-colors"
          >
            ↓
          </motion.button>
        )}
      </AnimatePresence>

      <MessageInput />
    </div>
  );
};

export default ChatWindow;
