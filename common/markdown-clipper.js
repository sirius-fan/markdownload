class MarkdownClipper {

  constructor() {
    TurndownService.prototype.defaultEscape = TurndownService.prototype.escape;
  }

  static instance = new MarkdownClipper();

  // function to convert an article info object into markdown
  convertArticleToMarkdown = async (article, downloadImages = null) => {
    // create some local options
    const localOptions = new Options(this.options);

    // of we passed in a value for download images, use that
    if (downloadImages != null) {
      localOptions.downloadImages = downloadImages;
    }

    // substitute front and backmatter templates if necessary
    if (localOptions.includeTemplate) {
      localOptions.frontmatter = this.textReplace(options.frontmatter, article) + '\n';
      localOptions.backmatter = '\n' + this.textReplace(options.backmatter, article);
    }
    else {
      // if not, make them blank
      localOptions.frontmatter = localOptions.backmatter = '';
    }

    // substitutions for image prefix
    localOptions.imagePrefix = this.textReplace(localOptions.imagePrefix, article, localOptions.disallowedChars)
      .split('/').map(s=>this.generateValidFileName(s, localOptions.disallowedChars)).join('/');

    // this does the actual markdown conversion
    let result = this.turndown(article.content, localOptions, article);

    if (localOptions.downloadImages) {
      // pre-download the images (so we can get proper file names)
      result = await this.preDownloadImages(result.imageList, result.markdown);
    }
    return result;
  }

  // function to convert the article content to markdown using Turndown
  turndown = (content, options, article) => {

    if (options.turndownEscape) TurndownService.prototype.escape = TurndownService.prototype.defaultEscape;
    else TurndownService.prototype.escape = s => s;

    var turndownService = new TurndownService(options);

    turndownService.keep(['iframe']);

    let imageList = {};
    // add an image rule
    turndownService.addRule('images', {
      filter: function (node, tdopts) {
        // if we're looking at an img node with a src
        if (node.nodeName == 'IMG' && node.getAttribute('src')) {
        
          // get the original src
          let src = node.getAttribute('src')
          // set the new src
          node.setAttribute('src', validateUri(src, article.baseURI));
        
          // if we're downloading images, there's more to do.
          if (options.downloadImages) {
            // generate a file name for the image
            let imageFilename = this.getImageFilename(src, options, false);
            if (!imageList[src] || imageList[src] != imageFilename) {
              // if the imageList already contains this file, add a number to differentiate
              let i = 1;
              while (Object.values(imageList).includes(imageFilename)) {
                const parts = imageFilename.split('.');
                if (i == 1) parts.splice(parts.length - 1, 0, i++);
                else parts.splice(parts.length - 2, 1, i++);
                imageFilename = parts.join('.');
              }
              // add it to the list of images to download later
              imageList[src] = imageFilename;
            }
            // check if we're doing an obsidian style link
            const obsidianLink = options.imageStyle.startsWith("obsidian");
            // figure out the (local) src of the image
            const localSrc = options.imageStyle === 'obsidian-nofolder'
              // if using "nofolder" then we just need the filename, no folder
              ? imageFilename.substring(imageFilename.lastIndexOf('/') + 1)
              // otherwise we may need to modify the filename to uri encode parts for a pure markdown link
              : imageFilename.split('/').map(s => obsidianLink ? s : encodeURI(s)).join('/')
          
            // set the new src attribute to be the local filename
            if (options.imageStyle != 'originalSource') node.setAttribute('src', localSrc);
            // pass the filter if we're making an obsidian link (or stripping links)
            return obsidianLink || options.imageStyle == 'noImage';
          }
          else return options.imageStyle == 'noImage'
        }
        // don't pass the filter, just output a normal markdown link
        return false;
      },
      replacement: function (content, node, tdopts) {
        // if we're stripping images, output nothing
        if (options.imageStyle == 'noImage') return '';
        // otherwise, this must be an obsidian link, so output that
        else return `![[${node.getAttribute('src')}]]`;
      }

    });

    // add a rule for links
    turndownService.addRule('links', {
      filter: (node, tdopts) => {
        // check that this is indeed a link
        if (node.nodeName == 'A' && node.getAttribute('href')) {
          // get the href
          const href = node.getAttribute('href');
          // set the new href
          node.setAttribute('href', validateUri(href, article.baseURI));
          // if we are to strip links, the filter needs to pass
          return options.linkStyle == 'stripLinks';
        }
        // we're not passing the filter, just do the normal thing.
        return false;
      },
      // if the filter passes, we're stripping links, so just return the content
      replacement: (content, node, tdopts) => content
    });

    let markdown = options.frontmatter + turndownService.turndown(content)
      + options.backmatter;

    // strip out non-printing special characters which CodeMirror displays as a red dot
    // see: https://codemirror.net/doc/manual.html#option_specialChars
    markdown = markdown.replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, '');
  
    return { markdown: markdown, imageList: imageList };
  }

  // get a valid filename for an image
  getImageFilename = (src, options, prependFilePath = true) => {
    const slashPos = src.lastIndexOf('/');
    const queryPos = src.indexOf('?');
    let filename = src.substring(slashPos + 1, queryPos > 0 ? queryPos : src.length);

    let imagePrefix = (options.imagePrefix || '');

    if (prependFilePath && options.title.includes('/')) {
      imagePrefix = options.title.substring(0, options.title.lastIndexOf('/') + 1) + imagePrefix;
    }
    else if (prependFilePath) {
      imagePrefix = options.title + (imagePrefix.startsWith('/') ? '' : '/') + imagePrefix
    }
  
    if (filename.includes(';base64,')) {
      // this is a base64 encoded image, so what are we going to do for a filename here?
      filename = 'image.' + filename.substring(0, filename.indexOf(';'));
    }
  
    let extension = filename.substring(filename.lastIndexOf('.'));
    if (extension == filename) {
      // there is no extension, so we need to figure one out
      // for now, give it an 'idunno' extension and we'll process it later
      filename = filename + '.idunno';
    }

    filename = this.generateValidFileName(filename, options.disallowedChars);
  
    return imagePrefix + filename;
  }

  // function to apply the title template
  formatTitle = async (article) => {
    let title = this.textReplace(this.options.title, article, this.options.disallowedChars);
    title = title.split('/').map(s => this.generateValidFileName(s, this.options.disallowedChars)).join('/');
    return title;
  }

  // function to replace placeholder strings with article info
  textReplace = (string, article, disallowedChars = null) => {
    for (const key in article) {
      if (article.hasOwnProperty(key) && key != "content") {
        let s = (article[key] || '') + '';
        if (s && disallowedChars) s = s.split('/').map(x => this.generateValidFileName(x, disallowedChars)).join('/');
        string = string.split('{' + key + '}').join(s);
      }
    }

    // replace date formats
    const now = new Date();
    const dateRegex = /{date:(.+?)}/g
    const matches = string.match(dateRegex);
    if (matches && matches.forEach) {
      matches.forEach(match => {
        const format = match.substring(6, match.length - 1);
        const dateString = moment(now).format(format);
        string = string.replace(new RegExp(match, 'g'), dateString);
      });
    }

    // replace keywords
    const keywordRegex = /{keywords:?(.*)?}/g
    const keywordMatches = string.match(keywordRegex);
    if (keywordMatches && keywordMatches.forEach) {
      keywordMatches.forEach(match => {
        let seperator = match.substring(10, match.length - 1)
        try {
          seperator = JSON.parse(JSON.stringify(seperator).replace(/\\\\/g, '\\'));
        }
        catch { }
        const keywordsString = (article.keywords || []).join(seperator);
        string = string.replace(new RegExp(match.replace(/\\/g, '\\\\'), 'g'), keywordsString);
      })
    }

    return string;
  }
  
  // function to turn the title into a valid file name
  generateValidFileName = (title, disallowedChars = null) => {
    if (!title) return title;
    else title = title + '';
    // remove < > : " / \ | ? * 
    var illegalRe = /[\/\?<>\\:\*\|":]/g;
    // and non-breaking spaces (thanks @Licat)
    var name = title.replace(illegalRe, "").replace(new RegExp('\u00A0', 'g'), ' ');
    
    if (disallowedChars) {
      for (let c of disallowedChars) {
        if (`[\\^$.|?*+()`.includes(c)) c = `\\${c}`;
        name = name.replace(new RegExp(c, 'g'), '');
      }
    }
    
    return name;
  }
  // get Readability article info from the dom passed in
  getArticleFromDom = async (domString) => {
    // parse the dom
    const parser = new DOMParser();
    const dom = parser.parseFromString(domString, "text/html");
    if (dom.documentElement.nodeName == "parsererror") {
      Logger.error("error while parsing");
    }

    // simplify the dom into an article
    const article = new Readability(dom).parse();
    // get the base uri from the dom and attach it as important article info
    article.baseURI = dom.baseURI;
    // also grab the page title
    article.pageTitle = dom.title;

    // and the keywords, should they exist, as an array
    article.keywords = dom.head.querySelector('meta[name="keywords"]')?.content?.split(',')?.map(s => s.trim());

    // add all meta tags, so users can do whatever they want
    dom.head.querySelectorAll('meta[name][content]')?.forEach(meta => {
      if (meta.name && meta.content && !article[meta.name]) {
        article[meta.name] = meta.content;
      }
    })

    // return the article
    return article;
  }

  // get Readability article info from the content of the tab id passed in
  // `selection` is a bool indicating whether we should just get the selected text
  getArticleFromContent = async (tabId, selection = false) => {
    // run the content script function to get the details
    const results = await browser.tabs.executeScript(tabId, { code: "getSelectionAndDom()" });

    // make sure we actually got a valid result
    if (results && results[0] && results[0].dom) {
      const article = await this.getArticleFromDom(results[0].dom, selection);

      // if we're to grab the selection, and we've selected something,
      // replace the article content with the selection
      if (selection && results[0].selection) {
        article.content = results[0].selection;
      }

      //return the article
      return article;
    }
    else return null;
  }

  // function to copy markdown to the clipboard, triggered by context menu
  copyMarkdownFromContext = async(info, tab) => {
    try {
      // make sure we have content scripts loaded
      await ensureScripts(tab.id);
      
      // if we're copying a markdown link
      if (info.menuItemId == "copy-markdown-link") {
        // set up local options to ensure there's no front/back template nonsense
        const localOptions = new Options(this.options);
        localOptions.frontmatter = localOptions.backmatter = '';
        localOptions.includeTemplate = false;
        localOptions.downloadImages = false;

        // get the article information
        const article = await this.getArticleFromContent(tab.id, false);

        // get the markdown translation of the link
        const { markdown } = this.turndown(`<a href="${info.linkUrl}">${info.linkText}</a>`, localOptions, article);

        // copy the result to the clipboard (using content script)
        await browser.tabs.executeScript(tab.id, {code: `copyToClipboard(${JSON.stringify(markdown)})`});
      }
      // if we're copying an image
      else if (info.menuItemId == "copy-markdown-image") {
        // copy a standard markdown image embed to the clipboard (using content script)
        await browser.tabs.executeScript(tab.id, {code: `copyToClipboard("![](${info.srcUrl})")`});
      }
      // otherwise we're copying the entire tab/selection as markdown
      else {
        // get the article information
        const article = await this.getArticleFromContent(tab.id, info.menuItemId == "copy-markdown-selection");

        // convert the article to markdown
        const { markdown } = await this.convertArticleToMarkdown(article, downloadImages = false);

        // copy the result to the clipboard (using content script)
        await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });
      }
    }
    catch (error) {
      // This could happen if the extension is not allowed to run code in
      // the page, for example if the tab is a privileged page.
      Logger.error("Failed to copy text: " + error);
    };
  }

  // download all the open tabs
  downloadMarkdownForAllTabs = async (info) => {
    // get all the tabs in the current window
    const tabs = await browser.tabs.query({ currentWindow: true });
    // loop through the tabs and download them
    tabs.forEach(tab => {
      this.downloadMarkdownFromContext(info, tab);
    });
  }

  // function to download markdown, triggered by context menu
  downloadMarkdownFromContext = async (info, tab) => {
    // make sure the content scripts are loaded in this tab
    await ensureScripts(tab.id);
    // get the article information
    const article = await this.getArticleFromContent(tab.id, info.menuItemId == "download-markdown-selection");
    // get the title
    const title = await this.formatTitle(article);
    // convert the article to markdown
    const { markdown, imageList } = await this.convertArticleToMarkdown(article);
    // download the markdown
    await this.downloadMarkdown(markdown, title, tab.id, imageList); 

  }

  // function to copy a tab url as a markdown link
  copyTabAsMarkdownLink = async (tab) => {
    try {
      // make sure the content scripts are loaded in this tab
      await ensureScripts(tab.id);
      // get the article information
      const article = await this.getArticleFromContent(tab.id);
      // get the title
      const title = await this.formatTitle(article);
      // copy the link format to the clipboard (using content script)
      await browser.tabs.executeScript(tab.id, { code: `copyToClipboard("[${title}](${article.baseURI})")` });
    }
    catch (error) {
      // This could happen if the extension is not allowed to run code in
      // the page, for example if the tab is a privileged page.
      Logger.error("Failed to copy as markdown link: " + error);
    };
  }
}

const markdownClipper = MarkdownClipper.instance;