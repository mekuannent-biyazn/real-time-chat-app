import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, X, Image } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useChatStore } from "../../store/useChatStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import { compressImage } from "../../lib/utils.js";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useSocketStore();

  const handleTyping = useCallback(() => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { receiverId: selectedUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }, 1500);
  }, [socket, selectedUser]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }
    const compressed = await compressImage(file, 800, 0.8);
    setImagePreview(compressed);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket?.emit("stopTyping", { receiverId: selectedUser._id });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // On mobile (touch devices) don't submit on Enter — let them use the send button
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-3 md:px-4 py-3 border-t border-white/5 bg-dark-900/50 backdrop-blur-xl">
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 md:h-24 w-auto rounded-xl object-cover border border-white/10"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 md:gap-2">
        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="btn-ghost p-2 md:p-2.5 flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                // On mobile: fixed centered overlay; on desktop: absolute above button
                className="fixed md:absolute bottom-20 md:bottom-12 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 z-50"
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="glass-input w-full resize-none py-2.5 pr-4 text-sm leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
        </div>

        {/* Image upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost p-2 md:p-2.5 flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
