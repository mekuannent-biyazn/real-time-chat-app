import { X, Phone, Video, MoreVertical } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";

const ChatHeader = ({ user, isOnline }) => {
  const { setSelectedUser } = useChatStore();
  const avatarGradient = generateAvatarColor(user?.fullName);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-dark-900/50 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt={user.fullName}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-sm font-bold text-white`}
            >
              {getInitials(user?.fullName)}
            </div>
          )}
          {isOnline && <span className="online-dot" />}
        </div>

        {/* Name & status */}
        <div>
          <h2 className="font-semibold text-slate-100 text-sm">{user?.fullName}</h2>
          <p className={`text-xs ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="btn-ghost p-2 text-slate-400" title="Voice call (coming soon)">
          <Phone className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2 text-slate-400" title="Video call (coming soon)">
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          className="btn-ghost p-2 text-slate-400 hover:text-red-400"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
