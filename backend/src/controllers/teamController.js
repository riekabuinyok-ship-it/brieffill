const crypto = require("crypto");
const { getDb, save } = require("../utils/db");

const ROLE_LEVEL = { viewer: 0, editor: 1, admin: 2 };

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function requireRole(currentRole, minimum) {
  return (ROLE_LEVEL[currentRole] || 0) >= (ROLE_LEVEL[minimum] || 0);
}

exports.createTeam = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Team name is required" });
  const db = getDb();
  db.run("INSERT INTO teams (name, owner_id) VALUES (?, ?)", [name, req.user.id]);
  const teamId = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
  db.run("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'admin')", [teamId, req.user.id]);
  save();
  res.status(201).json({ team: { id: teamId, name, ownerId: req.user.id, role: "admin" } });
};

exports.listTeams = (req, res) => {
  const db = getDb();
  const result = db.exec(
    `SELECT t.id, t.name, t.owner_id, t.created_at, tm.role
     FROM teams t JOIN team_members tm ON t.id = tm.team_id
     WHERE tm.user_id = ${req.user.id} ORDER BY t.created_at DESC`
  );
  const teams = result[0]?.values.map((row) => ({
    id: row[0], name: row[1], ownerId: row[2], createdAt: row[3], role: row[4],
  })) || [];
  res.json({ teams });
};

exports.getTeam = (req, res) => {
  const db = getDb();
  const memberResult = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!memberResult[0]?.values.length) return res.status(403).json({ error: "Not a team member" });

  const teamResult = db.exec(`SELECT id, name, owner_id, created_at, description, logo_url FROM teams WHERE id = ${req.params.id}`);
  if (!teamResult[0]?.values.length) return res.status(404).json({ error: "Team not found" });

  const team = teamResult[0].values[0];
  const members = db.exec(
    `SELECT u.id, u.email, u.name, tm.role, tm.joined_at
     FROM team_members tm JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ${req.params.id}`
  ).at(0)?.values.map((m) => ({ id: m[0], email: m[1], name: m[2], role: m[3], joinedAt: m[4] })) || [];

  const invites = db.exec(
    `SELECT id, email, role, created_at, accepted_at FROM team_invites WHERE team_id = ${req.params.id} AND accepted_at IS NULL`
  ).at(0)?.values.map((i) => ({ id: i[0], email: i[1], role: i[2], createdAt: i[3] })) || [];

  res.json({
    team: { id: team[0], name: team[1], ownerId: team[2], createdAt: team[3], description: team[4] || "", logoUrl: team[5] || null },
    members,
    invites,
    currentUserRole: memberResult[0].values[0][0],
  });
};

exports.inviteToTeam = (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (role && !["admin", "editor", "viewer"].includes(role)) return res.status(400).json({ error: "Invalid role" });

  const db = getDb();
  const adminCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!adminCheck[0]?.values.length) return res.status(403).json({ error: "Not authorized" });
  if (adminCheck[0].values[0][0] !== "admin") return res.status(403).json({ error: "Only admins can invite" });

  const token = generateToken();
  db.run(
    "INSERT INTO team_invites (team_id, email, role, token) VALUES (?, ?, ?, ?)",
    [req.params.id, email, role || "viewer", token]
  );
  save();

  res.status(201).json({
    invite: { email, role: role || "viewer", token },
    inviteUrl: `${req.protocol}://${req.get("host")}/teams/accept?token=${token}`,
  });
};

exports.acceptInvite = (req, res) => {
  const { token } = req.body;
  const db = getDb();

  const inviteResult = db.exec(
    `SELECT id, team_id, email, role, accepted_at FROM team_invites WHERE token = '${token.replace(/'/g, "''")}'`
  );
  if (!inviteResult[0]?.values.length) return res.status(404).json({ error: "Invite not found" });

  const invite = inviteResult[0].values[0];
  if (invite[4]) return res.status(400).json({ error: "Invite already accepted" });

  if (invite[2].toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: "Invite is for a different email" });
  }

  const existing = db.exec(
    `SELECT id FROM team_members WHERE team_id = ${invite[1]} AND user_id = ${req.user.id}`
  );
  if (!existing[0]?.values.length) {
    db.run("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)", [invite[1], req.user.id, invite[3]]);
  }
  db.run("UPDATE team_invites SET accepted_at = datetime('now') WHERE id = ?", [invite[0]]);
  save();

  res.json({ success: true, teamId: invite[1] });
};

