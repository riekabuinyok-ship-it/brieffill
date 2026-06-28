const crypto = require("crypto");
const { getDb } = require("../utils/db");

const ROLE_LEVEL = { viewer: 0, editor: 1, admin: 2 };

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function requireRole(currentRole, minimum) {
  return (ROLE_LEVEL[currentRole] || 0) >= (ROLE_LEVEL[minimum] || 0);
}

exports.createTeam = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Team name is required" });
  const db = getDb();
  const { data: team, error } = await db
    .from("teams")
    .insert({ name, owner_id: req.user.id })
    .select("id")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  await db.from("team_members").insert({ team_id: team.id, user_id: req.user.id, role: "admin" });
  res.status(201).json({ team: { id: team.id, name, ownerId: req.user.id, role: "admin" } });
};

exports.listTeams = async (req, res) => {
  const db = getDb();
  const { data: members, error: mErr } = await db
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", req.user.id);
  if (mErr) return res.status(500).json({ error: mErr.message });
  if (!members || members.length === 0) return res.json({ teams: [] });

  const teamIds = members.map((m) => m.team_id);
  const roleMap = Object.fromEntries(members.map((m) => [m.team_id, m.role]));

  const { data: teams, error: tErr } = await db
    .from("teams")
    .select("id, name, owner_id, created_at")
    .in("id", teamIds)
    .order("created_at", { ascending: false });
  if (tErr) return res.status(500).json({ error: tErr.message });

  res.json({
    teams: (teams || []).map((t) => ({
      id: t.id, name: t.name, ownerId: t.owner_id, createdAt: t.created_at, role: roleMap[t.id],
    })),
  });
};

exports.getTeam = async (req, res) => {
  const db = getDb();

  const { data: memberRole, error: mErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (mErr) return res.status(500).json({ error: mErr.message });
  if (!memberRole) return res.status(403).json({ error: "Not a team member" });

  const { data: team, error: tErr } = await db
    .from("teams")
    .select("id, name, owner_id, created_at, description, logo_url")
    .eq("id", req.params.id)
    .maybeSingle();
  if (tErr) return res.status(500).json({ error: tErr.message });
  if (!team) return res.status(404).json({ error: "Team not found" });

  const { data: members, error: memErr2 } = await db
    .from("team_members")
    .select("user_id, role, joined_at, users ( id, email, name )")
    .eq("team_id", req.params.id);

  const { data: invites, error: invErr } = await db
    .from("team_invites")
    .select("id, email, role, created_at")
    .eq("team_id", req.params.id)
    .is("accepted_at", null);

  res.json({
    team: {
      id: team.id, name: team.name, ownerId: team.owner_id, createdAt: team.created_at,
      description: team.description || "", logoUrl: team.logo_url || null,
    },
    members: (members || []).map((m) => ({
      id: m.users.id, email: m.users.email, name: m.users.name, role: m.role, joinedAt: m.joined_at,
    })),
    invites: (invites || []).map((i) => ({
      id: i.id, email: i.email, role: i.role, createdAt: i.created_at,
    })),
    currentUserRole: memberRole.role,
  });
};

exports.inviteToTeam = async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (role && !["admin", "editor", "viewer"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const db = getDb();
  const { data: adminCheck, error: aErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!adminCheck) return res.status(403).json({ error: "Not authorized" });
  if (adminCheck.role !== "admin") return res.status(403).json({ error: "Only admins can invite" });

  const token = generateToken();
  const { error: insErr } = await db
    .from("team_invites")
    .insert({ team_id: req.params.id, email, role: role || "viewer", token });
  if (insErr) return res.status(500).json({ error: insErr.message });

  res.status(201).json({
    invite: { email, role: role || "viewer", token },
    inviteUrl: `${req.protocol}://${req.get("host")}/teams/accept?token=${token}`,
  });
};

exports.acceptInvite = async (req, res) => {
  const { token } = req.body;
  const db = getDb();

  const { data: invite, error: iErr } = await db
    .from("team_invites")
    .select("id, team_id, email, role, accepted_at")
    .eq("token", token)
    .maybeSingle();
  if (iErr) return res.status(500).json({ error: iErr.message });
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (invite.accepted_at) return res.status(400).json({ error: "Invite already accepted" });
  if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: "Invite is for a different email" });
  }

  const { data: existing } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (!existing) {
    await db.from("team_members").insert({ team_id: invite.team_id, user_id: req.user.id, role: invite.role });
  }

  await db
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  res.json({ success: true, teamId: invite.team_id });
};

