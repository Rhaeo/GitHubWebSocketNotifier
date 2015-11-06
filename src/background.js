var model = null;
var modelChangeNumber = 0;

chrome.notifications.onClosed.addListener((notificationId, byUser) => {

});

chrome.notifications.onClicked.addListener(notificationId => {
  for (var repository of model.repositories) {
    for (var issue of repository.issues) {
      if (issue.id === notificationId) {
        window.open(issue.url);
        return;
      }
    }
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  switch (buttonIndex) {
    case 0: {
      for (var repository of model.repositories) {
        for (var issue of repository.issues) {
          if (issue.id === notificationId) {
            window.open(issue.url);
            return;
          }
        }
      }
      throw new Error("Issue not found.");
    }
    case 1: {
      window.open("https://github.com/notifications");
      return;
    }
    case 2: {
      // TODO: Mark as read.
      break;
    }
    case 3: {
      // TODO: Unsubscribe from the thread.
      break;
    }
  }
});

document.addEventListener("modelchange", event => {
  model = event.detail;
  modelChangeNumber++;
  setBrowserActionBadge("#33ff99", model.unreadNotificationCount === "0" ? null : model.unreadNotificationCount, `GitHub Notifications: ${model.unreadNotificationCount}`);
});

document.addEventListener("issueadded", event => {
  if (modelChangeNumber > 1) {
    chrome.notifications.create(event.detail.id,
    {
      type: "basic",
      iconUrl: "/icon-128.png",
      title: event.detail.repositoryName,
      message: event.detail.name,
      eventTime: new Date().getTime(),
      buttons: [{title: "View notification"}, {title: "View all notifications"}, {title: "Mark as read"}, {title: "Unsubscribe from the thread"}]
    });
  }
});

document.addEventListener("issueremoved", event => {
  
});
