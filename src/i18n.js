import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import et from './locales/et.json'

function detectInitialLocale() {
	const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null
	if (saved) return saved
	const nav = typeof navigator !== 'undefined' ? navigator.language || (navigator.languages && navigator.languages[0]) : 'et'
	return nav && nav.toLowerCase().startsWith('et') ? 'et' : 'en'
}

export const i18n = createI18n({
	legacy: false,
	locale: detectInitialLocale(),
	fallbackLocale: 'en',
	messages: { en, et }
})

export function setLocale(nextLocale) {
	if (!nextLocale) return
	i18n.global.locale.value = nextLocale
	try { localStorage.setItem('locale', nextLocale) } catch {}
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('lang', nextLocale)
	}
}

// Initialize <html lang="...">
if (typeof document !== 'undefined') {
	document.documentElement.setAttribute('lang', i18n.global.locale.value)
}

export default i18n
