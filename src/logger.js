// https://sap.github.io/cf-nodejs-logging-support/
"use strict";
const util = require("util");
const VError = require("verror");
const globalLogger = require("cf-nodejs-logging-support");

const CUSTOM_FIELD_LAYER = "layer";
const CUSTOM_FIELD_ERROR_INFO = "errInfo";

globalLogger.registerCustomFields([CUSTOM_FIELD_LAYER, CUSTOM_FIELD_ERROR_INFO]);

// Readable logger for running locally
class ReadableLogger {
  constructor() {
    this.__fields = {};
  }

  setCustomFields(fields) {
    this.__fields = fields;
  }

  logMessage(level, ...args) {
    // eslint-disable-next-line no-console
    const logger = level === "error" ? console.error : level === "warning" ? console.warn : console.info;
    const { [CUSTOM_FIELD_LAYER]: layer, [CUSTOM_FIELD_ERROR_INFO]: errInfo } = this.__fields;

    const formattedMessage = util.format(...args.map((arg) => (arg instanceof VError ? VError.fullStack(arg) : arg)));
    const now = new Date();
    const timestamp = util.format(
      "%s:%s:%s.%s",
      ("0" + now.getHours()).slice(-2),
      ("0" + now.getMinutes()).slice(-2),
      ("0" + now.getSeconds()).slice(-2),
      ("00" + now.getMilliseconds()).slice(-3)
    );
    const logLineParts = Object.values({
      timestamp,
      level,
      ...(layer && { layer }),
      formattedMessage,
    });
    const logParts = Object.values({
      logLineParts: logLineParts.join(" | "),
      ...(errInfo && { errInfo: util.format("error info: %O", errInfo) }),
    });
    logger(logParts.join("\n"));
  }
}

// General logger wrapper
class Logger {
  constructor(layer, doJSONOutput = true) {
    this.__layer = layer;
    this.__doJSONOutput = doJSONOutput;
    if (this.__doJSONOutput) {
      this.__logger = globalLogger.createLogger();
    } else {
      this.__logger = new ReadableLogger();
    }
    this._resetCustomFields();
  }

  _resetCustomFields() {
    this.__logger.setCustomFields({ [CUSTOM_FIELD_LAYER]: this.__layer });
  }

  _log(level, ...args) {
    if (args.length === 1 && args[0] instanceof VError) {
      const err = args[0];
      const errInfo = VError.info(err);
      this.__logger.setCustomFields({
        [CUSTOM_FIELD_LAYER]: this.__layer,
        [CUSTOM_FIELD_ERROR_INFO]: errInfo,
      });
      this.__logger.logMessage(level, err);
      this._resetCustomFields();
    } else {
      this.__logger.logMessage(level, ...args);
    }
  }
  info(...args) {
    return this._log("info", ...args);
  }
  warning(...args) {
    return this._log("warning", ...args);
  }
  error(...args) {
    return this._log("error", ...args);
  }
}

module.exports = Logger;
