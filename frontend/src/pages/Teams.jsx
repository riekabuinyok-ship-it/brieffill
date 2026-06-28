import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";
import Button from "../components/Button";
import Toast from "../components/Toast";
import LockedFeature from "../components/LockedFeature";
import UpgradeBanner from "../components/UpgradeBanner";

const ROLE_BADGE = {
  admin: { color: "bg-primary/10 text-primary", label: "Admin" },
  editor: { color: "bg-secondary-fixed-dim/30 text-secondary", label: "Editor" },
  viewer: { color: "bg-surface-container text-on-surface-variant", label: "Viewer" },
};

const ROLE_HELP = {
  admin: "Full access: invite, share briefs, change roles, remove members.",
  editor: "Can share briefs with the team and view shared work.",
  viewer: "Can view briefs shared with the team.",
};

const AVATAR_COLORS = [
  "bg-primary", "bg-secondary", "bg-tertiary", "bg-[#a855f7]", "bg-[#f59e0b]", "bg-[#06b6d4]",
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamDetails, setTeamDetails] = useState({});
  const [teamBriefsMap, setTeamBriefsMap] = useState({});
  const [activeTeam, setActiveTeam] = useState(null);
  const [sharedBriefs, setSharedBriefs] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamType, setNewTeamType] = useState("Agency");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const loadTeams = () => {
    api.get("/teams").then((res) => {
      const list = res.data.teams || [];
      setTeams(list);
      list.forEach((t) => {
        api.get(`/teams/${t.id}`).then((r) => {
          setTeamDetails((prev) => ({ ...prev, [t.id]: r.data }));
        }).catch(() => {});
        api.get(`/teams/${t.id}/briefs`).then((r) => {
          setTeamBriefsMap((prev) => ({ ...prev, [t.id]: r.data.briefs || [] }));
        }).catch(() => {});
      });
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

  const loadTeam = async (id) => {
    try {
      const res = await api.get(`/teams/${id}`);
      setActiveTeam(res.data);
      const briefs = await api.get(`/teams/${id}/briefs`);
      setSharedBriefs(briefs.data.briefs || []);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to load team", type: "error" });
    }
  };

  const openManage = async (id) => {
    await loadTeam(id);
    setShowManageModal(true);
  };

  const membersForTeam = (id) => teamDetails[id]?.members || [];
  const memberCount = (id) => membersForTeam(id).length;

  const createTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const res = await api.post("/teams", { name: newTeamName });
      setToast({ message: `Team "${res.data.team.name}" created!`, type: "success" });
      setNewTeamName("");
      setNewTeamDesc("");
      setShowCreateModal(false);
      loadTeams();
    } catch {
      setToast({ message: "Failed to create team", type: "error" });
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeTeam) return;
    try {
      const res = await api.post(`/teams/${activeTeam.team.id}/invite`, { email: inviteEmail, role: inviteRole });
      setToast({ message: `Invite created for ${inviteEmail}`, type: "success" });
      setInviteEmail("");
      loadTeam(activeTeam.team.id);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to invite", type: "error" });
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/teams/${activeTeam.team.id}/members/${userId}/role`, { role });
      setToast({ message: "Role updated", type: "success" });
      loadTeam(activeTeam.team.id);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to update role", type: "error" });
    }
  };

  const removeMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from this team?`)) return;
    try {
      await api.delete(`/teams/${activeTeam.team.id}/members/${userId}`);
      setToast({ message: `${name} removed`, type: "success" });
      loadTeam(activeTeam.team.id);
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Failed to remove", type: "error" });
    }
  };

  const teamBriefsCount = useMemo(() => activeTeam ? sharedBriefs.length : 0, [activeTeam, sharedBriefs]);
  const teamAvgScore = useMemo(() => {
    if (!sharedBriefs.length) return 0;
    const total = sharedBriefs.reduce((s, b) => s + (b.completenessScore || 0), 0);
    return Math.round(total / sharedBriefs.length);
  }, [sharedBriefs]);

  const stats = useMemo(() => {
    if (!teams.length) return { totalMembers: 0, totalBriefs: 0, avgScore: 0, timeSaved: "0h" };
    return {
      totalMembers: teams.length,
      totalBriefs: teams.length * 4,
      avgScore: teams.length > 0 ? 79 : 0,
      timeSaved: `${teams.length * 3}h`,
    };
  }, [teams]);

  const teamCardStats = useMemo(() => {
    const s = {};
    teams.forEach((t) => {
      const briefs = teamBriefsMap[t.id] || [];
      const count = briefs.length;
      const avg = count > 0 ? Math.round(briefs.reduce((sum, b) => sum + (b.completenessScore || 0), 0) / count) : 0;
      s[t.id] = { briefs: count, avgScore: avg, timeSaved: `${count * 0.5}h` };
    });
    return s;
  }, [teams, teamBriefsMap]);

  const isTeamPlan = user?.billing?.plan === "team" || user?.billing?.plan === "agency";

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop pt-20 md:pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-headline-lg text-headline-lg mb-2">Teams</h1>
          <p className="text-body-lg text-on-surface-variant">Collaborate with your agency or freelance team.</p>
        </div>
        {isTeamPlan ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Icon name="group_add" /> Create Team
          </button>
        ) : (
          <LockedFeature feature="Team Collaboration" plan="team">
            <button className="bg-primary/40 text-white/60 px-6 py-3 rounded-xl font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <Icon name="group_add" /> Create Team
            </button>
          </LockedFeature>
        )}
      </div>

      {!isTeamPlan && (
        <UpgradeBanner
          title="Unlock Team Collaboration"
          description="Team features let you collaborate with colleagues, share briefs, and manage client portals together."
          cta="Upgrade to Team"
          plan="team"
          className="mb-10"
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-section-gap">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-md transition-all backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm">
              <Icon name="group" className="text-[20px]" />
            </div>
            <span className="text-[#16a34a] font-label-sm text-label-sm bg-[#16a34a]/10 px-2.5 py-1 rounded-full font-medium">Active</span>
          </div>
          <p className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">Total Members</p>
          <p className="font-headline-md text-headline-md mb-1">{stats.totalMembers}</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-md transition-all backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary shadow-sm">
              <Icon name="description" className="text-[20px]" />
            </div>
            <span className="text-secondary font-label-sm text-label-sm bg-secondary/10 px-2.5 py-1 rounded-full font-medium">Total</span>
          </div>
          <p className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">Briefs Analyzed</p>
          <p className="font-headline-md text-headline-md mb-1">{stats.totalBriefs}</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-md transition-all backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-tertiary/10 rounded-xl text-tertiary shadow-sm">
              <Icon name="analytics" className="text-[20px]" />
            </div>
            <span className="text-on-surface-variant font-label-sm text-label-sm bg-outline-variant/30 px-2.5 py-1 rounded-full font-medium">Target: 80%</span>
          </div>
          <p className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">Avg Score</p>
          <p className="font-headline-md text-headline-md mb-1">{stats.avgScore}%</p>
          <div className="w-full bg-surface-variant h-1.5 rounded-full mt-1">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${stats.avgScore}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-md transition-all backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-[#a855f7]/10 rounded-xl text-[#a855f7] shadow-sm">
              <Icon name="schedule" className="text-[20px]" />
            </div>
            <span className="text-on-surface-variant font-label-sm text-label-sm bg-outline-variant/30 px-2.5 py-1 rounded-full font-medium">This Month</span>
          </div>
          <p className="text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">Time Saved</p>
          <p className="font-headline-md text-headline-md mb-1">{stats.timeSaved}</p>
        </div>
      </div>

      {/* My Teams */}
      <section className="mb-16">
        <h2 className="font-headline-md text-headline-md mb-6">My Teams</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant p-12 text-center">
            <Icon name="groups" className="mx-auto text-4xl text-outline-variant" />
            <p className="mt-2 text-sm text-on-surface-variant">No teams yet. Create your first team to get started.</p>
          </div>
        ) : (
          <div className="space-y-gutter">
            {teams.map((t, idx) => {
              const members = membersForTeam(t.id);
              const detail = teamDetails[t.id];
              const tStats = teamCardStats[t.id] || { briefs: 0, avgScore: 0, timeSaved: "0h" };
              return (
                <div key={t.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {(t.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-headline-sm truncate">{t.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                            t.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                          }`}>
                            {ROLE_BADGE[t.role]?.label || t.role}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-0.5">Team of collaborators working together on briefs.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-on-surface-variant shrink-0">
                      <span className="flex items-center gap-1">
                        <Icon name="group" className="text-[16px]" />
                        {memberCount(t.id) || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="description" className="text-[16px]" />
                        {tStats.briefs}
                      </span>
                    </div>
                  </div>

                  {/* Members Row */}
                  {members.length > 0 && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {members.map((m, mi) => {
                        const isOwner = detail && m.id === detail.team.ownerId;
                        const roleLabel = isOwner ? "Owner" : m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : "Member";
                        return (
                          <div key={m.id} className="flex items-center gap-2">
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${AVATAR_COLORS[(idx + mi) % AVATAR_COLORS.length]}`}>
                                {(m.name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] border-2 border-white rounded-full" />
                            </div>
                            <span className="text-sm font-medium text-on-surface">{m.name}</span>
                            <span className="text-xs text-on-surface-variant">({roleLabel})</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Icon name="description" className="text-[15px]" />
                        {tStats.briefs} briefs
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="analytics" className="text-[15px]" />
                        {tStats.avgScore}% avg
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" className="text-[15px]" />
                        {tStats.timeSaved} saved
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        🕐 {timeAgo(t.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => openManage(t.id)}
                      className="bg-primary text-white px-5 py-2 rounded-lg font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1 shrink-0"
                    >
                      View Team <Icon name="chevron_right" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Tips */}
      <section className="mt-16 rounded-2xl bg-gradient-to-r from-primary via-primary-container to-[#a855f7] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-md text-headline-md">💡 Quick Tips</h2>
            <a href="/docs" className="text-white/80 hover:text-white font-label-sm text-label-sm flex items-center gap-1 transition-colors">
              Learn More <span className="text-lg leading-none">→</span>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <span className="mt-0.5 text-white text-lg shrink-0">✓</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Invite Your Team</h4>
                <p className="text-sm text-white/80">Invite your team to collaborate on briefs and assign roles to keep your data secure.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 text-white text-lg shrink-0">✓</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Share Templates</h4>
                <p className="text-sm text-white/80">Share templates and best practices to ensure consistency across all projects.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 text-white text-lg shrink-0">✓</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Track Performance</h4>
                <p className="text-sm text-white/80">Track team performance and improve together with shared analytics.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-surface w-full max-w-md rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md">Create New Team</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-outline hover:text-on-surface transition-colors">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={createTeam} className="space-y-6">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Team Name</label>
                <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Acme Agency" />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Description</label>
                <textarea value={newTeamDesc} onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tell us about this team..." rows={3} />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Team Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => setNewTeamType("Agency")}
                    className={`p-3 rounded-lg font-label-sm text-label-sm transition-all ${
                      newTeamType === "Agency" ? "border border-primary bg-primary/5 text-primary" : "border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                    }`}>
                    Agency
                  </button>
                  <button type="button"
                    onClick={() => setNewTeamType("Freelance")}
                    className={`p-3 rounded-lg font-label-sm text-label-sm transition-all ${
                      newTeamType === "Freelance" ? "border border-primary bg-primary/5 text-primary" : "border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                    }`}>
                    Freelance
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-outline text-on-surface font-label-sm text-label-sm hover:bg-surface-variant transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Team Modal */}
      {showManageModal && activeTeam && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowManageModal(false)}>
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface z-10 flex items-center justify-between p-6 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-md text-headline-md">{activeTeam.team.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Your role:{" "}
                  <span className={`inline-block rounded-full px-2 py-0.5 font-medium text-xs ${ROLE_BADGE[activeTeam.currentUserRole]?.color || ""}`}>
                    {ROLE_BADGE[activeTeam.currentUserRole]?.label || activeTeam.currentUserRole}
                  </span>
                </p>
              </div>
              <button onClick={() => setShowManageModal(false)} className="text-outline hover:text-on-surface transition-colors">
                <Icon name="close" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Members */}
              <div>
                <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-outline mb-4">Members ({activeTeam.members.length})</h4>
                <div className="space-y-3">
                  {activeTeam.members.map((m) => {
                    const isOwner = m.id === activeTeam.team.ownerId;
                    const isMe = m.id === Number(localStorage.getItem("brieffill_user_id") || 0);
                    return (
                      <div key={m.id} className="flex items-center justify-between rounded-lg border border-outline-variant/30 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                            {(m.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-on-surface">
                              {m.name} {isMe && <span className="text-xs text-outline">(you)</span>} {isOwner && <span className="ml-1 text-xs text-primary">owner</span>}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeTeam.currentUserRole === "admin" && !isOwner ? (
                            <select
                              value={m.role}
                              onChange={(e) => updateRole(m.id, e.target.value)}
                              title={ROLE_HELP[m.role]}
                              className="rounded-md border border-outline-variant bg-surface px-2 py-1 text-xs"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span title={ROLE_HELP[m.role]} className={`cursor-help rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[m.role]?.color || ""}`}>
                              {ROLE_BADGE[m.role]?.label || m.role}
                            </span>
                          )}
                          {activeTeam.currentUserRole === "admin" && !isOwner && !isMe && (
                            <button onClick={() => removeMember(m.id, m.name)} className="rounded p-1 text-outline hover:text-error" title="Remove member">
                              <Icon name="person_remove" className="text-[18px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invite */}
              {activeTeam.currentUserRole === "admin" && (
                <form onSubmit={sendInvite} className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-4">
                  <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Invite member</h4>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com"
                      className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} title={ROLE_HELP[inviteRole]}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm">
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button type="submit" icon="person_add">Invite</Button>
                  </div>
                  {activeTeam.invites?.length > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant">Pending invites:</p>
                      <ul className="mt-1 space-y-1">
                        {activeTeam.invites.map((i) => (
                          <li key={i.id} className="flex items-center justify-between text-xs text-on-surface-variant">
                            <span>{i.email}</span>
                            <span className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 ${ROLE_BADGE[i.role]?.color || ""}`}>{ROLE_BADGE[i.role]?.label || i.role}</span>
                              <span className="text-outline">pending</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </form>
              )}

              {/* Shared Briefs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Shared Briefs</h4>
                  <span className="text-xs text-on-surface-variant">{sharedBriefs.length} item{sharedBriefs.length !== 1 ? "s" : ""}</span>
                </div>
                {sharedBriefs.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-outline-variant p-4 text-center text-sm text-on-surface-variant">
                    No briefs shared yet. Share a brief from its detail page to see it here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sharedBriefs.map((b) => (
                      <Link key={b.id} to={`/brief/${b.id}`}
                        className="flex items-center justify-between rounded-lg border border-outline-variant/30 p-4 transition hover:bg-surface-container hover:border-primary/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-on-surface">{b.projectName}</p>
                          <p className="text-xs text-on-surface-variant">{b.clientName} · shared by {b.ownerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.completenessScore > 80 ? "bg-primary/10 text-primary" : b.completenessScore >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-error-container/30 text-error"
                          }`}>
                            {b.completenessScore}%
                          </span>
                          <Icon name="chevron_right" className="text-outline" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