exports.shareBrief = async (req, res) => {
  const teamId = req.params.id;
  const briefId = req.params.briefId;
  const db = getDb();

  const { data: memberCheck, error: mcErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (mcErr) return res.status(500).json({ error: mcErr.message });
  if (!memberCheck) return res.status(403).json({ error: "Not a team member" });
  if (!requireRole(memberCheck.role, "editor")) {
    return res.status(403).json({ error: "Editors and admins can share briefs" });
  }

  const { data: brief, error: bErr } = await db
    .from("briefs")
    .select("user_id")
    .eq("id", briefId)
    .maybeSingle();
  if (bErr) return res.status(500).json({ error: bErr.message });
  if (!brief) return res.status(404).json({ error: "Brief not found" });
  if (brief.user_id !== req.user.id) return res.status(403).json({ error: "Not the brief owner" });

  const { error: insErr } = await db
    .from("brief_shares")
    .insert({ brief_id: briefId, team_id: teamId, shared_by: req.user.id });
  if (insErr) {
    if (insErr.code === "23505") return res.status(409).json({ error: "Already shared" });
    return res.status(500).json({ error: insErr.message });
  }
  res.status(201).json({ success: true });
};

exports.listTeamBriefs = async (req, res) => {
  const db = getDb();

  const { data: member, error: mcErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (mcErr) return res.status(500).json({ error: mcErr.message });
  if (!member) return res.status(403).json({ error: "Not a team member" });

  const { data: rows, error } = await db
    .from("brief_shares")
    .select("created_at, briefs ( id, client_name, project_name, completeness_score, status, created_at, users ( name ) )")
    .eq("team_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const briefs = (rows || []).map((r) => ({
    id: r.briefs.id, clientName: r.briefs.client_name, projectName: r.briefs.project_name,
    completenessScore: r.briefs.completeness_score, status: r.briefs.status,
    createdAt: r.briefs.created_at, ownerName: r.briefs.users.name,
  }));
  res.json({ briefs });
};

