import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  LogOut,
  User,
  Users,
  X,
  Settings,
} from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useSocketStore } from "../../store/useSocketStore.js";
import UserListItem from "./UserListItem.jsx";
import axiosInstance from "../../lib/axios.js";

const Sidebar = () => {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading, clearUnreadCount } =
    useChatStore();
  const { authUser, logout } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axiosInstance.get(`/users/search?query=${searchQuery}`);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayUsers = searchQuery ? searchResults : users;
  const filteredUsers = showOnlineOnly
    ? displayUsers.filter((u) => onlineUsers.includes(u._id))
    : displayUsers;

  const onlineCount = users.filter((u) => onlineUsers.includes(u._id)).length;

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    clearUnreadCount(user._id);
    setSearchQuery("");
  };

  return (
    <aside className="w-full md:w-80 flex-shrink-0 flex flex-col h-screen border-r border-white/5 bg-dark-900/50 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-100">Ethio Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/profile" className="btn-ghost p-2">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={logout} className="btn-ghost p-2 text-red-400 hover:text-red-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users..."
            className="glass-input w-full pl-9 pr-9 py-2.5 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Online filter */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>{onlineCount} online</span>
          </div>
          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
              showOnlineOnly
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            Online only
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {isUsersLoading ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-dark-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-dark-700 rounded w-3/4" />
                  <div className="h-2.5 bg-dark-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <User className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? "No users found" : showOnlineOnly ? "No one online" : "No users yet"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <UserListItem
                  user={user}
                  isSelected={selectedUser?._id === user._id}
                  isOnline={onlineUsers.includes(user._id)}
                  onClick={() => handleSelectUser(user)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Current User Footer */}
      <div className="p-3 border-t border-white/5">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group"
        >
          <div className="relative flex-shrink-0">
            {authUser?.profilePic ? (
              <img
                src={authUser.profilePic}
                alt={authUser.fullName}
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                {authUser?.fullName?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="online-dot" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{authUser?.fullName}</p>
            <p className="text-xs text-emerald-400">Active now</p>
          </div>
          <User className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
