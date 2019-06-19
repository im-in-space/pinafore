// const prefersDarkTheme = process.browser && window.matchMedia('(prefers-color-scheme: dark)').matches
const prefersDarkTheme = true
const meta = process.browser && document.getElementById('theThemeColor')

export const INLINE_THEME = 'default' // theme that does not require external CSS
export const DEFAULT_LIGHT_THEME = 'default' // theme that is shown by default
export const DEFAULT_DARK_THEME = 'space' // theme that is shown for prefers-color-scheme:dark
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

  document.head.appendChild(link)
}

export function switchToTheme (themeName = DEFAULT_THEME, enableGrayscale) {
  if (enableGrayscale) {
    themeName = prefersDarkTheme ? 'grayscale-dark' : 'grayscale'
  }
  let themeColor = window.__themeColors[themeName]
  meta.content = themeColor || window.__themeColors[DEFAULT_THEME]
  if (themeName !== INLINE_THEME) {
    loadCSS(`/theme-${themeName}.css`)
  } else {
    resetExistingTheme()
  }
}
