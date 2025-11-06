import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as ctl from "./controller";

export const commentsRouter = Router();

// Require JWT authentication for all comment actions
commentsRouter.use(requireAuth);

// Create a comment (or a reply)
commentsRouter.post("/files/:id/versions/:ver/comments", ctl.create);

// List all comments (threaded) for a file version
commentsRouter.get("/files/:id/versions/:ver/comments", ctl.list);

// Edit an existing comment
commentsRouter.patch("/comments/:commentId", ctl.update);

// Delete a comment (author or OWNER can delete)
commentsRouter.delete("/comments/:commentId", ctl.remove);

// Optional future features:
// commentsRouter.post("/comments/:commentId/resolve", ctl.resolve);
// commentsRouter.post("/comments/:commentId/reopen", ctl.reopen);
