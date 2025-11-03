import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.send("Backend is running successfully!");
});

app.get("/healthz", (_req, res) => {
  res.send("ok");
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

