chrome.browserAction.onClicked.addListener(function() {
  window.open(url);
});

var url = "https://github.com/notifications";

// TODO: Consider merging this method with the one that takes care of desktop notifications if their purposes align enough.
function setBrowserActionBadge(backgroundColor, text, title) {
  chrome.browserAction.setBadgeBackgroundColor({ color: backgroundColor || "none" });
  chrome.browserAction.setBadgeText({ text: text || "" });
  chrome.browserAction.setTitle({ title: title || "" });
}

function fetchGitHubNotificationsPageHtml() {
  return new Promise(function (resolve, reject) {
    window.fetch(url, { credentials: "include" })
      .then(function (response) {
        response
          .text()
          .then(function (text) {
            resolve(text);
          })
          .catch(function (error) {
            reject(new Error("Failed to read GitHub.com."));
          });
      })
      .catch(function (error) {
        reject(new Error("Failed to fetch GitHub.com."));
      });
  });
}

function matchUnreadNotificationCount() {
  return new Promise(function (resolve, reject) {
    fetchGitHubNotificationsPageHtml()
      .then(function (text) {
        var match = text.match(/<span class="count">(\d+)<\/span>/);
        if (match.length === 2) {
          resolve(match[1]);
        } else {
          reject(new Error("Matched " + match.length + "matched. Expected 2."));
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function refreshUnreadNotificationCount() {
  matchUnreadNotificationCount()
    .then(function (count) {
      setBrowserActionBadge("#33ff99", count === "0" ? null : count, "GitHub Notifications: " + count);
      var title = "GitHub Notifications: ";
      chrome.notifications.create({ type: "basic", iconUrl: "/icon-128.png", title: title + count, message: title, contextMessage: count, eventTime: new Date().getTime() });
    })
    .catch(function (error) {
      console.error("Failed to match GitHub.com.", error);
    });
}

function matchWebSocketUrl() {
  return new Promise(function (resolve, reject) {
    fetchGitHubNotificationsPageHtml()
      .then(function (text) {
        var match = text.match(/wss:\/\/live\.github\.com\/_sockets\/(\w|-)+/);
        if (match.length === 2) {
          resolve(match[0]);
        } else {
          reject(new Error("Matched " + match.length + "matched. Expected 1."));
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function refreshWebSocket() {
  matchWebSocketUrl()
    .then(function (webSocketUrl) {
      var webSocket = new WebSocket(webSocketUrl);
      
      webSocket.onopen = function () {
        console.debug("WebSocket open.");
        webSocket.send("subscribe:notification-changed:TomasHubelbauer");
        refreshUnreadNotificationCount();
      };
    
      webSocket.onmessage = function (message) {
        console.debug("WebSocket message.", message);
        refreshUnreadNotificationCount();
      };
    
      webSocket.onerror = function (error) {
        console.error("WebSocket error.", error);
        setBrowserActionBadge("#99ff33", "!", error.toString());
      };
    
      webSocket.onclose = function () {
        console.debug("WebSocket close.");
      };
    })
    .catch(function (error) {
      console.error("Failed to match GitHub.com.", error);
    });
}

refreshWebSocket();
