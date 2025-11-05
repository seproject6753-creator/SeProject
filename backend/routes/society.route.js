const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const {
  listSocieties,
  getSocietyBySlug,
  addMember,
  updateMemberRole,
  removeMember,
  listSocietyEvents,
  createSocietyEvent,
  listUpcomingEvents,
  updateSocietyInfo,
  cancelSocietyEvent,
  searchUsers,
  becomeHead,
} = require("../controllers/society.controller");

// Public
router.get("/", listSocieties);
router.get("/events/upcoming", listUpcomingEvents);
router.get("/search-users", auth, searchUsers);
router.get("/:slug", getSocietyBySlug);
router.get("/:id/events", listSocietyEvents);

// Authenticated
router.post("/:id/events", auth, createSocietyEvent); // members and above
router.patch("/:id/events/:eventId/cancel", auth, cancelSocietyEvent); // head only
router.patch("/:id", auth, updateSocietyInfo); // head only
router.post("/:id/become-head", auth, becomeHead); // dev convenience

// Head-only management (auth inside controller checks role)
router.post("/:id/members", auth, addMember);
router.patch("/:id/members/:memberId", auth, updateMemberRole);
router.delete("/:id/members/:memberId", auth, removeMember);

module.exports = router;
