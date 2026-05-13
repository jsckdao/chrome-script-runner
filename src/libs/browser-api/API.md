
# 浏览器 API 文档

## api 功能开发列表
- [x] `browser.wait(seconds)`, 等待 指定的秒数。
- [x] `browser.getCurrentTab()`, 获取当前用户正在浏览的标签页的信息，包括标题、URL、ID 等。
- [x] `browser.changeCurrentTab(tabId)`, 使当前window 中的标签页切换到指定的标签页
- [x] `browser.getAllTabs()`, 获取当前 sidepanel 所在的 window 下的所有标签页信息
- [x] `browser.navigateTabUrl(tabId, url)`,  使指定标签页跳转到指定 URL。
- [x] `browser.querySelector(tabId, selector)`, 在指定标签页中查询元素信息。
- [x] `browser.querySelectorAll(tabId, selector)`,  在指定标签页中查询所有匹配的元素信息。
- [x] `browser.click(tabId, elementSelector)`, 在指定标签页中点击元素。
- [x] `browser.input(tabId, selector, value)`, 在指定标签页中向指定的 input 元素中输入值。
- [x] `browser.httpGet(url)`, 发送 HTTP GET 请求并返回结果文本.
- [x] `browser.httpPost(url, bodyText)`, 发送 HTTP POST 请求并返回结果文本.
- [x] `browser.stringifyJSON(data)`, 将各种数据格式化为 JSON 字符串。
- [x] `browser.parseJSON(text)`, 将 JSON 字符串转换为 Lua 相应类型.
