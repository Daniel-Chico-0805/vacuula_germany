import buildFormatter from 'react-timeago/formatters/buildFormatter'
import type { Formatter } from 'react-timeago'
import enStrings from 'react-timeago/language-strings/en'
import svStrings from 'react-timeago/language-strings/sv'
import ptStrings from 'react-timeago/language-strings/pt'
import frStrings from 'react-timeago/language-strings/fr'
import deStrings from 'react-timeago/language-strings/de'
import esStrings from 'react-timeago/language-strings/es'
import itStrings from 'react-timeago/language-strings/it'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LANGUAGE } from './languages'

// Relative-time formatters ("3 minutes ago") for <TimeAgo>, one per app language.
const FORMATTERS: Record<string, Formatter> = {
    en: buildFormatter(enStrings),
    sv: buildFormatter(svStrings),
    pt: buildFormatter(ptStrings),
    fr: buildFormatter(frStrings),
    de: buildFormatter(deStrings),
    es: buildFormatter(esStrings),
    it: buildFormatter(itStrings),
}

export function useTimeAgoFormatter(): Formatter {
    const { i18n } = useTranslation()
    return FORMATTERS[i18n.resolvedLanguage ?? DEFAULT_LANGUAGE] ?? FORMATTERS[DEFAULT_LANGUAGE]
}
