import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function getGitCommit() {
  if (process.env.NEXT_PUBLIC_GIT_COMMIT) return process.env.NEXT_PUBLIC_GIT_COMMIT;
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  try {
    const gitHeadPath = path.join(process.cwd(), ".git", "HEAD");
    if (fs.existsSync(gitHeadPath)) {
      const head = fs.readFileSync(gitHeadPath, "utf8").trim();
      if (head.startsWith("ref: ")) {
        const refPath = path.join(process.cwd(), ".git", head.slice(5));
        if (fs.existsSync(refPath)) {
          return fs.readFileSync(refPath, "utf8").trim().substring(0, 7);
        }
      } else {
        return head.substring(0, 7);
      }
    }
  } catch {}
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {}
  return "live";
}

function getAppVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    return pkg.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
    NEXT_PUBLIC_GIT_COMMIT: getGitCommit(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
