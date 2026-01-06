const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../middleware/auth");

const {
  uploadPdf,
  listPdfs,
  deletePdf,
  createQuestion,
  bulkCreateQuestions,
  listQuestions,
  deleteQuestion,
} = require("../controllers/adminController");

router.use(requireAuth, requireAdmin);

// PDFs
router.get("/pdfs", listPdfs);
router.post("/pdfs", uploadPdf);
router.delete("/pdfs/:id", deletePdf);

// Questions
router.get("/questions", listQuestions);
router.post("/questions", createQuestion);
router.post("/questions/bulk", bulkCreateQuestions);
router.delete("/questions/:id", deleteQuestion);

module.exports = router;
