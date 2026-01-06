const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/authController");

const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", requireAuth, changePassword);

module.exports = router;
