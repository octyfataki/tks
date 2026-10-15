export const THEME_STORAGE_KEY = "tks-theme"
export const DEFAULT_THEME = "system" as const

export function getThemeInitScript(
  storageKey: string = THEME_STORAGE_KEY,
  defaultTheme: string = DEFAULT_THEME
): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var d=${JSON.stringify(defaultTheme)};var t=null;try{t=localStorage.getItem(k)}catch(e){}if(t!=="light"&&t!=="dark"&&t!=="system"){t=d}var s=false;try{s=window.matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}var dark=t==="dark"||(t==="system"&&s);var c=document.documentElement.classList;if(dark){c.add("dark")}else{c.remove("dark")}document.documentElement.style.colorScheme=dark?"dark":"light"}catch(e){}})();`
}
