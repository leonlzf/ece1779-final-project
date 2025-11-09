import { Router } from "express";
import {
  searchTags,
  replaceFileTags,
  patchFileTags,
  getFileTags,
} from "./controller";
import { requireAuth } from "../../middleware/auth";

export const tagsRouter = Router();

// Tag dictionary search
tagsRouter.get("/tags", requireAuth, searchTags);

// File tags
tagsRouter.get("/files/:id/tags", requireAuth, getFileTags);
tagsRouter.put("/files/:id/tags", requireAuth, replaceFileTags);
tagsRouter.patch("/files/:id/tags", requireAuth, patchFileTags);
