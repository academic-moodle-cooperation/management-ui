// Minimal no-backend stub for local Management UI development
// (docs/contribute/setup.md → "No backend at all"), answering as a logged-in
// admin so role-gated routes render. Also serves the trial-demo test bundle.
import { readFileSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const json = (res, body) => {
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = req.url ?? "";
  if (url.startsWith("/plugins/trial-demo.mjs")) {
    res.writeHead(200, { "Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*" });
    return res.end(readFileSync(join(here, "trial-demo.mjs")));
  }
  if (url.startsWith("/info/me.json")) {
    return json(res, {
      org: { id: "mh_default_org", name: "Local Dev", properties: {} },
      roles: ["ROLE_ADMIN", "ROLE_USER_ADMIN", "ROLE_AUTHENTICATED"],
      userRole: "ROLE_USER_ADMIN",
      user: { name: "Local Admin", email: "admin@example.org", username: "admin" },
    });
  }
  if (url.startsWith("/management-tool/ui/config/plugins.json")) return json(res, { plugins: [] });
  if (url.startsWith("/graphql")) {
    return json(res, { data: { currentUser: { __typename: "User", username: "admin", name: "Local Admin", email: "admin@example.org", userRole: "ROLE_USER_ADMIN" } } });
  }
  return json(res, {});
}).listen(4600, "127.0.0.1", () => console.log("stub backend on http://127.0.0.1:4600"));
