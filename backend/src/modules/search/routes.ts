import { Router } from "express";
import { searchFiles } from "./controller";
import { requireAuth } from "../../middleware/auth";

export const searchRouter = Router();

// File search with fuzzy name + AND tags + owner filter
searchRouter.get("/search/files", requireAuth, searchFiles);
