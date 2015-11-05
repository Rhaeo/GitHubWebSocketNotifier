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

function scrapeModel() {
  return new Promise(function (resolve, reject) {
    window.fetch(url, { credentials: "include" })
      .then(function (response) {
        response
          .text()
          .then(function (text) {
            var data = {};
            
            var webSocketUrlMatch = text.match(/wss:\/\/live\.github\.com\/_sockets\/(\w|-)+/);
            if (webSocketUrlMatch.length === 2) {
              data.webSocketUrl = webSocketUrlMatch[0];
            } else {
              reject(new Error("Matched " + webSocketUrlMatch.length + "matched when matching the web socket URL. Expected 1."));
            }
            
            var userNameMatch = text.match(/<strong class="css-truncate-target">(TomasHubelbauer)<\/strong>/);
            if (userNameMatch.length === 2) {
              data.userName = userNameMatch[1];
            } else {
              reject(new Error("Matched " + userNameMatch.length + "matched when matching the user name. Expected 1."));
            }
            
            var unreadNotificationCountMatch = text.match(/<span class="count">(\d+)<\/span>/);
            if (unreadNotificationCountMatch.length === 2) {
              data.unreadNotificationCount = unreadNotificationCountMatch[1];
            } else {
              reject(new Error("Matched " + unreadNotificationCountMatch.length + "matched when matching the unread notification count. Expected 2."));
            }
            
            resolve(data);
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

function refreshUnreadNotificationCount() {
  scrapeModel()
    .then(function (model) {
      var count = model.unreadNotificationCount;
      setBrowserActionBadge("#33ff99", count === "0" ? null : count, "GitHub Notifications: " + count);
      var title = "GitHub Notifications: ";
      chrome.notifications.create({ type: "basic", iconUrl: "/icon-128.png", title: title + count, message: title, contextMessage: count, eventTime: new Date().getTime() });
    })
    .catch(function (error) {
      console.error("Failed to match GitHub.com.", error);
    });
}

function refreshWebSocket() {
  scrapeModel()
    .then(function (model) {
      var webSocket = new WebSocket(model.webSocketUrl);
      
      webSocket.onopen = function () {
        console.debug("WebSocket open.");
        webSocket.send("subscribe:notification-changed:" + model.userName);
        refreshUnreadNotificationCount();
      };
    
      webSocket.onmessage = function (message) {
        console.debug("WebSocket message.", message.data);
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
