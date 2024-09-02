const sendJson = require('./send-json.js');

function exposeJson(text, outsideViewer) {
  if (outsideViewer) {
    window.json = JSON.parse(text);
  } else {
    sendJson(text)
  }
  console.info("[JSONViewer] Your json was stored into 'window.json', enjoy!");
}

module.exports = exposeJson;
