import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// as we publish only the dist folder, we need to copy some meta files inside (readme/license/package.json)
// also changes paths inside the copied `package.json` (`dist/index.js` -> `index.js`)
const root = resolve(fileURLToPath(import.meta.url), "../..");
const target = resolve(process.cwd(), "dist");
const pkgPath = resolve(process.cwd(), "package.json");
const require = createRequire(resolve(root));

const options = process.argv.slice(2).reduce((args, arg) => {
  const [key, value] = arg.split("=");
  args[key.substring(2)] = value ?? true;

  return args;
}, {});

function copy(filename, from, to) {
  copyFileSync(resolve(from, filename), resolve(to, filename));
}

function rewrite(path, replacer) {
  try {
    const file = readFileSync(path).toString();
    const replaced = replacer(file);
    writeFileSync(path, replaced);
  } catch {
    // not found
  }
}

let rootVersion;

async function getRootVersion(bump = true) {
  if (rootVersion) {
    return rootVersion;
  }

  const pkg = require(resolve(root, "./package.json"));
  rootVersion = pkg.version.replace(/^(\d+\.\d+\.\d+)-?.*$/, "$1");

  if (bump) {
    const parts = rootVersion.split(".");
    const inc = bump ? 1 : 0;

    switch (options.canary?.toLowerCase()) {
      case "major": {
        parts[0] = `${+parts[0] + inc}`;
        parts[1] = 0;
        parts[2] = 0;
        break;
      }
      case "minor": {
        parts[1] = `${+parts[0] + inc}`;
        parts[2] = 0;
        break;
      }
      case "patch":
      default:
        parts[2] = `${+parts[2] + inc}`;
    }

    rootVersion = parts.join(".");
  }

  return rootVersion;
}

/**
 * Checks next dev version number based on the `@mikro-orm/core` meta package via `npm show`.
 * We always use this package, so we ensure the version is the same for each package in the monorepo.
 */
async function getNextVersion() {
  const versions = [];

  try {
    const versionString = execSync(`npm show @oliversalzburg/js-utils versions --json`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    const parsed = JSON.parse(versionString);
    versions.push(...parsed);
  } catch {
    // the package might not have been published yet
  }

  const version = await getRootVersion();

  if (versions.some(v => v === version)) {
    // eslint-disable-next-line no-console
    console.error(
      `before-deploy: A release with version ${version} already exists. Please increment version accordingly.`,
    );
    process.exit(1);
  }

  const preid = options.preid ?? "dev";
  const prereleaseNumbers = versions
    .filter(v => v.startsWith(`${version}-${preid}.`))
    .map(v => Number(v.match(/\.(\d+)$/)?.[1]));
  const lastPrereleaseNumber = Math.max(-1, ...prereleaseNumbers);

  return `${version}-${preid}.${lastPrereleaseNumber + 1}`;
}

if (options.canary) {
  const pkgJson = require(pkgPath);
  const nextVersion = await getNextVersion();
  pkgJson.version = nextVersion;

  // eslint-disable-next-line no-console
  console.info(`canary: setting version to ${nextVersion}`);

  writeFileSync(pkgPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
}

mkdirSync(target, { recursive: true });
copy("README.md", root, target);
copy("LICENSE", root, target);
copy("package.json", process.cwd(), target);

rewrite(resolve(target, "package.json"), pkg => {
  return pkg.replace(/lib\/?/g, "");
});
