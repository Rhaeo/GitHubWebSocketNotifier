function scrapeModel() {
  return new Promise(function (resolve, reject) {
    window.fetch("https://github.com/notifications", { credentials: "include" })
      .then(function (response) {
        response
          .text()
          .then(function (text) {
            var document = new DOMParser().parseFromString(text, "text/html");
            resolve({
              webSocketUrl: document.querySelector("link[rel=web-socket]").getAttribute("href"),
              userName: document.querySelector(".css-truncate-target").textContent,
              unreadNotificationCount: document.querySelector(".count").textContent,
              repositories: Array.prototype.map.call(document.querySelectorAll(".notifications-list .boxed-group"), function (node) {
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

function dispatchModel() {
  scrapeModel()
    .then(function (model) {
      document.dispatchEvent(new CustomEvent("modelchange", { detail: model }));
    })
    .catch(function (error) {
      console.error("Everything went awry.", error);
    });
}

function setBrowserActionBadge(backgroundColor, text, title) {
  chrome.browserAction.setBadgeBackgroundColor({ color: backgroundColor || "none" });
  chrome.browserAction.setBadgeText({ text: text || "" });
  chrome.browserAction.setTitle({ title: title || "" });
}

(function refreshWebSocket() {
  scrapeModel()
    .then(function (model) {
      var webSocket = new WebSocket(model.webSocketUrl);
      
      webSocket.onopen = function () {
        console.debug("WebSocket open.");
        webSocket.send("subscribe:notification-changed:" + model.userName);
        dispatchModel();
      };
    
      webSocket.onmessage = function (message) {
        console.debug("WebSocket message.", message.data);
        dispatchModel();
      };
    
      webSocket.onerror = function (error) {
        console.error("WebSocket error.", error);
        setBrowserActionBadge("#99ff33", "!", error.toString());
        // TODO: Refresh by calling `refreshWebSocket` as per #6.
      };
    
      webSocket.onclose = function () {
        console.debug("WebSocket close.");
      };
    })
    .catch(function (error) {
      console.error("Failed to match GitHub.com.", error);
    });
}());
