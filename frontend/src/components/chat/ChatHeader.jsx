import { X, Phone, Video, ArrowLeft } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useCallStore } from "../../store/useCallStore.js";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";

const ChatHeader = ({ user, isOnline }) => {
  const { setSelectedUser } = useChatStore();
  const { startCall, callState } = useCallStore();
  const avatarGradient = generateAvatarColor(user?.fullName);

  const isBusy = callState !== "idle";

  const handleVoiceCall = () => {
    if (!user || isBusy) return;
    startCall(user, "audio");
  };

  const handleVideoCall = () => {
    if (!user || isBusy) return;
    startCall(user, "video");
  };

  return (
    <header className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-white/5 bg-dark-900/50 backdrop-blur-xl">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Back button — mobile only */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden btn-ghost p-1.5 text-slate-400 hover:text-slate-200 -ml-1"
          title="Back to contacts"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt={user.fullName}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover"
            />
          ) : (
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-sm font-bold text-white`}
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
      <div className="flex items-center gap-0.5 md:gap-1">
        <button
          onClick={handleVoiceCall}
          disabled={isBusy}
          title="Voice call"
          className={`btn-ghost p-2 transition-colors ${
            isBusy
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:text-emerald-400"
          }`}
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={handleVideoCall}
          disabled={isBusy}
          title="Video call"
          className={`btn-ghost p-2 transition-colors ${
            isBusy
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-400 hover:text-primary-400"
          }`}
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Close button — desktop only */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden md:flex btn-ghost p-2 text-slate-400 hover:text-red-400"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
