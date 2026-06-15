import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneIncoming,
} from "lucide-react";
import { useCallStore } from "../../store/useCallStore.js";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";

/* ─── tiny sub-component: avatar fallback ─── */
const UserAvatar = ({ user, size = "lg" }) => {
  const gradient = generateAvatarColor(user?.fullName);
  const dim = size === "lg" ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl";
  return user?.profilePic ? (
    <img
      src={user.profilePic}
      alt={user.fullName}
      className={`${dim} rounded-full object-cover ring-4 ring-white/20`}
    />
  ) : (
    <div
      className={`${dim} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white ring-4 ring-white/20`}
    >
      {getInitials(user?.fullName)}
    </div>
  );
};

/* ─── pulsing ring animation around avatar for ringing state ─── */
const PulsingRing = ({ children }) => (
  <div className="relative inline-flex items-center justify-center">
    <span className="absolute inline-flex w-full h-full rounded-full bg-primary-500/30 animate-ping" />
    <span className="absolute inline-flex w-[115%] h-[115%] rounded-full bg-primary-500/15 animate-ping [animation-delay:0.4s]" />
    {children}
  </div>
);

const CallModal = () => {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCallStore();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to local <video>
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote <video>
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isVisible = callState !== "idle";
  const isVideo   = callType === "video";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="call-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl bg-dark-900 border border-white/10"
            style={{ minHeight: isVideo && callState === "active" ? "480px" : "380px" }}
          >

            {/* ── VIDEO area (active video call) ──────────────────── */}
            {isVideo && callState === "active" && (
              <div className="relative w-full h-[480px] bg-black">
                {/* Remote (large) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Local (picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl bg-dark-800">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
                      <VideoOff className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── AVATAR area (audio call OR ringing/incoming) ────── */}
            {(!isVideo || callState !== "active") && (
              <div className="flex flex-col items-center justify-center pt-12 pb-6 gap-4 bg-gradient-to-b from-dark-800 to-dark-900">
                {callState === "calling" ? (
                  <PulsingRing>
                    <UserAvatar user={remoteUser} size="lg" />
                  </PulsingRing>
                ) : (
                  <UserAvatar user={remoteUser} size="lg" />
                )}

                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-100">
                    {remoteUser?.fullName ?? "Unknown"}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {callState === "calling"  && `${isVideo ? "Video" : "Voice"} calling…`}
                    {callState === "incoming" && `Incoming ${isVideo ? "video" : "voice"} call`}
                    {callState === "active"   && `${isVideo ? "Video" : "Voice"} call`}
                  </p>
                </div>

                {/* Audio-only active: hidden local audio element */}
                {callState === "active" && !isVideo && (
                  <audio ref={remoteVideoRef} autoPlay />
                )}
              </div>
            )}

            {/* ── CONTROLS ────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-4 py-6 bg-dark-900/80 backdrop-blur-sm">

              {/* ── INCOMING: reject + accept ── */}
              {callState === "incoming" && (
                <>
                  <ActionBtn
                    onClick={rejectCall}
                    icon={<PhoneOff className="w-6 h-6" />}
                    label="Decline"
                    color="bg-red-500 hover:bg-red-400"
                  />
                  <ActionBtn
                    onClick={acceptCall}
                    icon={<PhoneIncoming className="w-6 h-6" />}
                    label="Accept"
                    color="bg-emerald-500 hover:bg-emerald-400"
                  />
                </>
              )}

              {/* ── CALLING / ACTIVE: controls ── */}
              {(callState === "calling" || callState === "active") && (
                <>
                  {/* Mute */}
                  <ActionBtn
                    onClick={toggleMute}
                    icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    label={isMuted ? "Unmute" : "Mute"}
                    color={isMuted ? "bg-slate-600 hover:bg-slate-500" : "bg-white/10 hover:bg-white/20"}
                    small
                  />

                  {/* Camera (video calls only) */}
                  {isVideo && (
                    <ActionBtn
                      onClick={toggleCamera}
                      icon={isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      label={isCameraOff ? "Cam On" : "Cam Off"}
                      color={isCameraOff ? "bg-slate-600 hover:bg-slate-500" : "bg-white/10 hover:bg-white/20"}
                      small
                    />
                  )}

                  {/* End call */}
                  <ActionBtn
                    onClick={endCall}
                    icon={<PhoneOff className="w-6 h-6" />}
                    label="End"
                    color="bg-red-500 hover:bg-red-400"
                  />
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── reusable control button ─── */
const ActionBtn = ({ onClick, icon, label, color, small = false }) => (
  <div className="flex flex-col items-center gap-1.5">
    <button
      onClick={onClick}
      className={`${small ? "w-12 h-12" : "w-14 h-14"} rounded-full ${color} flex items-center justify-center text-white transition-all active:scale-90 shadow-lg`}
    >
      {icon}
    </button>
    <span className="text-[10px] text-slate-400">{label}</span>
  </div>
);

export default CallModal;
