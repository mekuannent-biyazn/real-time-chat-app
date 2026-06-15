import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore.js";
import { useCallStore } from "./store/useCallStore.js";
import { useSocketStore } from "./store/useSocketStore.js";
import { useNotificationStore } from "./store/useNotificationStore.js";
import { useChatStore } from "./store/useChatStore.js";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoadingScreen from "./components/ui/LoadingScreen.jsx";
import CallModal from "./components/call/CallModal.jsx";
import NotificationToast from "./components/ui/NotificationToast.jsx";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { subscribeToCallEvents, unsubscribeFromCallEvents } = useCallStore();
  const { socket } = useSocketStore();
  const {
    addNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markAllReadFromSender,
    requestPermission,
  } = useNotificationStore();
  const { selectedUser, setSelectedUser, clearUnreadCount, users } = useChatStore();

  // Keep a ref to the currently open chat so the socket listener always reads the latest value
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser?._id ?? null;
  }, [selectedUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Request browser notification permission once user is authenticated
  useEffect(() => {
    if (authUser) requestPermission();
  }, [authUser, requestPermission]);

  // Register call socket listeners
  useEffect(() => {
    if (!socket) return;
    subscribeToCallEvents();
    return () => unsubscribeFromCallEvents();
  }, [socket, subscribeToCallEvents, unsubscribeFromCallEvents]);

  // Register notification socket listeners + in-app toast handler
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      // Skip if the message is from the currently open conversation
      if (data.senderId === selectedUserRef.current) return;

      // Add to notification center
      addNotification(data);

      // Show in-app rich toast
      toast.custom(
        (t) => (
          <NotificationToast
            t={t}
            notif={data}
            onClick={() => {
              toast.dismiss(t.id);
              const user = users.find((u) => u._id === data.senderId);
              if (user) {
                setSelectedUser(user);
                clearUnreadCount(user._id);
                markAllReadFromSender(user._id);
              }
            }}
          />
        ),
        { duration: 4000, position: "top-right" }
      );
    };

    socket.on("notification:new", handleNotification);
    return () => socket.off("notification:new", handleNotification);
  }, [socket, users, addNotification, setSelectedUser, clearUnreadCount, markAllReadFromSender]);

  if (isCheckingAuth) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh">
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
      </Routes>

      {/* Global call overlay */}
      <CallModal />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: {
            iconTheme: { primary: "#34d399", secondary: "#1e293b" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#1e293b" },
          },
        }}
      />
    </div>
  );
};

export default App;
