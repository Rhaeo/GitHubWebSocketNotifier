var model = null;

chrome.notifications.onClosed.addListener(function (notificationId, byUser) {

});

chrome.notifications.onClicked.addListener(function (notificationId) {
  for (var repository of model.repositories) {
    for (var issue of repository.issues) {
      if (issue.id === notificationId) {
        window.open(issue.url);
        return;
      }
    }
  }
});

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
  if (buttonIndex === 1) {
    window.open("https://github.com/notifications");
    return;
  }
  
  for (var repository of model.repositories) {
    for (var issue of repository.issues) {
      if (issue.id === notificationId) {
        window.open(issue.url);
        return;
      }
    }
  }
});

document.addEventListener("modelchange", function (event) {
  model = event.detail;
  setBrowserActionBadge("#33ff99", model.unreadNotificationCount === "0" ? null : model.unreadNotificationCount, "GitHub Notifications: " + model.unreadNotificationCount);
});

document.addEventListener("issueadded", function (event) {
  chrome.notifications.create(event.detail.id,
  {
    type: "basic",
    iconUrl: "/icon-128.png",
    title: event.detail.repositoryName,
    message: event.detail.name,
    eventTime: new Date().getTime(),
    buttons: [{title: "View notification"}, {title: "View all notifications"}]
  });
});

document.addEventListener("issueremoved", function (event) {
  
});