exports.updateMemberRole = async (req, res) => {
  const { role } = req.body;
  if (!role || !["admin", "editor", "viewer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const db = getDb();
  const { data: adminCheck, error: aErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!adminCheck) return res.status(403).json({ error: "Not a team member" });
  if (!requireRole(adminCheck.role, "admin")) {
    return res.status(403).json({ error: "Only admins can change roles" });
  }

  if (role !== "admin") {
    const { data: ownerCheck, error: oErr } = await db
      .from("teams")
      .select("owner_id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (oErr) return res.status(500).json({ error: oErr.message });
    if (ownerCheck && ownerCheck.owner_id === Number(req.params.userId)) {
      return res.status(400).json({ error: "Cannot demote the team owner" });
    }
  }

  const { error: uErr } = await db
    .from("team_members")
    .update({ role })
    .eq("team_id", req.params.id)
    .eq("user_id", req.params.userId);
  if (uErr) return res.status(500).json({ error: uErr.message });

  res.json({ success: true });
};

exports.removeMember = async (req, res) => {
  const db = getDb();
  const { data: adminCheck, error: aErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!adminCheck) return res.status(403).json({ error: "Not a team member" });
  if (!requireRole(adminCheck.role, "admin")) {
    return res.status(403).json({ error: "Only admins can remove members" });
  }

  const { data: ownerCheck, error: oErr } = await db
    .from("teams")
    .select("owner_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (oErr) return res.status(500).json({ error: oErr.message });
  if (ownerCheck && ownerCheck.owner_id === Number(req.params.userId)) {
    return res.status(400).json({ error: "Cannot remove the team owner" });
  }

  const { error: dErr } = await db
    .from("team_members")
    .delete()
    .eq("team_id", req.params.id)
    .eq("user_id", req.params.userId);
  if (dErr) return res.status(500).json({ error: dErr.message });

  res.json({ success: true });
};

exports.updateTeam = async (req, res) => {
  const { name, description } = req.body;
  const db = getDb();

  const { data: adminCheck, error: aErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!adminCheck) return res.status(403).json({ error: "Not a team member" });
  if (adminCheck.role !== "admin") return res.status(403).json({ error: "Only admins can update team settings" });

  const updates = {};
  if (name !== undefined) updates.name = name.trim().slice(0, 100);
  if (description !== undefined) updates.description = description.trim().slice(0, 500);
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

  const { error: uErr } = await db.from("teams").update(updates).eq("id", req.params.id);
  if (uErr) return res.status(500).json({ error: uErr.message });

  res.json({ success: true });
};

exports.uploadTeamLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const logoUrl = `/uploads/team-logos/${req.file.filename}`;
  const db = getDb();

  const { data: adminCheck, error: aErr } = await db
    .from("team_members")
    .select("role")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!adminCheck) return res.status(403).json({ error: "Not a team member" });
  if (adminCheck.role !== "admin") return res.status(403).json({ error: "Only admins can update team settings" });

  const { error: uErr } = await db.from("teams").update({ logo_url: logoUrl }).eq("id", req.params.id);
  if (uErr) return res.status(500).json({ error: uErr.message });

  res.json({ logoUrl });
};

exports.transferOwnership = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const db = getDb();

  const { data: team, error: tErr } = await db
    .from("teams")
    .select("owner_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (tErr) return res.status(500).json({ error: tErr.message });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.owner_id !== req.user.id) return res.status(403).json({ error: "Only the team owner can transfer ownership" });

  const { data: member, error: mErr } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", req.params.id)
    .eq("user_id", Number(userId))
    .maybeSingle();
  if (mErr) return res.status(500).json({ error: mErr.message });
  if (!member) return res.status(400).json({ error: "User is not a team member" });

  const { error: u1Err } = await db.from("teams").update({ owner_id: Number(userId) }).eq("id", req.params.id);
  if (u1Err) return res.status(500).json({ error: u1Err.message });

  const { error: u2Err } = await db
    .from("team_members")
    .update({ role: "admin" })
    .eq("team_id", req.params.id)
    .eq("user_id", Number(userId));
  if (u2Err) return res.status(500).json({ error: u2Err.message });

  res.json({ success: true });
};

exports.deleteTeam = async (req, res) => {
  const db = getDb();
  const { data: team, error: tErr } = await db
    .from("teams")
    .select("owner_id")
    .eq("id", req.params.id)
    .maybeSingle();
  if (tErr) return res.status(500).json({ error: tErr.message });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.owner_id !== req.user.id) return res.status(403).json({ error: "Only the team owner can delete the team" });

  const { error: dErr } = await db.from("teams").delete().eq("id", req.params.id);
  if (dErr) return res.status(500).json({ error: dErr.message });

  res.json({ success: true });
};

exports.listMyTeamsForBrief = async (req, res) => {
  const db = getDb();
  const { data: members, error: mErr } = await db
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", req.user.id);
  if (mErr) return res.status(500).json({ error: mErr.message });
  if (!members || members.length === 0) return res.json({ teams: [] });

  const teamIds = members.map((m) => m.team_id);
  const roleMap = Object.fromEntries(members.map((m) => [m.team_id, m.role]));

  const { data: teams, error: tErr } = await db
    .from("teams")
    .select("id, name")
    .in("id", teamIds)
    .order("name");
  if (tErr) return res.status(500).json({ error: tErr.message });

  res.json({
    teams: (teams || []).map((t) => ({ id: t.id, name: t.name, role: roleMap[t.id] })),
  });
};
