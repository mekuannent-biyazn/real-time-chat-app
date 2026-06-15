import { create } from "zustand";
import { useSocketStore } from "./useSocketStore.js";

// ─── tiny notification sound (base64 encoded short beep) ───────────────────
// We generate it programmatically via Web Audio API so no asset file is needed
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {
    // AudioContext blocked — fine, just skip the sound
  }
};

// ─── request browser permission ────────────────────────────────────────────
const requestPermission = async () => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
};

// ─── fire a native browser notification ────────────────────────────────────
const showBrowserNotification = (title, body, icon, tag, onClick) => {
  if (Notification.permission !== "granted") return;
  // Don't show if window is focused
  if (document.hasFocus()) return;

  const n = new Notification(title, {
    body,
    icon: icon || "/chat-icon.svg",
    tag,          // same tag = replace instead of stack
    badge: "/chat-icon.svg",
    silent: false,
  });
  n.onclick = () => {
    window.focus();
    n.close();
    onClick?.();
  };
  // Auto-close after 5 s
  setTimeout(() => n.close(), 5000);
};

// ─── update browser tab title ───────────────────────────────────────────────
const updateTabTitle = (totalUnread) => {
  document.title =
    totalUnread > 0 ? `(${totalUnread}) Ethio Chat` : "Ethio Chat";
};

export const useNotificationStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  notifications: [],        // [{ id, senderId, senderName, senderPic, text, type, timestamp, read }]
  permissionStatus: Notification?.permission ?? "default",
  soundEnabled: true,

  // ── Derived ────────────────────────────────────────────────────────────────
  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },

  // ── Permission request ─────────────────────────────────────────────────────
  requestPermission: async () => {
    const status = await requestPermission();
    set({ permissionStatus: status });
    return status;
  },

  // ── Push a new notification ────────────────────────────────────────────────
  addNotification: (notification) => {
    const { soundEnabled } = get();
    const id = `${Date.now()}-${Math.random()}`;
    const newEntry = { id, read: false, timestamp: new Date(), ...notification };

    set((state) => ({
      notifications: [newEntry, ...state.notifications].slice(0, 50), // keep latest 50
    }));

    // Sound
    if (soundEnabled) playNotificationSound();

    // Tab title
    const total = get().notifications.filter((n) => !n.read).length;
    updateTabTitle(total);

    // Browser notification
    const previewText =
      notification.type === "image"   ? "📷 Photo"
    : notification.type === "file"    ? `📎 ${notification.text || "File"}`
    : notification.type === "call"    ? notification.text
    : notification.text?.slice(0, 80) || "New message";

    showBrowserNotification(
      notification.senderName || "New message",
      previewText,
      notification.senderPic,
      notification.senderId, // tag = sender, so same-sender pings replace each other
      notification.onClick,
    );
  },

  // ── Mark one notification read ─────────────────────────────────────────────
  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    const total = get().notifications.filter((n) => !n.read).length;
    updateTabTitle(total);
  },

  // ── Mark all from a sender read (called when user opens that chat) ──────────
  markAllReadFromSender: (senderId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.senderId === senderId ? { ...n, read: true } : n
      ),
    }));
    const total = get().notifications.filter((n) => !n.read).length;
    updateTabTitle(total);
  },

  // ── Mark every notification read ──────────────────────────────────────────
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    updateTabTitle(0);
  },

  // ── Clear all ──────────────────────────────────────────────────────────────
  clearAll: () => {
    set({ notifications: [] });
    updateTabTitle(0);
  },

  // ── Toggle sound ──────────────────────────────────────────────────────────
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

  // ── Register socket listeners ──────────────────────────────────────────────
  // Called from App.jsx whenever socket connects (same pattern as useCallStore)
  subscribeToNotifications: (authUser, selectedUserRef) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.on("notification:new", (data) => {
      // Don't notify for messages from the currently open conversation
      const openUserId = selectedUserRef?.current;
      if (data.senderId === openUserId) return;

      get().addNotification({
        ...data,
        onClick: data.onClick, // caller can pass an onClick
      });
    });
  },

  unsubscribeFromNotifications: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;
    socket.off("notification:new");
  },
}));
