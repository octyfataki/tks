export const THEME_STORAGE_KEY = "tks-theme"
export const DEFAULT_THEME = "system" as const

/**
 * Script inline exécuté avant le premier paint (dans <head> du layout
 * serveur). Il pose la classe `.dark` en synchrone pour éviter le flash :
 * le provider client prend ensuite le relais sans toucher au DOM au mount
 * si la valeur est déjà correcte.
 *
 * Volontairement sans dépendance : il doit rester du JS brut sérialisable.
 */
export function getThemeInitScript(
  storageKey: string = THEME_STORAGE_KEY,
  defaultTheme: string = DEFAULT_THEME
): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var d=${JSON.stringify(defaultTheme)};var t=null;try{t=localStorage.getItem(k)}catch(e){}if(t!=="light"&&t!=="dark"&&t!=="system"){t=d}var s=false;try{s=window.matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}var dark=t==="dark"||(t==="system"&&s);var c=document.documentElement.classList;if(dark){c.add("dark")}else{c.remove("dark")}document.documentElement.style.colorScheme=dark?"dark":"light"}catch(e){}})();`
}
