let meta = process.browser && document.getElementById('theThemeColor')
let offlineStyle = process.browser && document.getElementById('theOfflineStyle')
// let prefersDarkTheme = process.browser && window.matchMedia('(prefers-color-scheme: dark)').matches
let prefersDarkTheme = true

export const DEFAULT_LIGHT_THEME = 'default'
export const DEFAULT_DARK_THEME = 'space'
export const DEFAULT_THEME = prefersDarkTheme ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME

function getExistingThemeLink () {
  return document.head.querySelector('link[rel=stylesheet][href^="/theme-"]')
}

function resetExistingTheme () {
  let existingLink = getExistingThemeLink()
  if (existingLink) {
    document.head.removeChild(existingLink)
  }
}

function loadCSS (href) {
  let existingLink = getExistingThemeLink()

  let link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href

  link.addEventListener('load', function onload () {
    link.removeEventListener('load', onload)
    if (existingLink) { // remove after load to avoid flash of default theme
      document.head.removeChild(existingLink)
    }
  })

  // inserting before the offline <style> ensures that the offline style wins when offline
  document.head.insertBefore(link, offlineStyle)
}

export function switchToTheme (themeName = DEFAULT_THEME) {
  let themeColor = window.__themeColors[themeName]
  meta.content = themeColor || window.__themeColors[DEFAULT_THEME]
  if (themeName !== DEFAULT_LIGHT_THEME) {
    loadCSS(`/theme-${themeName}.css`)
  } else {
    resetExistingTheme()
  }
}
