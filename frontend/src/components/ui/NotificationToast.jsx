import { motion } from "framer-motion";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";

/**
 * Rich in-app notification toast.
 * Used with react-hot-toast's custom render:
 *   toast.custom((t) => <NotificationToast t={t} notif={notif} onClick={...} />)
 */
const NotificationToast = ({ t, notif, onClick }) => {
  const gradient = generateAvatarColor(notif.senderName);

  const preview =
    notif.type === "image"  ? "📷 Photo"
  : notif.type === "file"   ? `📎 ${notif.text}`
  : notif.type === "call"   ? notif.text
  : notif.text?.slice(0, 60) || "New message";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl cursor-pointer hover:bg-dark-700 transition-colors max-w-sm w-full"
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
        {/* type emoji badge */}
        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-dark-800 rounded-full border border-dark-800 flex items-center justify-center text-[10px]">
          {notif.type === "image" ? "📷" : notif.type === "file" ? "📎" : notif.type === "call" ? "📞" : "💬"}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 truncate">{notif.senderName}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{preview}</p>
      </div>

      {/* Tap hint */}
      <div className="flex-shrink-0 text-[10px] text-slate-600">tap</div>
    </motion.div>
  );
};

export default NotificationToast;
