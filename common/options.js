class Options {
  constructor(existingOptions = Options.defaultOptions) {
    this.copyFrom(existingOptions);
    // add notification listener
    browser.runtime.onMessage.addListener(message => {
      if (message.type == 'optionsUpdate') {
        console.log('here');
        this.copyFrom(message.options);
      }
    });
  }

  static defaultOptions = {
    headingStyle: "setext",
    hr: "***",
    bulletListMarker: "*",
    codeBlockStyle: "indented",
    fence: "```",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
    linkReferenceStyle: "full",
    imageStyle: "markdown",
    includeTemplate: false,
    frontmatter: "{baseURI}\n\n> {excerpt}\n\n# {title}",
    backmatter: "",
    title: "{title}",
    saveAs: false,
    downloadImages: false,
    imagePrefix: '{title}/',
    disallowedChars: '[]#^',
    downloadMode: 'downloadsApi',
    turndownEscape: true,
    verboseLogging: true,
    // obsidianVault       : null,
    // obsidianPathType    : 'name',
  }

  get clonable() {
    return {
      headingStyle: this.headingStyle,
      hr: this.hr,
      bulletListMarker: this.bulletListMarker,
      codeBlockStyle: this.codeBlockStyle,
      fence: this.fence,
      emDelimiter: this.emDelimiter,
      strongDelimiter: this.strongDelimiter,
      linkStyle: this.linkStyle,
      linkReferenceStyle: this.linkReferenceStyle,
      imageStyle: this.imageStyle,
      includeTemplate: this.includeTemplate,
      frontmatter: this.frontmatter,
      backmatter: this.backmatter,
      title: this.title,
      saveAs: this.saveAs,
      downloadImages: this.downloadImages,
      imagePrefix: this.imagePrefix,
      disallowedChars: this.disallowedChars,
      downloadMode: this.downloadMode,
      turndownEscape: this.turndownEscape,
      verboseLogging: this.verboseLogging,
      // obsidianVault     : defaultOptions.obsidianVault,
      // obsidianPathType  : defaultOptions.obsidianPathType,
    }
  }

  copyFrom = (otherOptions) => {
    this.headingStyle = otherOptions.headingStyle;
    this.hr = otherOptions.hr;
    this.bulletListMarker = otherOptions.bulletListMarker;
    this.codeBlockStyle = otherOptions.codeBlockStyle;
    this.fence = otherOptions.fence;
    this.emDelimiter = otherOptions.emDelimiter;
    this.strongDelimiter = otherOptions.strongDelimiter;
    this.linkStyle = otherOptions.linkStyle;
    this.linkReferenceStyle = otherOptions.linkReferenceStyle;
    this.imageStyle = otherOptions.imageStyle;
    this.includeTemplate = otherOptions.includeTemplate;
    this.frontmatter = otherOptions.frontmatter;
    this.backmatter = otherOptions.backmatter;
    this.title = otherOptions.title;
    this.saveAs = otherOptions.saveAs;
    this.downloadImages = otherOptions.downloadImages;
    this.imagePrefix = otherOptions.imagePrefix;
    this.disallowedChars = otherOptions.disallowedChars;
    this.downloadMode = otherOptions.downloadMode;
    this.turndownEscape = otherOptions.turndownEscape;
    this.verboseLogging = otherOptions.verboseLogging;
    // this.obsidianVault      = defaultOptions.obsidianVault;
    // this.obsidianPathType   = defaultOptions.obsidianPathType;
  }

  validate = () => {
    // if there is no downloads API, we obviously can't use that
    if (!browser.downloads && this.downloadMode == 'downloadsApi') {
      this.downloadMode = 'contentLink';
    }
    
    // if we're not using the downloads API, we can't download images and stuff
    if (!this.downloadMode == 'downloadsApi') {
      this.downloadImages = false;
    }

    // if we're not downloading images, we can't use certain image style options
    if (!this.downloadImages && (this.imageStyle == 'markdown' || this.imageStyle.startsWith('obsidian'))) {
      this.imageStyle = 'originalSource';
    }
  }

  static instance = new Options();

  static loadOptions = async () => {
    try {
      Options.instance = new Options(await browser.storage.sync.get(Options.defaultOptions));
      console.log('loadedOptions', Options.instance)
    } catch (err) {
      console.error(err);
    }

    Options.instance.validate();
    browser.runtime.sendMessage({ type: "optionsUpdate", options: Options.instance.clonable });
    return Options.instance;
  }

  static save = async () => {
    Options.instance.validate();
    console.log("saving", Options.instance)
    await browser.storage.sync.set(Options.instance.clonable);
    browser.runtime.sendMessage({ type: "optionsUpdate", options: Options.instance.clonable });
  }
}