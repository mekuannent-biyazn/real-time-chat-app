import { getInitials, generateAvatarColor, formatMessageTime } from "../../lib/utils.js";

const UserListItem = ({ user, isSelected, isOnline, onClick }) => {
  const avatarGradient = generateAvatarColor(user.fullName);

  return (
    <button
      onClick={onClick}
      className={`sidebar-item w-full text-left ${isSelected ? "sidebar-item-active" : ""}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.profilePic ? (
          <img
            src={user.profilePic}
            alt={user.fullName}
            className="w-11 h-11 rounded-xl object-cover"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-sm font-bold text-white`}
          >
            {getInitials(user.fullName)}
          </div>
        )}
        {isOnline && <span className="online-dot" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200 truncate">{user.fullName}</span>
          {user.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 w-5 h-5 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
              {user.unreadCount > 9 ? "9+" : user.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {isOnline ? (
            <span className="text-emerald-400">Online</span>
          ) : (
            user.bio || user.email
          )}
        </p>
      </div>
    </button>
  );
};

export default UserListItem;
