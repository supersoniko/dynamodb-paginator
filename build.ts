import { BuildOptions, build, Plugin } from "esbuild";
import { glob } from "glob";
import fs from "fs";
import path from "path";

const entryPoints = glob.sync("./lib/**/*.ts");

const addJsExtensionPlugin: Plugin = {
  name: "add-js-extension",
  setup(build) {
    build.onEnd(() => {
      function addJsExtensionToImports(filePath: string) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const updatedContent = fileContent.replace(
          /from ['"](.+?)['"]/g,
          (match, importPath) => {
            if (importPath.startsWith(".") && !importPath.endsWith(".js")) {
              return `from '${importPath}.js'`;
            }
            return match;
          }
        );
        fs.writeFileSync(filePath, updatedContent);
      }

      function processDirectory(dirPath: string) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            processDirectory(path.join(dirPath, entry.name));
          } else if (entry.name.endsWith(".js")) {
            addJsExtensionToImports(path.join(dirPath, entry.name));
          }
        }
      }

      processDirectory("./.dist");
    });
  },
};

const buildConfig = {
  entryPoints: [...entryPoints, "./index.ts"],
  platform: "node",
  format: "esm",
  sourcemap: false,
  outdir: ".dist",
  plugins: [addJsExtensionPlugin],
} as BuildOptions;

build(buildConfig).catch(() => process.exit(1));
