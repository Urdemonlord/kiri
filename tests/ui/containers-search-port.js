// parity: macos windows linux
// window: 1440x900
// Search in Containers' list matches a container's ports too, public and
// private: typing 8080 or 80 finds the container publishing 8080->80, and a
// port a container only listens on (no PublicPort) finds it as well. Names
// and images still match as before.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const now = Math.floor(Date.now() / 1000);
const C = (id, name, image, ports) => ({ Id: id, Names: ["/" + name], Image: image, State: "running", Status: "Up 1 hour",
  Created: now - 60, Ports: ports, Labels: {} });
const ctrs = [
  C("web", "web", "nginx:alpine", [{ PublicPort: 8080, PrivatePort: 80, Type: "tcp" }]),
  C("db", "db", "postgres:16", [{ PublicPort: 5432, PrivatePort: 5432, Type: "tcp" }]),
  C("cache", "cache", "redis:7", [{ PrivatePort: 6379, Type: "tcp" }]),
  C("plain", "plain", "alpine:3", []),
];
ui.vm = "running";
kiri.on({ type: "status", version: "0.1.4", dev: true, share: true, app: "Kiri", ours: "kiri", context: "kiri" });
kiri.on({ type: "lists", containers: ctrs, images: [], volumes: [], networks: [] });
show("containers");
const keys = () => [...document.querySelectorAll("#content tbody tr")].map((r) => r.dataset.key);
const find = (q) => { ui.filter = q; render(); };
t("no search: every container", () => eq(keys(), ["web", "db", "cache", "plain"], "rows"));
t("a public port finds its container", () => { find("8080"); eq(keys(), ["web"], "8080"); });
t("a private port finds its container too", () => { find("80"); eq(keys(), ["web"], "80"); });
t("a port only listened on, never published, finds its container", () => { find("6379"); eq(keys(), ["cache"], "6379"); });
t("a partial port matches by substring, as names do", () => { find("543"); eq(keys(), ["db"], "543"); });
t("names and images still match", () => {
  find("postgres"); eq(keys(), ["db"], "image");
  find("cache"); eq(keys(), ["cache"], "name");
});
t("nothing that exists: Nothing matches", () => {
  find("9999");
  eq([keys(), document.querySelector("#content .empty p")?.textContent], [[], "Nothing matches “9999”."], "empty");
});
t("Compose's list matches ports the same way", () => {
  const c = { ...ctrs[0], Labels: { "com.docker.compose.project": "shop", "com.docker.compose.service": "web" } };
  ui.filter = "8080"; eq(LISTS.compose.hit(c), true, "public port in Compose");
  ui.filter = "80"; eq(LISTS.compose.hit(c), true, "private port in Compose");
  ui.filter = "9999"; eq(LISTS.compose.hit(c), false, "no match in Compose");
});
find("");
report(R);
