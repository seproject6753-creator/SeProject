const ApiResponse = require("../utils/ApiResponse");
const Society = require("../models/society.model");
const SocietyMembership = require("../models/society-membership.model");
const SocietyEvent = require("../models/society-event.model");
const StudentDetail = require("../models/details/student-details.model");
const FacultyDetail = require("../models/details/faculty-details.model");
const AdminDetail = require("../models/details/admin-details.model");
const jwt = require("jsonwebtoken");

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function resolveUserById(userId) {
  const s = await StudentDetail.findById(userId).select("firstName lastName email profile");
  if (s) return { userType: "StudentDetail", name: `${s.firstName} ${s.lastName}`.trim(), email: s.email, profile: s.profile };
  const f = await FacultyDetail.findById(userId).select("firstName lastName email profile");
  if (f) return { userType: "FacultyDetail", name: `${f.firstName} ${f.lastName}`.trim(), email: f.email, profile: f.profile };
  const a = await AdminDetail.findById(userId).select("firstName lastName email profile");
  if (a) return { userType: "AdminDetail", name: `${a.firstName} ${a.lastName}`.trim(), email: a.email, profile: a.profile };
  return null;
}

async function ensureDefaultSocieties() {
  const count = await Society.countDocuments();
  if (count > 0) return;
  const defaults = [
    { name: "Sarasva", category: "cultural", about: "The literary society.", activities: ["Debates", "Poetry slams", "Book clubs"] },
    { name: "Rangtarangini", category: "cultural", about: "The drama society.", activities: ["Stage plays", "Street plays", "Theatre workshops"] },
    { name: "Virtuosi", category: "cultural", about: "The singing society.", activities: ["Solo and group singing", "Choir", "Riyaz sessions"] },
    { name: "Genetixs", category: "cultural", about: "The dance society.", activities: ["Hip-hop", "Contemporary", "Folk"] },
    { name: "AMS", category: "cultural", about: "The acoustics society.", activities: ["Acoustic jams", "Open mics"] },
    { name: "Geek Haven", category: "technical", about: "Technical club.", activities: ["Coding sprints", "CTFs", "Talks"] },
    { name: "GDG Gravity", category: "technical", about: "Google Developer Group on campus.", activities: ["Meetups", "Workshops", "Study jams"] },
    { name: "Tesla", category: "technical", about: "Electronics and robotics society.", activities: ["Robotics", "IoT", "Hackathons"] },
  ];
  const docs = defaults.map((d) => ({ ...d, slug: slugify(d.name) }));
  await Society.insertMany(docs);
}

async function ensureHeadsForSocieties() {
  const societies = await Society.find({});
  if (!societies.length) return;

  // Prefer students from 7th or 8th semester as heads; remove Admin heads
  for (const s of societies) {
    // Remove any Admin heads for this society
    await SocietyMembership.deleteMany({ societyId: s._id, role: "head", userType: "AdminDetail" });

    // Check if there's at least one head remaining
    const hasHead = await SocietyMembership.exists({ societyId: s._id, role: "head" });
    if (hasHead) continue;

    // Find a candidate student from sem 7 or 8
    const candidate = await StudentDetail.findOne({ semester: { $in: [7, 8] }, status: "active" })
      .select("_id firstName lastName email profile");

    if (candidate) {
      await SocietyMembership.findOneAndUpdate(
        { societyId: s._id, userId: candidate._id, userType: "StudentDetail" },
        {
          $set: {
            role: "head",
            name: `${candidate.firstName} ${candidate.lastName}`.trim(),
            email: candidate.email,
            profile: candidate.profile,
          },
        },
        { upsert: true, new: true }
      );
      continue;
    }

    // Fallback: if no 7th/8th sem student found, keep at least some head (faculty)
    const fallbackFaculty = await FacultyDetail.findOne({}).select("_id firstName lastName email profile");
    if (fallbackFaculty) {
      await SocietyMembership.findOneAndUpdate(
        { societyId: s._id, userId: fallbackFaculty._id, userType: "FacultyDetail" },
        {
          $set: {
            role: "head",
            name: `${fallbackFaculty.firstName} ${fallbackFaculty.lastName}`.trim(),
            email: fallbackFaculty.email,
            profile: fallbackFaculty.profile,
          },
        },
        { upsert: true, new: true }
      );
    }
  }
}

