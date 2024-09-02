const defaults = require('./options/defaults');
const merge = require('./merge');

const OLD_NAMESPACE = "options";
const NAMESPACE = "v2.options";

module.exports = {
  save: function(obj, callback) {
    chrome.storage.local.set({ [NAMESPACE]: JSON.stringify(obj) }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving data:', chrome.runtime.lastError);
      } else {
        if (callback) callback();
      }
    });
  },

  load: function() {
    return new Promise((res) => {
      chrome.storage.local.get([NAMESPACE, OLD_NAMESPACE], (result) => {
        let optionsStr = result[NAMESPACE];
        optionsStr = this.restoreOldOptions(result[OLD_NAMESPACE], optionsStr);
        let options = optionsStr ? JSON.parse(optionsStr) : {};
        options.theme = options.theme || defaults.theme;
        options.addons = options.addons ? JSON.parse(options.addons) : {};
        options.addons = merge({}, defaults.addons, options.addons);
        options.structure = options.structure ? JSON.parse(options.structure) : defaults.structure;
        options.style = options.style && options.style.length > 0 ? options.style : defaults.style;
        res(options);
      });
    })
  },

  restoreOldOptions: function(oldOptionsStr, optionsStr) {
    let options = null;

    if (optionsStr === undefined && oldOptionsStr !== undefined) {
      try {
        let oldOptions = JSON.parse(oldOptionsStr);
        if (!oldOptions || typeof oldOptions !== "object") oldOptions = {};

        options = {};
        options.theme = oldOptions.theme;
        options.addons = {
          prependHeader: JSON.parse(oldOptions.prependHeader || defaults.addons.prependHeader),
          maxJsonSize: parseInt(oldOptions.maxJsonSize || defaults.addons.maxJsonSize, 10)
        };

        // Update to at least the new max value
        if (options.addons.maxJsonSize < defaults.addons.maxJsonSize) {
          options.addons.maxJsonSize = defaults.addons.maxJsonSize;
        }

        options.addons = JSON.stringify(options.addons);
        options.structure = JSON.stringify(defaults.structure);
        options.style = defaults.style;

        this.save(options, () => {
          // Callback after saving old options
          optionsStr = JSON.stringify(options);
        });

      } catch(e) {
        console.error('[JSONViewer] error: ' + e.message, e);

      } finally {
        chrome.storage.local.remove(OLD_NAMESPACE);
      }
    }

    return optionsStr;
  }
};
