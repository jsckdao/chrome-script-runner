
# Browser API Documentation

## API Development List
- [x] `browser.wait(seconds)`, Wait for the specified number of seconds.
- [x] `browser.getCurrentTab()`, Get information about the tab the user is currently browsing, including title, URL, ID, etc.
- [x] `browser.changeCurrentTab(tabId)`, Switch to the specified tab in the current window.
- [x] `browser.openTab(url)`, Open a new tab and navigate to the specified page, returns tab information.
- [x] `browser.closeTab(tabId)`, Close a tab.
- [x] `browser.getAllTabs()`, Get all tab information in the current window where the sidepanel is located.
- [x] `browser.navigateTabUrl(tabId, url)`, Navigate the specified tab to the given URL.
- [x] `browser.querySelector(tabId, selector)`, Query element information in the specified tab.
- [x] `browser.querySelectorAll(tabId, selector)`, Query all matching element information in the specified tab.
- [x] `browser.click(tabId, elementSelector)`, Click an element in the specified tab.
- [x] `browser.input(tabId, selector, value)`, Input value into a specified input element in the given tab.
- [x] `browser.httpGet(url)`, Send HTTP GET request and return result text.
- [x] `browser.httpPost(url, bodyText)`, Send HTTP POST request and return result text.
- [x] `browser.stringifyJSON(data)`, Format various data into JSON string.
- [x] `browser.parseJSON(text)`, Convert JSON string to corresponding Lua type.
