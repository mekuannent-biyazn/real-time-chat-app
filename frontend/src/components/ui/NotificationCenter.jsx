import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, CheckCheck, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";
import { formatDistanceToNow } from "date-fns";

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const {
    notifications,
    unreadCount,
    soundEnabled,
    permissionStatus,
    markRead,
    markAllRead,
    clearAll,
    toggleSound,
    requestPermission,
  } = useNotificationStore();

  const { users, setSelectedUser, clearUnreadCount } = useChatStore();

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Derived unread count from store getter
  const totalUnread = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif) => {
    // Open the corresponding chat
    const user = users.find((u) => u._id === notif.senderId);
    if (user) {
      setSelectedUser(user);
      clearUnreadCount(user._id);
    }
    markRead(notif.id);
    setOpen(false);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <div ref={panelRef} className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost p-2 relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none"
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </motion.span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 max-h-[480px] flex flex-col rounded-2xl border border-white/10 bg-dark-900 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full">
                    {totalUnread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Sound toggle */}
                <button
                  onClick={toggleSound}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                  title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {/* Mark all read */}
                {totalUnread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Clear all */}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Browser permission banner */}
            {permissionStatus === "default" && (
              <div className="mx-3 mt-3 px-3 py-2.5 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                <p className="text-xs text-primary-300 mb-2">
                  Enable browser notifications to get alerts even when Ethio Chat is in the background.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  Enable Notifications
                </button>
              </div>
            )}

            {permissionStatus === "denied" && (
              <div className="mx-3 mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-xs text-yellow-400">
                  Browser notifications are blocked. Enable them in your browser settings.
                </p>
              </div>
            )}

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto py-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <BellOff className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onClick={() => handleNotificationClick(notif)}
                      onMarkRead={() => markRead(notif.id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── single notification row ── */
const NotificationItem = ({ notif, onClick, onMarkRead }) => {
  const gradient = generateAvatarColor(notif.senderName);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      className={`group flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-all ${
        !notif.read ? "bg-primary-500/5" : ""
      }`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {notif.senderPic ? (
          <img
            src={notif.senderPic}
            alt={notif.senderName}
            className="w-10 h-10 rounded-xl object-cover"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white`}
          >
            {getInitials(notif.senderName)}
          </div>
        )}
        {/* Type indicator dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-dark-900 border border-dark-900 flex items-center justify-center text-[10px]">
          {notif.type === "image" ? "📷" : notif.type === "file" ? "📎" : notif.type === "call" ? "📞" : "💬"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-medium truncate ${!notif.read ? "text-slate-100" : "text-slate-400"}`}>
            {notif.senderName}
          </span>
          <span className="text-[10px] text-slate-600 flex-shrink-0">
            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
          </span>
        </div>
        <p className={`text-xs mt-0.5 truncate ${!notif.read ? "text-slate-300" : "text-slate-500"}`}>
          {notif.text}
        </p>
      </div>

      {/* Unread dot + mark-read btn */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {!notif.read && (
          <span className="w-2 h-2 rounded-full bg-primary-500 mt-1" />
        )}
        {!notif.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-emerald-400"
            title="Mark as read"
          >
            <Check className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
