const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../middleware/auth");
const report = require("../controllers/reportController");

// student creates report
router.post("/", requireAuth, report.createReport);

// admin reads reports
router.get("/", requireAuth, requireAdmin, report.getReportsAdmin);

// admin marks read
router.put("/:id/read", requireAuth, requireAdmin, report.markRead);

module.exports = router;

// admin archives
router.put("/:id/archive", requireAuth, requireAdmin, report.archiveReport);

// admin deletes (hard delete)
router.delete("/:id", requireAuth, requireAdmin, report.deleteReport);
