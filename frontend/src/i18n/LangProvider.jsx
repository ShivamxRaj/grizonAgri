import React, { useState, createContext, useContext } from 'react'
import pa from './pa.json'
import hi from './hi.json'
import en from './en.json'

const translations = { pa, hi, en }
const LangContext = createContext()

export function useLang() {
  return useContext(LangContext)
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState('pa') // Default Punjabi

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}
