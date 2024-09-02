const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const BuildPaths = require('../build-paths');

console.log('-> clean up');

const themesLight = fs.readdirSync(path.join(BuildPaths.EXTENSION, 'themes/light'));
const themesDark = fs.readdirSync(path.join(BuildPaths.EXTENSION, 'themes/dark'));
const themes = [...themesLight, ...themesDark];
const themesCount = themes.length + 1;
console.log('-> ' + themesCount + ' themes');

fs.removeSync(path.join(BuildPaths.EXTENSION, 'assets/viewer-alert.js'));
fs.readdirSync(path.join(BuildPaths.EXTENSION, 'assets')).forEach(filename => {
  if (themes.includes(filename)) {
    console.log('  removed: assets/' + filename);
    fs.removeSync(path.join(BuildPaths.EXTENSION, 'assets', filename));
  }
});

console.log('-> zipping');
const zipName = 'json_viewer.zip';
const zipPath = path.join(BuildPaths.BUILD_DIR, zipName);
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip');

archive.pipe(output);

archive.directory(BuildPaths.EXTENSION, false);

archive.on("finish", () => {
  const manifest = fs.readJSONSync(path.join(BuildPaths.EXTENSION, 'manifest.json'));
  const version = manifest.version;

  console.log('-> finishing version: ' + version);
  fs.copySync(zipPath, path.join(BuildPaths.RELEASE_DIR, version, zipName));
  console.log('-> done');
});

archive.finalize();
