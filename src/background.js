document.addEventListener("modelchange", function (event) {
  var count = event.detail.unreadNotificationCount;
  setBrowserActionBadge("#33ff99", count === "0" ? null : count, "GitHub Notifications: " + count);
  var title = "GitHub Notifications: ";
  chrome.notifications.create({ type: "basic", iconUrl: "/icon-128.png", title: title + count, message: title, contextMessage: count, eventTime: new Date().getTime() });
});
