import { create } from "zustand";
import { useSocketStore } from "./useSocketStore.js";
import toast from "react-hot-toast";

// Free STUN servers — good enough for most networks
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useCallStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────
  callState: "idle", // idle | calling | incoming | active
  callType: null,    // "audio" | "video"
  remoteUser: null,  // { _id, fullName, profilePic }
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  incomingOffer: null, // RTCSessionDescriptionInit from caller

  peerConnection: null,

  // ── Helpers ────────────────────────────────────────────────────
  _getSocket: () => useSocketStore.getState().socket,

  _createPeer: () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    return pc;
  },

  // ── Initiate a call ───────────────────────────────────────────
  startCall: async (targetUser, callType) => {
    const { _createPeer, _getSocket } = get();
    const socket = _getSocket();
    if (!socket) return;

    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      const pc = _createPeer();

      // Add local tracks to peer connection
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // Collect remote stream
      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      // Send ICE candidates to remote peer
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice-candidate", {
            to: targetUser._id,
            candidate: e.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          get().endCall();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Notify the callee
      socket.emit("call:initiate", {
        to: targetUser._id,
        offer,
        callType,
        callerInfo: null, // server fills callerInfo via userId
      });

      set({
        callState: "calling",
        callType,
        remoteUser: targetUser,
        localStream,
        remoteStream,
        peerConnection: pc,
        isMuted: false,
        isCameraOff: false,
      });
    } catch (err) {
      console.error("startCall error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Please allow camera/microphone access to make calls.");
      } else {
        toast.error("Could not start call. Check your devices.");
      }
    }
  },

  // ── Accept an incoming call ────────────────────────────────────
  acceptCall: async () => {
    const { incomingOffer, callType, remoteUser, _createPeer, _getSocket } = get();
    const socket = _getSocket();
    if (!socket || !incomingOffer || !remoteUser) return;

    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      const pc = _createPeer();

      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
        set({ remoteStream });
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("call:ice-candidate", {
            to: remoteUser._id,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          get().endCall();
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { to: remoteUser._id, answer });

      set({
        callState: "active",
        localStream,
        remoteStream,
        peerConnection: pc,
        incomingOffer: null,
        isMuted: false,
        isCameraOff: false,
      });
    } catch (err) {
      console.error("acceptCall error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Please allow camera/microphone access.");
      } else {
        toast.error("Could not connect. Check your devices.");
      }
      get().endCall();
    }
  },

  // ── Reject an incoming call ────────────────────────────────────
  rejectCall: () => {
    const { remoteUser, _getSocket } = get();
    const socket = _getSocket();
    if (socket && remoteUser) {
      socket.emit("call:end", { to: remoteUser._id });
    }
    get()._cleanup();
  },

  // ── End / hang up ─────────────────────────────────────────────
  endCall: () => {
    const { remoteUser, _getSocket } = get();
    const socket = _getSocket();
    if (socket && remoteUser) {
      socket.emit("call:end", { to: remoteUser._id });
    }
    get()._cleanup();
  },

  // ── Stop all tracks and reset state ───────────────────────────
  _cleanup: () => {
    const { localStream, peerConnection } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    peerConnection?.close();
    set({
      callState: "idle",
      callType: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      incomingOffer: null,
      peerConnection: null,
      isMuted: false,
      isCameraOff: false,
    });
  },

  // ── Toggle mic ────────────────────────────────────────────────
  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = isMuted; // flip: if was muted, enable; vice versa
    });
    set({ isMuted: !isMuted });
  },

  // ── Toggle camera ─────────────────────────────────────────────
  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = isCameraOff;
    });
    set({ isCameraOff: !isCameraOff });
  },

  // ── Socket event handlers (registered once on app mount) ──────
  handleIncomingCall: ({ from, offer, callType, callerInfo }) => {
    const { callState } = get();
    // Already in a call — auto-reject
    if (callState !== "idle") {
      const socket = get()._getSocket();
      if (socket) socket.emit("call:end", { to: from });
      return;
    }
    // Ensure _id is always set (fallback to `from`)
    const enrichedCallerInfo = { _id: from, ...callerInfo };
    set({
      callState: "incoming",
      callType,
      remoteUser: enrichedCallerInfo,
      incomingOffer: offer,
    });
  },

  handleCallAnswered: async ({ answer }) => {
    const { peerConnection } = get();
    if (!peerConnection) return;
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      set({ callState: "active" });
    } catch (err) {
      console.error("handleCallAnswered error:", err);
    }
  },

  handleIceCandidate: async ({ candidate }) => {
    const { peerConnection } = get();
    if (!peerConnection || !candidate) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("addIceCandidate error:", err);
    }
  },

  handleCallEnded: () => {
    const { callState } = get();
    if (callState !== "idle") {
      toast("Call ended", { icon: "📵" });
      get()._cleanup();
    }
  },

  // ── Register / deregister socket listeners ────────────────────
  subscribeToCallEvents: () => {
    const socket = get()._getSocket();
    if (!socket) return;

    socket.on("call:incoming",      get().handleIncomingCall);
    socket.on("call:answered",      get().handleCallAnswered);
    socket.on("call:ice-candidate", get().handleIceCandidate);
    socket.on("call:ended",         get().handleCallEnded);
  },

  unsubscribeFromCallEvents: () => {
    const socket = get()._getSocket();
    if (!socket) return;
    socket.off("call:incoming");
    socket.off("call:answered");
    socket.off("call:ice-candidate");
    socket.off("call:ended");
  },
}));
