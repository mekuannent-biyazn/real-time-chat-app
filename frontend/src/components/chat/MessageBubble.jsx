import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Smile, Download, FileText, Film, Music, Archive } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useChatStore } from "../../store/useChatStore.js";
import { formatMessageTime, getInitials, generateAvatarColor } from "../../lib/utils.js";

const FileIcon = ({ mimeType, className = "w-5 h-5" }) => {
  if (!mimeType) return <FileText className={className} />;
  if (mimeType.startsWith("video/"))  return <Film     className={className} />;
  if (mimeType.startsWith("audio/"))  return <Music    className={className} />;
  if (mimeType.includes("pdf"))       return <FileText className={className} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z"))
                                      return <Archive  className={className} />;
  return <FileText className={className} />;
};

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageBubble = ({ message, isOwn, showAvatar }) => {
  const { deleteMessage, addReaction } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef(null);
  const longPressTimer = useRef(null);

  const sender = message.senderId;
  const avatarGradient = generateAvatarColor(sender?.fullName);

  const handleReaction = (emoji) => {
    addReaction(message._id, emoji.native);
    setShowEmojiPicker(false);
    setShowActions(false);
  };

  // Long-press for mobile to show actions
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  // Group reactions
  const reactionGroups = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-1.5 md:gap-2 mb-1 group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      <div className="w-7 md:w-8 flex-shrink-0">
        {!isOwn && showAvatar && (
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl overflow-hidden">
            {sender?.profilePic ? (
              <img
                src={sender.profilePic}
                alt={sender.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white`}
              >
                {getInitials(sender?.fullName)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bubble + actions */}
      <div
        className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[80%] md:max-w-[70%]`}
      >
        {/* Actions — shown on hover (desktop) or long-press (mobile) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-1 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmojiPicker && (
                  <div
                    ref={pickerRef}
                    className={`fixed md:absolute z-50 bottom-20 md:bottom-8 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 ${
                      isOwn ? "md:right-0" : "md:left-0"
                    }`}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={handleReaction}
                      theme="dark"
                      previewPosition="none"
                      skinTonePosition="none"
                      maxFrequentRows={1}
                    />
                  </div>
                )}
              </div>
              {isOwn && (
                <button
                  onClick={() => deleteMessage(message._id)}
                  className="p-1.5 rounded-lg bg-dark-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message content */}
        <div className={isOwn ? "message-bubble-sent" : "message-bubble-received"}>
          {message.image && (
            <img
              src={message.image}
              alt="Attachment"
              className="rounded-xl max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.image, "_blank")}
            />
          )}
          {message.file && (
            <a
              href={message.file}
              target="_blank"
              rel="noopener noreferrer"
              download={message.fileName || true}
              className="flex items-center gap-2.5 mb-2 px-3 py-2.5 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 transition-colors group/file"
            >
              <FileIcon
                mimeType={message.fileType}
                className="w-6 h-6 text-primary-400 flex-shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {message.fileName || "File"}
                </span>
                {message.fileSize > 0 && (
                  <span className="text-[10px] text-slate-500">
                    {formatBytes(message.fileSize)}
                  </span>
                )}
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover/file:text-primary-400 flex-shrink-0 transition-colors" />
            </a>
          )}
          {message.text && (
            <p className="text-sm leading-relaxed break-words">{message.text}</p>
          )}
          <p
            className={`text-[10px] mt-1 ${
              isOwn ? "text-primary-200/70" : "text-slate-500"
            } text-right`}
          >
            {formatMessageTime(message.createdAt)}
            {isOwn && <span className="ml-1">{message.isRead ? "✓✓" : "✓"}</span>}
          </p>
        </div>

        {/* Reactions */}
        {reactionGroups && Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => addReaction(message._id, emoji)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-dark-800 hover:bg-dark-700 rounded-full text-xs border border-white/5 transition-all"
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-slate-400">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
