import { motion } from "framer-motion";
import { getInitials, generateAvatarColor } from "../../lib/utils.js";

const TypingIndicator = ({ user }) => {
  const avatarGradient = generateAvatarColor(user?.fullName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-end gap-2 mb-2"
    >
      <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
        {user?.profilePic ? (
          <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white`}
          >
            {getInitials(user?.fullName)}
          </div>
        )}
      </div>
      <div className="message-bubble-received flex items-center gap-1 py-3 px-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
