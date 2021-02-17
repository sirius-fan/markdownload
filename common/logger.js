class Logger {
  static log = () => {
    if (Options.instance.verboseLogging) {
      arguments.unshift('[MarkDownload]')
      console.debug.apply(console, Array.prototype.slice.call(arguments));
    }
  }

  static error = () => {
    arguments.unshift('[MarkDownload Error]')
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }
}