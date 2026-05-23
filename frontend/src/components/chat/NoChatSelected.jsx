import { motion } from "framer-motion";
import { MessageSquare, Users, Zap, Shield } from "lucide-react";

const features = [
  { icon: Zap, label: "Real-time messaging", desc: "Instant delivery with Socket.io" },
  { icon: Users, label: "Online presence", desc: "See who's active right now" },
  { icon: Shield, label: "Secure & private", desc: "JWT auth + encrypted cookies" },
];

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 bg-dark-950/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-600/20 to-violet-600/20 border border-primary-500/20 flex items-center justify-center">
            <MessageSquare className="w-12 h-12 text-primary-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-dark-950 flex items-center justify-center">
            <span className="text-xs">✓</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-2">Your messages</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Select a conversation from the sidebar to start chatting, or search for someone new.
        </p>

        {/* Features */}
        <div className="space-y-3">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 glass-card text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NoChatSelected;