const listSocieties = async (req, res) => {
  try {
    await ensureDefaultSocieties();
    await ensureHeadsForSocieties();
    const societies = await Society.find().sort({ category: 1, name: 1 });
    return ApiResponse.success(societies, "Societies fetched").send(res);
  } catch (e) {
    console.error("listSocieties", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const getSocietyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const society = await Society.findOne({ slug });
    if (!society) return ApiResponse.notFound("Society not found").send(res);
    const heads = await SocietyMembership.find({ societyId: society._id, role: "head" }).select("name email profile role userType _id");
    const coordinators = await SocietyMembership.find({ societyId: society._id, role: "coordinator" }).select("name email profile role userType _id");
    const members = await SocietyMembership.find({ societyId: society._id, role: "member" }).select("name email profile role userType _id");
    let myRole = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      try {
        const membership = await getRequesterMembership({ userId: jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET).userId }, society._id);
        if (membership) myRole = membership.role;
      } catch (_) {}
    }
    return ApiResponse.success({ society, heads, coordinators, members, myRole }, "Society details").send(res);
  } catch (e) {
    console.error("getSocietyBySlug", e);
    return ApiResponse.internalServerError().send(res);
  }
};

async function getRequesterMembership(req, societyId) {
  const resolved = await resolveUserById(req.userId);
  if (!resolved) return null;
  return SocietyMembership.findOne({ societyId, userId: req.userId, userType: resolved.userType });
}

