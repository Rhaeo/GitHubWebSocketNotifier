document.addEventListener("modelchange", function (event) {
  document.clear();
  document.write("<a href='https://github.com/notifications' target='_blank'>GitHub Notifications</a>");
  for (var repositoryKey in event.detail.repositories) {
    var repository = event.detail.repositories[repositoryKey];
    document.write("<h2>" + repository.name + "</h2>");
    for (var issueKey in repository.issues) {
      var issue = repository.issues[issueKey];
      document.write("<div>" + issue.name + "</div>");
    }
  }
});
