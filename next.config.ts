import type { NextConfig } from "next";
import path from 'path';
import fs from 'fs';

// In git worktrees, node_modules lives in the main repo, not the worktree.
// Walk up from __dirname to find the nearest ancestor that contains node_modules.
function findPackageRoot(start: string): string {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules'))) return dir;
    dir = path.dirname(dir);
  }
  return start;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: findPackageRoot(__dirname),
  },
};

export default nextConfig;
