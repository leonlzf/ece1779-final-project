import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

function printRoutes() {
  // @ts-ignore
  const stack = app._router?.stack || [];
  console.log("Registered routes:");
  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route?.path;
      const methods = Object.keys(layer.route.methods).join(",");
      console.log(`  ${methods.toUpperCase()} ${path}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      for (const r of layer.handle.stack) {
        const subPath = (r.route && r.route.path) || "";
        const methods = r.route ? Object.keys(r.route.methods).join(",") : "";
        // @ts-ignore
        const mountPath = layer.regexp?.source?.replace(/^\\\//, "/").replace(/\\\//g, "/").replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ":param");
        console.log(`  ${methods.toUpperCase()} ${mountPath}${subPath}`);
      }
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  printRoutes();
});