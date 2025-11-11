import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../../middleware/auth";
import { createFile, addVersion, listFiles, downloadVersion, getFileMeta, deleteFile ,  shareFile,  editFile,saveFile } from "./controller";

const upload = multer({
  dest: path.join(process.cwd(), "tmp_uploads"),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const filesRouter = Router();
filesRouter.use(requireAuth);
filesRouter.post("/", upload.single("file"), createFile);
filesRouter.post("/:id/versions", upload.single("file"), addVersion);
filesRouter.get("/", listFiles);
filesRouter.get("/:id/versions/:ver/download", downloadVersion);
filesRouter.get("/:id", getFileMeta);
filesRouter.post("/:id/share", shareFile);
filesRouter.delete("/:id", deleteFile);
filesRouter.get("/:id/versions/:ver/edit", editFile);
filesRouter.put("/:id/versions/:ver/save", saveFile);
