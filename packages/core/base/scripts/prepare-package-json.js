import { readdir, existsSync, writeFile } from "fs";
import { join } from "path";

const buildDir = "./lib";
function createEsmModulePackageJson() {
  readdir(buildDir, function (err, dirs) {
    if (err) {
      throw err;
    }
    dirs.forEach(function (dir) {
      if (dir === "esm") {
        var packageJsonFile = join(buildDir, dir, "./package.json");
        if (!existsSync(packageJsonFile)) {
          writeFile(
            packageJsonFile,
            new Uint8Array(Buffer.from('{"type": "module"}')),
            function (err) {
              if (err) {
                throw err;
              }
            }
          );
        }
      }
    });
  });
}

createEsmModulePackageJson();
