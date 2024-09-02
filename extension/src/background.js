const Storage = require('./json-viewer/storage');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  (async () => {
    try {
      if (request.action === "GET_OPTIONS") {
        sendResponse({err: false, value: (await Storage.load())});
      } else if (request.action === "SEND_JSON") {
        chrome.scripting.executeScript({
          target: {tabId: sender.tab.id},
          func: (json) => {
            window.json = JSON.parse(json);
          },
          args: [request.content.json],
          world: 'MAIN',
        }).then();
      }
    } catch (e) {
      sendResponse({err: e});
    }
  })();
  return true;
});

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
  suggest([
    {
      content: "Format JSON",
      description: "(Format JSON) Open a page with json highlighted"
    },
    {
      content: "Scratch pad",
      description: "(Scratch pad) Area to write and format/highlight JSON"
    }
  ]);
});

chrome.omnibox.onInputEntered.addListener(function (text) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    var omniboxUrl = chrome.runtime.getURL("/pages/omnibox.html");
    var path = /scratch pad/i.test(text) ? "?scratch-page=true" : "?json=" + encodeURIComponent(text);
    var url = omniboxUrl + path;
    chrome.tabs.update(tabs[0].id, {url: url});
  });
});