const addMember = async (req, res) => {
  try {
    const { id } = req.params; // society id
    const { userId, role } = req.body; // role: head|coordinator|member
    const society = await Society.findById(id);
    if (!society) return ApiResponse.notFound("Society not found").send(res);

    const requester = await getRequesterMembership(req, id);
    if (!requester || requester.role !== "head") {
      return ApiResponse.forbidden("Only heads can manage members").send(res);
    }

    const resolved = await resolveUserById(userId);
    if (!resolved) return ApiResponse.notFound("User not found").send(res);

    const doc = await SocietyMembership.create({
      societyId: id,
      userId,
      userType: resolved.userType,
      role: role || "member",
      name: resolved.name,
      email: resolved.email,
      profile: resolved.profile,
    });
    return ApiResponse.created(doc, "Member added").send(res);
  } catch (e) {
    console.error("addMember", e);
    if (e.code === 11000)
      return ApiResponse.conflict("User already a member").send(res);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const requester = await getRequesterMembership(req, id);
    if (!requester || requester.role !== "head") {
      return ApiResponse.forbidden("Only heads can manage members").send(res);
    }
    const target = await SocietyMembership.findById(memberId);
    if (!target) return ApiResponse.notFound("Membership not found").send(res);
    // prevent demoting the last head
    if (target.role === "head" && role !== "head") {
      const headsCount = await SocietyMembership.countDocuments({ societyId: id, role: "head" });
      if (headsCount <= 1) return ApiResponse.forbidden("At least one head is required").send(res);
    }
    const updated = await SocietyMembership.findByIdAndUpdate(memberId, { role }, { new: true });
    if (!updated) return ApiResponse.notFound("Membership not found").send(res);
    return ApiResponse.success(updated, "Role updated").send(res);
  } catch (e) {
    console.error("updateMemberRole", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const requester = await getRequesterMembership(req, id);
    if (!requester || requester.role !== "head") {
      return ApiResponse.forbidden("Only heads can manage members").send(res);
    }
    const m = await SocietyMembership.findById(memberId);
    if (!m) return ApiResponse.notFound("Membership not found").send(res);
    if (m.role === "head") {
      const headsCount = await SocietyMembership.countDocuments({ societyId: id, role: "head" });
      if (headsCount <= 1) return ApiResponse.forbidden("At least one head is required").send(res);
    }
    const deleted = await SocietyMembership.findByIdAndDelete(memberId);
    if (!deleted) return ApiResponse.notFound("Membership not found").send(res);
    return ApiResponse.success(null, "Member removed").send(res);
  } catch (e) {
    console.error("removeMember", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateSocietyInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { about, activities } = req.body;
    const requester = await getRequesterMembership(req, id);
    if (!requester || requester.role !== "head") {
      return ApiResponse.forbidden("Only heads can update society info").send(res);
    }
    const update = {};
    if (typeof about === "string") update.about = about;
    if (Array.isArray(activities)) update.activities = activities;
    const doc = await Society.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return ApiResponse.notFound("Society not found").send(res);
    return ApiResponse.success(doc, "Society updated").send(res);
  } catch (e) {
    console.error("updateSocietyInfo", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const listSocietyEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const events = await SocietyEvent.find({ societyId: id, status: "scheduled", date: { $gte: new Date(Date.now() - 24*60*60*1000) } })
      .sort({ date: 1 });
    return ApiResponse.success(events, "Events fetched").send(res);
  } catch (e) {
    console.error("listSocietyEvents", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const createSocietyEvent = async (req, res) => {
  try {
    const { id } = req.params; // society id
    const { title, description, date, location } = req.body;
    const society = await Society.findById(id);
    if (!society) return ApiResponse.notFound("Society not found").send(res);
    const member = await getRequesterMembership(req, id);
    if (!member || (member.role !== "coordinator" && member.role !== "head")) {
      return ApiResponse.forbidden("Only coordinators or heads can schedule events").send(res);
    }
    const event = await SocietyEvent.create({
      societyId: id,
      title,
      description,
      date: new Date(date),
      location,
      createdByMembershipId: member._id,
    });
    return ApiResponse.created(event, "Event created").send(res);
  } catch (e) {
    console.error("createSocietyEvent", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await SocietyEvent.find({ status: "scheduled", date: { $gte: now } })
      .populate("societyId", "name slug category")
      .sort({ date: 1 })
      .limit(50);
    return ApiResponse.success(events, "Upcoming events").send(res);
  } catch (e) {
    console.error("listUpcomingEvents", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const cancelSocietyEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const requester = await getRequesterMembership(req, id);
    if (!requester || requester.role !== "head") {
      return ApiResponse.forbidden("Only heads can cancel events").send(res);
    }
    const ev = await SocietyEvent.findOneAndUpdate(
      { _id: eventId, societyId: id },
      { status: "cancelled" },
      { new: true }
    );
    if (!ev) return ApiResponse.notFound("Event not found").send(res);
    return ApiResponse.success(ev, "Event cancelled").send(res);
  } catch (e) {
    console.error("cancelSocietyEvent", e);
    return ApiResponse.internalServerError().send(res);
  }
};

const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return ApiResponse.badRequest("q is required").send(res);

    const nameRegex = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
    let students = [];
    let faculty = [];

    // Try numeric lookup for enrollment/employee id
    if (/^\d+$/.test(q)) {
      students = await StudentDetail.find({ $or: [{ enrollmentNo: Number(q) }, { phone: q }] })
        .select("firstName lastName email profile _id");
      faculty = await FacultyDetail.find({ $or: [{ employeeId: Number(q) }, { phone: q }] })
        .select("firstName lastName email profile _id");
    }

    // Fallback to name/email contains
    if (students.length === 0) {
      students = await StudentDetail.find({
        $or: [
          { email: nameRegex },
          { firstName: nameRegex },
          { middleName: nameRegex },
          { lastName: nameRegex },
        ],
      }).select("firstName lastName email profile _id").limit(10);
    }
    if (faculty.length === 0) {
      faculty = await FacultyDetail.find({
        $or: [
          { email: nameRegex },
          { firstName: nameRegex },
          { lastName: nameRegex },
        ],
      }).select("firstName lastName email profile _id").limit(10);
    }

    const results = [
      ...students.map((s) => ({
        userId: s._id,
        userType: "StudentDetail",
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        profile: s.profile,
      })),
      ...faculty.map((f) => ({
        userId: f._id,
        userType: "FacultyDetail",
        name: `${f.firstName} ${f.lastName}`.trim(),
        email: f.email,
        profile: f.profile,
      })),
    ];

    return ApiResponse.success(results, "Users").send(res);
  } catch (e) {
    console.error("searchUsers", e);
    return ApiResponse.internalServerError().send(res);
  }
};

// DEV convenience: allow current authenticated user to become a head of a society
const becomeHead = async (req, res) => {
  try {
    const { id } = req.params;
    const society = await Society.findById(id);
    if (!society) return ApiResponse.notFound("Society not found").send(res);
    const resolved = await resolveUserById(req.userId);
    if (!resolved) return ApiResponse.notFound("User not found").send(res);
    const existing = await SocietyMembership.findOne({ societyId: id, userId: req.userId, userType: resolved.userType });
    if (existing) {
      if (existing.role !== "head") {
        existing.role = "head";
        await existing.save();
      }
      return ApiResponse.success(existing, "You are a head now").send(res);
    }
    const doc = await SocietyMembership.create({
      societyId: id,
      userId: req.userId,
      userType: resolved.userType,
      role: "head",
      name: resolved.name,
      email: resolved.email,
      profile: resolved.profile,
    });
    return ApiResponse.created(doc, "You are a head now").send(res);
  } catch (e) {
    console.error("becomeHead", e);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  listSocieties,
  getSocietyBySlug,
  addMember,
  updateMemberRole,
  removeMember,
  listSocietyEvents,
  createSocietyEvent,
  listUpcomingEvents,
  cancelSocietyEvent,
  searchUsers,
  updateSocietyInfo,
  becomeHead,
};
