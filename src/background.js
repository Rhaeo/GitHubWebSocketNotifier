var url = "https://github.com/notifications";

chrome.browserAction.onClicked.addListener(function() {
  window.open(url);
});

fetch(url, { credentials: "include" })
  .then(function (response) {
    response
      .text()
      .then(function (text) {
        var match = text.match(/wss:\/\/live\.github\.com\/_sockets\/(\w|-)+/);
        if (match.length !== 1) {
          chrome.notifications.create("GitHubWebSocketNotifier",
          {
            type: "basic",
            iconUrl: "/icon-128.png",
            title: "GitHub Notifications",
            message: "Hi!"
          });
          
          var webSocket = new WebSocket(match[0]);

          webSocket.onopen = function () {
            console.debug("WebSocket open.");
            webSocket.send("subscribe:notification-changed:TomasHubelbauer");
            webSocket.onmessage(null);
          };

          webSocket.onmessage = function (message) {
            console.debug("WebSocket message.", message);
            chrome.browserAction.setBadgeBackgroundColor({ color: "#3399ff" });
            chrome.browserAction.setBadgeText({ text: "?" });
            chrome.browserAction.setTitle({ title: "GitHub Notifications: Reloading…" });
            fetch (url, { credentials: "include" })
              .then(function (response) {
                response
                  .text()
                  .then(function (text) {
                    var match = text.match(/<span class="count">(\d+)<\/span>/);
                    if (match.length !== 1) {
                      chrome.browserAction.setBadgeText({ text: match[1] === "0" ? "" : match[1] });
                      chrome.browserAction.setTitle({ title: "GitHub Notifications: " + match[1] });
                      chrome.notifications.update("GitHubWebSocketNotifier",
                      {
                        type: "basic",
                        iconUrl: "/icon-128.png",
                        title: "GitHub Notifications: " + match[1],
                        message: "GitHub Notifications",
                        contextMessage: match[1],
                        eventTime: new Date().getMilliseconds()
                      });
                    } else {
                      console.error("Failed to match GitHub.com.", match);
                    }
                  })
                  .catch(function (error) {
                    console.error("Failed to load GitHub.com.", error);
                  });
              })
              .catch(function (error) {
                console.error("Failed to fetch GitHub.com.", error);
              });
          };

          webSocket.onerror = function (error) {
            console.error("WebSocket error.", error);
            chrome.browserAction.setBadgeBackgroundColor({ color: "#99ff33" });
            chrome.browserAction.setBadgeText({ text: "!" });
            chrome.browserAction.setTitle({ title: error });
          };

          webSocket.onclose = function () {
            console.debug("WebSocket close.");
          };
        } else {
          console.error("Failed to match GitHub.com.", match);
        }
      })
      .catch(function (error) {
        console.error("Failed to load GitHub.com.", error);
      });    
  })
  .catch(function (error) {
    console.error("Failed to fetch GitHub.com.", error);
  });