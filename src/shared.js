var oldIssues = {};

function dispatchDiffs(model) {
  var newIssues = {};
  
  for (var repository of model.repositories) {
    for (var issue of repository.issues) {
      newIssues[repository.name + "#" + issue.id] = issue;
    }
  }
  
  var issueIds = Object.keys(oldIssues).concat(Object.keys(newIssues));
  for (var issueId of issueIds) {
    if (!oldIssues[issueId]) {
      if (newIssues[issueId]) {
        document.dispatchEvent(new CustomEvent("issueadded", { detail: newIssues[issueId] }));
      }
    } else if (!newIssues[issueId]) {
      document.dispatchEvent(new CustomEvent("issueremoved", { detail: oldIssues[issueId] }));
    }
  }
  
  oldIssues = newIssues;
}

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
                var repositoryName = node.querySelector("h3 a").textContent;
                return {
                  name: repositoryName,
                  issues: Array.prototype.map.call(node.querySelectorAll("li.js-notification"), function (node) {
                    var aNode = node.querySelector(".js-notification-target");
                    var issueName = aNode.textContent.trim();
                    var url = aNode.getAttribute("href");
                    var id = url.substr(url.lastIndexOf("/") + 1);
                    var deleteFormNode = node.querySelector(".js-delete-notification");
                    var deletePostUrl = deleteFormNode.getAttribute("action");
                    var deletePostNonce = deleteFormNode.getAttribute("data-form-nonce");
                    var deletePostToken = deleteFormNode.querySelector("input[name=authenticity_token]").getAttribute("value");
                    var muteFormNode = node.querySelector(".js-mute-notification");
                    var mutePostUrl = muteFormNode.getAttribute("action");
                    var mutePostNonce = muteFormNode.getAttribute("data-form-nonce");
                    var mutePostToken = muteFormNode.querySelector("input[name=authenticity_token]").getAttribute("value");
                    var unmuteFormNode = node.querySelector(".js-unmute-notification");
                    var unmutePostUrl = unmuteFormNode.getAttribute("action");
                    var unmutePostNonce = unmuteFormNode.getAttribute("data-form-nonce");
                    var unmutePostToken = unmuteFormNode.querySelector("input[name=authenticity_token]").getAttribute("value");
                    return { repositoryName, name: issueName, url, id, deletePostUrl, deletePostNonce, deletePostToken, mutePostUrl, mutePostNonce, mutePostToken, unmutePostUrl, unmutePostNonce, unmutePostToken };
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
      dispatchDiffs(model);
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
        var data = JSON.parse(message.data);
        switch (data[0]) {
          case ("notification-changed:" + model.userName): { dispatchModel(); break; }
          default: console.error("Unknown WebSocket message", data);
        }
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