exports.shareBrief = (req, res) => {
  const teamId = req.params.id;
  const briefId = req.params.briefId;
  const db = getDb();

  const memberCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${teamId} AND user_id = ${req.user.id}`
  );
  if (!memberCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });
  const role = memberCheck[0].values[0][0];
  if (!requireRole(role, "editor")) {
    return res.status(403).json({ error: "Editors and admins can share briefs" });
  }

  const briefCheck = db.exec(`SELECT user_id FROM briefs WHERE id = ${briefId}`);
  if (!briefCheck[0]?.values.length) return res.status(404).json({ error: "Brief not found" });
  if (briefCheck[0].values[0][0] !== req.user.id) return res.status(403).json({ error: "Not the brief owner" });

  try {
    db.run("INSERT INTO brief_shares (brief_id, team_id, shared_by) VALUES (?, ?, ?)", [briefId, teamId, req.user.id]);
    save();
    res.status(201).json({ success: true });
  } catch {
    res.status(409).json({ error: "Already shared" });
  }
};

exports.listTeamBriefs = (req, res) => {
  const db = getDb();
  const memberCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!memberCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });

  const result = db.exec(
    `SELECT b.id, b.client_name, b.project_name, b.completeness_score, b.status, b.created_at, u.name as owner_name
     FROM brief_shares bs
     JOIN briefs b ON b.id = bs.brief_id
     JOIN users u ON u.id = b.user_id
     WHERE bs.team_id = ${req.params.id}
     ORDER BY bs.created_at DESC`
  );
  const briefs = result[0]?.values.map((row) => ({
    id: row[0], clientName: row[1], projectName: row[2], completenessScore: row[3],
    status: row[4], createdAt: row[5], ownerName: row[6],
  })) || [];
  res.json({ briefs });
};

exports.updateMemberRole = (req, res) => {
  const { role } = req.body;
  if (!role || !["admin", "editor", "viewer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const db = getDb();
  const adminCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!adminCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });
  if (!requireRole(adminCheck[0].values[0][0], "admin")) {
    return res.status(403).json({ error: "Only admins can change roles" });
  }

  // Prevent removing the last admin
  if (role !== "admin") {
    const ownerCheck = db.exec(`SELECT owner_id FROM teams WHERE id = ${req.params.id}`);
    if (ownerCheck[0]?.values[0]?.[0] === Number(req.params.userId)) {
      return res.status(400).json({ error: "Cannot demote the team owner" });
    }
  }

  const result = db.run(
    `UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?`,
    [role, req.params.id, req.params.userId]
  );
  save();
  res.json({ success: true });
};

exports.removeMember = (req, res) => {
  const db = getDb();
  const adminCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!adminCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });
  if (!requireRole(adminCheck[0].values[0][0], "admin")) {
    return res.status(403).json({ error: "Only admins can remove members" });
  }

  // Prevent removing the team owner
  const ownerCheck = db.exec(`SELECT owner_id FROM teams WHERE id = ${req.params.id}`);
  if (ownerCheck[0]?.values[0]?.[0] === Number(req.params.userId)) {
    return res.status(400).json({ error: "Cannot remove the team owner" });
  }

  db.run("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", [req.params.id, req.params.userId]);
  save();
  res.json({ success: true });
};

exports.updateTeam = (req, res) => {
  const { name, description } = req.body;
  const db = getDb();
  const adminCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!adminCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });
  if (adminCheck[0].values[0][0] !== "admin") return res.status(403).json({ error: "Only admins can update team settings" });

  const sets = [];
  const vals = [];
  if (name !== undefined) { sets.push("name = ?"); vals.push(name.trim().slice(0, 100)); }
  if (description !== undefined) { sets.push("description = ?"); vals.push(description.trim().slice(0, 500)); }
  if (sets.length === 0) return res.status(400).json({ error: "Nothing to update" });

  db.run(`UPDATE teams SET ${sets.join(", ")} WHERE id = ?`, [...vals, req.params.id]);
  save();
  res.json({ success: true });
};

exports.uploadTeamLogo = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const logoUrl = `/uploads/team-logos/${req.file.filename}`;
  const db = getDb();
  const adminCheck = db.exec(
    `SELECT role FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.user.id}`
  );
  if (!adminCheck[0]?.values.length) return res.status(403).json({ error: "Not a team member" });
  if (adminCheck[0].values[0][0] !== "admin") return res.status(403).json({ error: "Only admins can update team settings" });

  db.run("UPDATE teams SET logo_url = ? WHERE id = ?", [logoUrl, req.params.id]);
  save();
  res.json({ logoUrl });
};

exports.transferOwnership = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const db = getDb();

  const teamResult = db.exec(`SELECT owner_id FROM teams WHERE id = ${req.params.id}`);
  if (!teamResult[0]?.values.length) return res.status(404).json({ error: "Team not found" });
  if (teamResult[0].values[0][0] !== req.user.id) return res.status(403).json({ error: "Only the team owner can transfer ownership" });

  const memberCheck = db.exec(
    `SELECT id FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${Number(userId)}`
  );
  if (!memberCheck[0]?.values.length) return res.status(400).json({ error: "User is not a team member" });

  db.run("UPDATE teams SET owner_id = ? WHERE id = ?", [Number(userId), req.params.id]);
  db.run("UPDATE team_members SET role = 'admin' WHERE team_id = ? AND user_id = ?", [req.params.id, Number(userId)]);
  save();
  res.json({ success: true });
};

exports.deleteTeam = (req, res) => {
  const db = getDb();
  const teamResult = db.exec(`SELECT owner_id FROM teams WHERE id = ${req.params.id}`);
  if (!teamResult[0]?.values.length) return res.status(404).json({ error: "Team not found" });
  if (teamResult[0].values[0][0] !== req.user.id) return res.status(403).json({ error: "Only the team owner can delete the team" });

  db.run("DELETE FROM teams WHERE id = ?", [req.params.id]);
  save();
  res.json({ success: true });
};

exports.listMyTeamsForBrief = (req, res) => {
  // Returns the list of teams that the current user belongs to, used by the
  // "Share with team" UI on BriefDetail so users can pick a team.
  const db = getDb();
  const result = db.exec(
    `SELECT t.id, t.name, tm.role
     FROM teams t JOIN team_members tm ON t.id = tm.team_id
     WHERE tm.user_id = ${req.user.id} ORDER BY t.name`
  );
  const teams = result[0]?.values.map((row) => ({
    id: row[0], name: row[1], role: row[2],
  })) || [];
  res.json({ teams });
};
