import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2, User, Mail, FileText, Save } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { getInitials, generateAvatarColor, compressImage } from "../lib/utils.js";

const ProfilePage = () => {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    profilePic: null,
  });
  const [previewUrl, setPreviewUrl] = useState(authUser?.profilePic || "");
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    const compressed = await compressImage(file, 400, 0.85);
    setPreviewUrl(compressed);
    setFormData((prev) => ({ ...prev, profilePic: compressed }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updateData = { fullName: formData.fullName, bio: formData.bio };
    if (formData.profilePic) updateData.profilePic = formData.profilePic;
    await updateProfile(updateData);
  };

  const avatarGradient = generateAvatarColor(authUser?.fullName);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Profile Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account information</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-primary-500/30"
                />
              ) : (
                <div
                  className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-3xl font-bold text-white ring-4 ring-primary-500/30`}
                >
                  {getInitials(authUser?.fullName)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Change photo
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                type="text"
                className="glass-input w-full"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                className="glass-input w-full opacity-60 cursor-not-allowed"
                value={authUser?.email || ""}
                disabled
              />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Bio
              </label>
              <textarea
                className="glass-input w-full resize-none"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell people a little about yourself..."
                maxLength={150}
              />
              <p className="text-xs text-slate-500 text-right">{formData.bio.length}/150</p>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>

          {/* Account Info */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Account Info</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p>
                Member since:{" "}
                <span className="text-slate-300">
                  {new Date(authUser?.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
