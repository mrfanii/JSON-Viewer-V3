function sendJson(json) {
  chrome.runtime.sendMessage({action: "SEND_JSON", content: {json}}).then();
  return true
}

module.exports = sendJson;
