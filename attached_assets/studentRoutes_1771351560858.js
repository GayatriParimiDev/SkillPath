import express from "express";
import { createStudent, getRoadmap } from "../controllers/studentController.js";
import { updateProgress } from "../controllers/progressController.js";
import { getConceptGuide } from "../controllers/conceptController.js";
import { getFeedback } from "../controllers/feedbackController.js";
import { getAnalytics } from "../controllers/analyticsController.js";
import { evaluateIntegrity } from "../controllers/integrityController.js";






const router = express.Router();

router.post("/student", createStudent);
router.get("/roadmap/:id", getRoadmap);
router.post("/progress", updateProgress);
router.post("/concept", getConceptGuide);
router.post("/feedback", getFeedback);
router.get("/analytics/:student_id", getAnalytics);
router.post("/integrity", evaluateIntegrity);






export default router;
