import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, X, Image, Paperclip, FileText, Film, Music, Archive } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useChatStore } from "../../store/useChatStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import { compressImage } from "../../lib/utils.js";

// Max sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_FILE_SIZE  = 25 * 1024 * 1024;  // 25 MB

// Returns a lucide icon component based on MIME type
const FileIcon = ({ mimeType, className = "w-5 h-5" }) => {
  if (!mimeType) return <FileText className={className} />;
  if (mimeType.startsWith("video/"))       return <Film      className={className} />;
  if (mimeType.startsWith("audio/"))       return <Music     className={className} />;
  if (mimeType.includes("pdf"))            return <FileText  className={className} />;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z"))
                                           return <Archive   className={className} />;
  return <FileText className={className} />;
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [fileAttachment, setFileAttachment] = useState(null); // { name, type, size, data }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const imageInputRef = useRef(null);
  const fileInputRef  = useRef(null);
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

  // ---------- Image ----------
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image must be less than 10 MB");
      return;
    }
    const compressed = await compressImage(file, 800, 0.8);
    setImagePreview(compressed);
    // Clear any non-image file attachment if user picks an image
    setFileAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // ---------- Generic file ----------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // If it's actually an image, route through image handler for preview
    if (file.type.startsWith("image/")) {
      handleImageChange(e);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File must be less than 25 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        data: ev.target.result, // base64 data URL
      });
      // Clear image attachment
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFileAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------- Emoji ----------
  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview && !fileAttachment) || isSending) return;

    setIsSending(true);
    try {
      const payload = { text: text.trim() };
      if (imagePreview) {
        payload.image = imagePreview;
      } else if (fileAttachment) {
        payload.file     = fileAttachment.data;
        payload.fileName = fileAttachment.name;
        payload.fileType = fileAttachment.type;
        payload.fileSize = fileAttachment.size;
      }

      await sendMessage(payload);
      setText("");
      setImagePreview(null);
      setFileAttachment(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current)  fileInputRef.current.value  = "";
      socket?.emit("stopTyping", { receiverId: selectedUser._id });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasAttachment = imagePreview || fileAttachment;

  return (
    <div className="px-3 md:px-4 py-3 border-t border-white/5 bg-dark-900/50 backdrop-blur-xl">

      {/* ── Attachment preview ─────────────────────────────── */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            key="image-preview"
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

        {fileAttachment && (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-dark-800 max-w-xs">
              <FileIcon mimeType={fileAttachment.type} className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-200 truncate">{fileAttachment.name}</span>
                <span className="text-[10px] text-slate-500">{formatBytes(fileAttachment.size)}</span>
              </div>
              <button
                onClick={removeFile}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input row ──────────────────────────────────────── */}
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

        {/* Image upload button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          title="Send image"
          className="btn-ghost p-2 md:p-2.5 flex-shrink-0"
        >
          <Image className="w-5 h-5" />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Generic file upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Send file"
          className="btn-ghost p-2 md:p-2.5 flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!text.trim() && !hasAttachment) || isSending}
          className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
