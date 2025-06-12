// src/utils/debug.js

const isBrowser =
  typeof window !== "undefined" && typeof import.meta !== "undefined";

let isDebug = false;
let logLevel = "info";

if (isBrowser) {
  // Vite frontend env
  isDebug = import.meta.env?.VITE_DEBUG === "true";
  logLevel = import.meta.env?.VITE_LOG_LEVEL || "info";
} else {
  // Node env
  isDebug = process.env.DEBUG === "true";
  logLevel = process.env.LOG_LEVEL || "info";
}

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[logLevel] ?? levels.info;

export const debug = {
  log: (message, ...args) => {
    if (isDebug && currentLevel <= levels.debug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (isDebug && currentLevel <= levels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (isDebug && currentLevel <= levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    if (isDebug && currentLevel <= levels.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};
