const fs = require('fs-extra');
const path = require('path');
const BuildPaths = require('../build-paths');

function copyTheme(darkness, list) {
  const paths = [];
  list.forEach(theme => {
    const themeCSS = theme.replace(/\.js$/, '.css');
    const themeCSSPath = `themes/${darkness}/${theme}.css`;
    const themePath = path.join(BuildPaths.EXTENSION, 'assets', theme);

    if (fs.existsSync(themePath + '.js') && fs.existsSync(themePath + '.css')) {
      fs.removeSync(themePath + '.js');
      fs.copySync(themePath + '.css', path.join(BuildPaths.EXTENSION, themeCSSPath));
      console.log('  copied: ' + themeCSSPath);
      paths.push(themeCSSPath);

    } else {
      console.error('  fail to copy: ' + (themePath + '.css'));
    }
  });

  return paths;
}

class BuildExtension {
  constructor(options) {
    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.done.tap('BuildExtensionPlugin', () => {
      console.log('\n');
      console.log('-> copying files');
      fs.copySync(path.join(BuildPaths.SRC_ROOT, 'icons'), path.join(BuildPaths.EXTENSION, 'icons'));
      fs.copySync(path.join(BuildPaths.SRC_ROOT, 'pages'), path.join(BuildPaths.EXTENSION, 'pages'));

      console.log('-> copying themes');

      const availableThemes = this.options.themes;
      console.log(availableThemes);
      const themesCSSPaths = copyTheme('light', availableThemes.light)
        .concat(copyTheme('dark', availableThemes.dark))

      const manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
      console.log(manifest.web_accessible_resources[0].resources);
      console.log('-----------------------');
      console.log(manifest.web_accessible_resources.concat(themesCSSPaths));
      manifest.web_accessible_resources[0].resources = manifest.web_accessible_resources[0].resources.concat(themesCSSPaths);

      if (process.env.NODE_ENV !== 'production') {
        console.log('-> dev version');
        manifest.name += ' - dev';
      }

      console.log('-> copying manifest.json');
      fs.outputJSONSync(path.join(BuildPaths.EXTENSION, 'manifest.json'), manifest);
    });
  }
}

module.exports = BuildExtension;
