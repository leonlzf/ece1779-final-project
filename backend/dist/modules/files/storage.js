"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_ROOT = void 0;
exports.ensureDir = ensureDir;
exports.nextVersion = nextVersion;
exports.versionPath = versionPath;
exports.listFileIds = listFileIds;
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.FILE_ROOT = process.env.FILE_ROOT || "/mnt/volume_files";
fs_1.default.mkdirSync(exports.FILE_ROOT, { recursive: true });
console.log("FILE_ROOT = ", exports.FILE_ROOT);
async function ensureDir(p) { await promises_1.default.mkdir(p, { recursive: true }); }
async function nextVersion(fileId) {
    const dir = path_1.default.join(exports.FILE_ROOT, fileId);
    try {
        await promises_1.default.access(dir);
    }
    catch {
        await promises_1.default.mkdir(dir, { recursive: true });
        return 1;
    }
    const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
    const nums = entries.filter(e => e.isDirectory()).map(d => Number(d.name)).filter(n => !isNaN(n));
    return (nums.length ? Math.max(...nums) : 0) + 1;
}
function versionPath(fileId, ver, original) {
    return path_1.default.posix.join(exports.FILE_ROOT, fileId, String(ver), original);
}
async function listFileIds() {
    try {
        await promises_1.default.access(exports.FILE_ROOT);
    }
    catch {
        return [];
    }
    return (await promises_1.default.readdir(exports.FILE_ROOT)).filter(name => fs_1.default.statSync(path_1.default.join(exports.FILE_ROOT, name)).isDirectory());
}
//# sourceMappingURL=storage.js.map