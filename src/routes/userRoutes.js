import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';
import { generatePdf } from '../controllers/pdfController.js';

const router = express.Router();

// Register a new user
router.post('/register', registerUser);

// Login a user
router.post('/login', loginUser);





export default router;