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
            var document = new DOMParser().parseFromString(text, "text/html");
            resolve({
              webSocketUrl: document.querySelector("link[rel=web-socket]").getAttribute("href"),
              userName: document.querySelector(".css-truncate-target").textContent,
              unreadNotificationCount: document.querySelector(".count").textContent,
              respositories: Array.prototype.map.call(document.querySelectorAll(".notifications-list .boxed-group"), function (node) {
                return {
                  name: node.querySelector("h3 a").textContent,
                  issues: Array.prototype.map.call(node.querySelectorAll("li.js-notification"), function (node) {
                    var unsubscribeFormNode = node.querySelector(".js-delete-notification");
                    return {
                      name: node.querySelector("a").textContent.trim(),
                      unsubscribePostUrl: unsubscribeFormNode.getAttribute("action"),
                      unsubscribePostNonce: unsubscribeFormNode.getAttribute("data-form-nonce")
                    };
                  })
                };
              })
            });
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
