"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsStream = commentsStream;
exports.broadcastComment = broadcastComment;
exports.historyList = historyList;
const events_1 = require("events");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const COMMENT_DIR = path_1.default.join(process.cwd(), "data", "comments");
// very small pub/sub bus per fileId@version
const bus = new events_1.EventEmitter();
bus.setMaxListeners(1000);
function chan(fileId, versionNo) {
    return `${fileId}@${versionNo}`;
}
/**
 * SSE stream endpoint
 * GET /files/:id/versions/:ver/comments/stream?token=<JWT>
 *
 */
function commentsStream(req, res) {
    const { id, ver } = req.params;
    const versionNo = Number(ver);
    // CORS for SSE
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    // lightweight auth here
    const token = req.query.token || "";
    try {
        if (!token)
            throw new Error("Missing token");
        jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    }
    catch {
        return res.status(401).end("Invalid or missing token");
    }
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const send = (type, payload) => {
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    send("ready", { channel: chan(id, versionNo) });
    const listener = (evt) => {
        send(evt.type, evt.payload);
    };
    bus.on(chan(id, versionNo), listener);
    const heartbeat = setInterval(() => {
        res.write(`:\n\n`);
    }, 25000);
    req.on("close", () => {
        clearInterval(heartbeat);
        bus.off(chan(id, versionNo), listener);
        res.end();
    });
}
/**
 * Called by controllers to broadcast realtime events.
 */
function broadcastComment(fileId, versionNo, type, payload) {
    bus.emit(chan(fileId, versionNo), { type, payload });
}
// Helper to read comments from disk
async function historyList(req, res) {
    const { id, ver } = req.params;
    const file = path_1.default.join(COMMENT_DIR, `${id}@${ver}.json`);
    try {
        const data = await promises_1.default.readFile(file, "utf-8");
        res.json(JSON.parse(data));
    }
    catch {
        res.json([]); // no file → return empty array
    }
}
//# sourceMappingURL=sse.js.map