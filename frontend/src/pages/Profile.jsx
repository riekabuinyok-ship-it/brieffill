import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";

const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/..." },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/..." },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/..." },
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [toast, setToast] = useState(null);
  const avatarInputRef = useRef(null);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    displayName: user?.displayName || user?.name || "",
    bio: user?.bio || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
    location: user?.location || "",
    website: user?.website || "",
    socialLinks: user?.socialLinks || {},
    avatarPreview: null,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif)$/i.test(file.name)) {
      setToast({ message: "Only JPG, PNG, and GIF files are allowed", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: "File must be under 5MB", type: "error" });
      return;
    }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.post("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile({ ...profile, avatarPreview: URL.createObjectURL(file) });
      setToast({ message: "Profile picture updated", type: "success" });
      await refreshUser();
    } catch {
      setToast({ message: "Failed to upload", type: "error" });
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await api.patch("/auth/me", {
        name: profile.displayName,
        first_name: profile.firstName,
        last_name: profile.lastName,
        display_name: profile.displayName,
        bio: profile.bio,
        company: profile.company,
        job_title: profile.jobTitle,
        location: profile.location,
        website: profile.website,
        social_links: profile.socialLinks,
      });
      setToast({ message: "Profile saved", type: "success" });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      await refreshUser();
    } catch {
      setToast({ message: "Failed to save", type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Profile</h1>
        <p className="text-sm text-on-surface-variant">Manage your personal profile and avatar.</p>
      </div>

      <form onSubmit={saveProfile} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-fixed bg-primary-container/20 overflow-hidden">
              {profile.avatarPreview ? (
                <img src={profile.avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : user?.avatarUrl ? (
                <>
                  <img src={user.avatarUrl.startsWith("http") || user.avatarUrl.startsWith("/uploads/") ? user.avatarUrl : `/uploads/avatars/${user.avatarUrl}`} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling?.classList.remove("hidden"); }} />
                  <Icon name="person" className="hidden text-3xl text-primary" />
                </>
              ) : (
                <Icon name="person" className="text-3xl text-primary" />
              )}
            </div>
            <button type="button" onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Icon name="camera_alt" className="text-[20px]" />
            </button>
            <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png,.gif" className="hidden"
              onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-on-surface">Profile Picture</p>
            <p className="text-xs text-on-surface-variant">JPG, PNG, or GIF. Max 5MB. 200x200px recommended.</p>
          </div>
          {avatarUploading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">First Name</label>
            <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Last Name</label>
            <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Display Name</label>
            <input type="text" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="How your name appears" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Email</label>
          <input type="email" value={user?.email || ""} readOnly
            className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface-variant cursor-not-allowed" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">
            Bio <span className="font-normal lowercase">({profile.bio.length}/200)</span>
          </label>
          <textarea rows={3} value={profile.bio} onChange={(e) => e.target.value.length <= 200 && setProfile({ ...profile, bio: e.target.value })}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" placeholder="Short bio" />
        </div>

        {/* Professional Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Company</label>
            <input type="text" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Job Title</label>
            <input type="text" value={profile.jobTitle} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Creative Director" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Location</label>
            <input type="text" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="City, Country" />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Website / Portfolio</label>
          <input type="url" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="https://yourportfolio.com" />
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-xs font-bold uppercase text-on-surface-variant tracking-wider mb-1">Social Links</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((sp) => (
              <div key={sp.key} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant w-20 shrink-0 uppercase tracking-wider">{sp.label}</span>
                <input type="url" value={profile.socialLinks[sp.key] || ""}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, [sp.key]: e.target.value } })}
                  placeholder={sp.placeholder}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" loading={profileSaving} icon="save">Save Profile</Button>
          {profileSaved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="check" className="text-[16px]" /> Saved</span>}
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
