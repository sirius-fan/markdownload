// create context menus
createMenus();

// create the context menus
async function createMenus() {
  const options = Options.instance;

  browser.contextMenus.removeAll();

  // tab menu (chrome does not support this)
  try {
    browser.contextMenus.create({
      id: "download-markdown-tab",
      title: "Download Tab as Markdown",
      contexts: ["tab"]
    }, () => {});

    browser.contextMenus.create({
      id: "tab-download-markdown-alltabs",
      title: "Download All Tabs as Markdown",
      contexts: ["tab"]
    }, () => {});

    browser.contextMenus.create({
      id: "copy-tab-as-markdown-link-tab",
      title: "Copy Tab URL as Markdown Link",
      contexts: ["tab"]
    }, () => {});

    browser.contextMenus.create({
      id: "tab-separator-1",
      type: "separator",
      contexts: ["tab"]
    }, () => { });

    browser.contextMenus.create({
      id: "tabtoggle-includeTemplate",
      type: "checkbox",
      title: "Include front/back template",
      contexts: ["tab"],
      checked: options.includeTemplate
    }, () => { });
  } catch {

  }
  // add the download all tabs option to the page context menu as well
  browser.contextMenus.create({
    id: "download-markdown-alltabs",
    title: "Download All Tabs as Markdown",
    contexts: ["all"]
  }, () => { });
  browser.contextMenus.create({
    id: "separator-0",
    type: "separator",
    contexts: ["all"]
  }, () => {});

  // download actions
  browser.contextMenus.create({
    id: "download-markdown-selection",
    title: "Download Selection As Markdown",
    contexts: ["selection"]
  }, () => {});
  browser.contextMenus.create({
    id: "download-markdown-all",
    title: "Download Tab As Markdown",
    contexts: ["all"]
  }, () => {});

  browser.contextMenus.create({
    id: "separator-1",
    type: "separator",
    contexts: ["all"]
  }, () => {});

  // copy to clipboard actions
  browser.contextMenus.create({
    id: "copy-markdown-selection",
    title: "Copy Selection As Markdown",
    contexts: ["selection"]
  }, () => { });
  browser.contextMenus.create({
    id: "copy-markdown-link",
    title: "Copy Link As Markdown",
    contexts: ["link"]
  }, () => { });
  browser.contextMenus.create({
    id: "copy-markdown-image",
    title: "Copy Image As Markdown",
    contexts: ["image"]
  }, () => {});
  browser.contextMenus.create({
    id: "copy-markdown-all",
    title: "Copy Tab As Markdown",
    contexts: ["all"]
  }, () => { });
  browser.contextMenus.create({
    id: "copy-tab-as-markdown-link",
    title: "Copy Tab URL as Markdown Link",
    contexts: ["all"]
  }, () => {});
  
  browser.contextMenus.create({
    id: "separator-2",
    type: "separator",
    contexts: ["all"]
  }, () => { });
  
  // options
  browser.contextMenus.create({
    id: "toggle-includeTemplate",
    type: "checkbox",
    title: "Include front/back template",
    contexts: ["all"],
    checked: options.includeTemplate
  }, () => { });
}

// click handler for the context menus
browser.contextMenus.onClicked.addListener(function (info, tab) {
  // one of the copy to clipboard commands
  if (info.menuItemId.startsWith("copy-markdown")) {
    markdownClipper.copyMarkdownFromContext(info, tab);
  }
  else if (info.menuItemId == "download-markdown-alltabs" || info.menuItemId == "tab-download-markdown-alltabs") {
    markdownClipper.downloadMarkdownForAllTabs(info);
  }
  // one of the download commands
  else if (info.menuItemId.startsWith("download-markdown")) {
    markdownClipper.downloadMarkdownFromContext(info, tab);
  }
  // copy tab as markdown link
  else if (info.menuItemId.startsWith("copy-tab-as-markdown-link")) {
    markdownClipper.copyTabAsMarkdownLink(tab);
  }
  // a settings toggle command
  else if (info.menuItemId.startsWith("toggle-") || info.menuItemId.startsWith("tabtoggle-")) {
    toggleSetting(info.menuItemId.split('-')[1]);
  }
});

// this function toggles the specified option
async function toggleSetting(setting, options = null) {
  // if there's no options object passed in, we need to go get one
  if (options == null) {
    // get the options from storage and toggle the setting
    await toggleSetting(setting, await Options.loadOptions());
  }
  else {
    // toggle the option and save back to storage
    options[setting] = !options[setting];
    Options.save();
  }
}

// add notification listener
browser.runtime.onMessage.addListener(message => {
  // if options were updated, change the relevant context menu toggles
  if (message.type == 'optionsUpdate') {
    browser.contextMenus.update("toggle-includeTemplate", {
      checked: options.includeTemplate
    });
    try {
      browser.contextMenus.update("tabtoggle-includeTemplate", {
        checked: options.includeTemplate
      });
    } catch { }
  }
});
