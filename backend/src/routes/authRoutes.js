import { Router } from "express";
import { z } from "zod";
import { login, me, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const authRouter = Router();

const authSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(160),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const registerSchema = z.object({
  body: authSchema.shape.body.extend({
    name: z.string().trim().min(2).max(80)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(authSchema), login);
authRouter.get("/me", authenticate, me);

export { authRouter };
