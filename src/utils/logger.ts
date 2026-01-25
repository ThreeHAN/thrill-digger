/**
 * Centralized logging utility with emoji prefixes
 * Makes it easy to enable/disable debug logs globally
 */

const isDev = import.meta.env.DEV

export const logger = {
  worker: (message: string) => isDev && console.log(`🧵 [Worker] ${message}`),
  workerComplete: (message: string) => isDev && console.log(`✅ ${message}`),
  compute: (message: string) => isDev && console.log(`🚀 ${message}`),
  cancel: (message: string) => isDev && console.log(`🛑 ${message}`),
  revert: (message: string) => isDev && console.log(`🔄 ${message}`),
  warn: (message: string) => isDev && console.log(`⚠️ ${message}`),
  info: (message: string) => isDev && console.log(`ℹ️ ${message}`),
  debug: (message: string) => isDev && console.log(message),
}
