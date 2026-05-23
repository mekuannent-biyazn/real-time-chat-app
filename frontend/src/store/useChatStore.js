import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";
import { useSocketStore } from "./useSocketStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isFromSelectedUser =
        newMessage.senderId._id === selectedUser._id ||
        newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) {
        // Update unread count for sidebar
        set((state) => ({
          users: state.users.map((u) =>
            u._id === (newMessage.senderId._id || newMessage.senderId)
              ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
              : u
          ),
        }));
        return;
      }
      set((state) => ({ messages: [...state.messages, newMessage] }));
    });

    socket.on("messageDeleted", (messageId) => {
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });

    socket.on("messageReaction", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socket.on("userTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set((state) => ({
          typingUsers: { ...state.typingUsers, [senderId]: true },
        }));
      }
    });

    socket.on("userStopTyping", ({ senderId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[senderId];
        return { typingUsers: updated };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageReaction");
    socket.off("userTyping");
    socket.off("userStopTyping");
  },

  clearUnreadCount: (userId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u._id === userId ? { ...u, unreadCount: 0 } : u
      ),
    }));
  },
}));
