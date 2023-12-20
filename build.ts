import { BuildOptions, build } from "esbuild";
import { glob } from "glob";

const entryPoints = glob.sync("./lib/**/*.ts");

const buildConfig = {
  entryPoints: [...entryPoints, "./index.ts"],
  platform: "node",
  format: "esm",
  sourcemap: false,
  outdir: ".dist",
} as BuildOptions;

build(buildConfig).catch(() => process.exit(1));
