class Popup extends React.Component {
  render() {
    var onClick = (url, nonce, token) => event => this.fetchPost(url, nonce, token);
  
    return (
      <div>
        <a className="popupHeading" href="https://github.com">GitHub Notifications</a>
        <span>: {this.props.model.unreadNotificationCount}</span>
        <div style={{ maxHeight: 580, overflow: "auto" }}>
          {this.props.model.repositories.map(repository => {
            return (
              <div key={repository.name}>
                <a className="repositoryHeading" href={repository.url}>{repository.name}</a>
                {repository.issues.map(issue => {
                  return (
                    <div className="issueHeading" key={issue.id}>
                      <a onClick={onClick(issue.mutePostUrl, issue.mutePostNonce, issue.mutePostToken)} title="Mark as read">✔</a>
                      <a onClick={onClick(issue.deletePostUrl, issue.deletePostNonce, issue.deletePostToken)} title="Unsubscribe">✘</a>
                      <span>{issue.name}</span>
                    </div>);
                })}
              </div>);
          })}
        </div>
      </div>);
  }
  
  fetchPost(url, nonce, token) {
    // TODO: Either queue these calls and interleave them with refetched of the notification page, because only the first one works, or… (See in popup.js).
    fetch(url, { body: `utf8=✓&authenticity_token=${token}`, credentials: "include", headers:
    {
      "Accept": "*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest"
    }, method: "post" })
      .then(function (response) {
        response
          .text()
          .then(function (text) {
            console.debug(text);
          })
          .catch(function (error) {
            console.error("Nah.", error);
          });
      })
      .catch(function (error) {
        console.error("Nope.", error);
      });
  }
}
