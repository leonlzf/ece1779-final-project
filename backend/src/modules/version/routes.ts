import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { listVersions, deleteVersion,autoSaveVersion,getVersionMeta,rollbackVersion } from "./controller";

export const versionsRouter = Router();


versionsRouter.use(requireAuth);
versionsRouter.post("/files/:id/versions/auto", autoSaveVersion);
versionsRouter.get("/files/:id/versions/:ver/meta", getVersionMeta);
versionsRouter.get("/files/:id/versions", listVersions);
versionsRouter.post("/files/:id/rollback/:ver", requireAuth, rollbackVersion);


versionsRouter.delete("/files/:id/versions/:ver", deleteVersion);
