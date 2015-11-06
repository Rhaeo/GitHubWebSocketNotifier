// WTF. Why is this not a global already?
// Ah, it's not id `dist/`, but it is in `lib/`. Need to fix Gulp to link that.
var ReactDOM = React.__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

document.addEventListener("modelchange", event => {
  var react = ReactDOM.render(React.createElement(Popup, { model: event.detail }), document.getElementById("react"));
});

// Patch the Origin and Referer headers to make GitHub servers think the website did it.
chrome.webRequest.onBeforeSendHeaders.addListener(details => {
  details.requestHeaders.push({ name: "Origin", value: "https://github.com" });
  details.requestHeaders.push({ name: "Referer", value: "https://github.com/notifications" });
  // …Or (see in Popup.jsx) remember last retrieved cookie and manually set it here, because it doesn't seem to update `_ghsess` when calling mark or mute.
  console.debug("det", details);
  return {requestHeaders: details.requestHeaders};
}, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders"]);

chrome.webRequest.onResponseStarted.addListener(details => {
  var cookieOverride = details.responseHeaders.find(responseHeader => responseHeader.name === "Set-Cookie");
  console.debug("cook", cookieOverride);
}), { urls: ["<all_ulrs>"] }, ["responseHeaders"];
