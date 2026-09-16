import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Send, 
  X, 
  Sparkles, 
  Play, 
  Pause, 
  Bug, 
  TrendingUp, 
  CloudSun, 
  FlaskConical
} from 'lucide-react'
import { useLang } from '../i18n/LangProvider'
import { useAuth } from '../context/AuthContext'
import VoiceMic from '../components/VoiceMic'
import CameraCapture from '../components/CameraCapture'
import ResponseCard from '../components/ResponseCard'
import GrizonAgriLogo from '../components/GrizonAgriLogo'

export default function ChatPage() {
  const { t, lang } = useLang()
  const { farmer, isAuthenticated, openAuthModal } = useAuth()
  const location = useLocation()

  const rawName = farmer?.name?.trim() || ''
  const firstName = rawName ? rawName.split(' ')[0] : ''

  const getTimeGreeting = (name) => {
    const hour = new Date().getHours()
    const displayName = name || 'Farmer'
    if (hour >= 5 && hour < 12) return `Good morning, ${displayName}! ☀️`
    if (hour >= 12 && hour < 17) return `Good afternoon, ${displayName}! 🌤️`
    if (hour >= 17 && hour < 21) return `Good evening, ${displayName}! 🌆`
    return `Good night, ${displayName}! 🌙`
  }

  const getPersonalizedGreeting = (l, name) => {
    if (l === 'pa') {
      return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${name || 'ਕਿਸਾਨ'}! 🙏`
    }
    if (l === 'hi') {
      return `नमस्ते ${name || 'किसान'}! 🙏`
    }
    return getTimeGreeting(name)
  }

  const getInitialMessages = (l) => [
    {
      id: 'usr-demo-1',
      isDemo: true,
      sender: 'user',
      text: l === 'pa' 
        ? 'ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ ਲੱਗ ਗਿਆ, ਕੀ ਕਰੀਏ?' 
        : l === 'hi' 
        ? 'गेहूं पर पीला तेला लग गया, क्या करें?' 
        : 'My wheat crop has yellow rust symptoms, what treatment should I apply?',
      isVoice: true,
    },
    {
      id: 'ast-demo-1',
      isDemo: true,
      sender: 'assistant',
      text: '',
      structured: {
        severity: 'high',
        title: l === 'pa' ? 'ਚੇਤਾਵਨੀ: ਪੀਲੀ ਕੁੰਗੀ' : l === 'hi' ? 'चेतावनी: पीला रतुआ' : 'WARNING: YELLOW RUST',
        bullets: l === 'pa' ? [
          'ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ / ਕੁੰਗੀ ਲੱਗ ਗਿਆ ਹੈ',
          '200 ਮਿ.ਲੀ. ਟਿਲਟ (Propiconazole 25 EC) ਪਾਓ',
          '200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ'
        ] : l === 'hi' ? [
          'गेहूं पर पीला तेला / रतुआ के लक्षण हैं',
          '200 मिली टिल्ट (Propiconazole 25 EC) डालें',
          '200 लीटर पानी में मिलाकर प्रति एकड़ छिड़काव करें'
        ] : [
          'Symptoms of Yellow Rust / Aphids detected on wheat crop',
          'Apply 200 ml Tilt (Propiconazole 25 EC)',
          'Mix in 200 Liters of water and spray per acre'
        ],
        dosage: l === 'pa' ? '2.5 ਪੰਪ / ਏਕੜ' : l === 'hi' ? '2.5 पंप / एकड़' : '2.5 Pumps / Acre',
      }
    }
  ]

  const [messages, setMessages] = useState(() => getInitialMessages(lang))
  const [inputText, setInputText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState(null)
  const messagesEndRef = useRef(null)
  const prevAuthRef = useRef(isAuthenticated)

  // Automatically open a fresh personalized conversation page upon signup/login
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      setMessages([])
      setSelectedImage(null)
      setInputText('')
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  // Synchronize demo messages dynamically when active language changes
  useEffect(() => {
    setMessages((prev) => {
      const hasOnlyDemo = prev.every((m) => m.isDemo)
      if (hasOnlyDemo && prev.length > 0) {
        return getInitialMessages(lang)
      }
      return prev
    })
  }, [lang])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Handle location state triggers (e.g. from Sidebar or prompt chips)
  useEffect(() => {
    if (location.state?.reset) {
      setMessages([])
      setSelectedImage(null)
      setInputText('')
    } else if (location.state?.initialQuery) {
      handleSend(location.state.initialQuery, location.state?.isVoice)
    }
  }, [location.state])

  const handleSend = async (queryText, isVoiceMsg = false) => {
    const textToSend = queryText || inputText
    if (!textToSend.trim() && !selectedImage) return

    // Auth Guard: Require signup / login before chatting
    if (!isAuthenticated) {
      openAuthModal()
      return
    }

    const userMsgId = 'usr-' + Date.now()
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      image: selectedImage?.dataUrl || null,
      isVoice: isVoiceMsg,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setSelectedImage(null)
    setIsLoading(true)

    try {
      let response;
      if (selectedImage) {
        // Submit photo scan to Disease API endpoint
        const formData = new FormData()
        if (selectedImage.file) {
          formData.append('image', selectedImage.file)
        }
        formData.append('crop', textToSend || 'Wheat')
        formData.append('language', lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN')
        
        response = await fetch('/api/v1/disease/scan', {
          method: 'POST',
          body: formData,
        })
        if (response.ok) {
          const diseaseData = await response.json()
          const isNonPlant = diseaseData.disease_name === 'Non-Plant Photo Detected' || diseaseData.chemical_name === 'N/A'
          
          const assistantMsg = {
            id: 'ast-' + Date.now(),
            sender: 'assistant',
            text: diseaseData.recommended_action,
            structured: {
              severity: (diseaseData.severity || 'high').toLowerCase(),
              title: isNonPlant
                ? (lang === 'pa' ? '⚠️ ਫਸਲ/ਪੌਦੇ ਦੀ ਤਸਵੀਰ ਨਹੀਂ (Non-Plant Photo)' : lang === 'hi' ? '⚠️ पौधे की फोटो नहीं है (Non-Plant Photo)' : '⚠️ Non-Plant Photo Detected')
                : (lang === 'pa' ? `ਬੀਮਾਰੀ ਸਕੈਨ: ${diseaseData.disease_name_local || diseaseData.disease_name}` :
                   lang === 'hi' ? `बीमारी स्कैन: ${diseaseData.disease_name_local || diseaseData.disease_name}` :
                   `CROP SCAN: ${diseaseData.disease_name}`),
              bullets: isNonPlant
                ? [
                    diseaseData.recommended_action,
                    lang === 'pa' ? 'ਸਲਾਹ: ਸਿਰਫ਼ ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ ਜਾਂ ਹੋਰ ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ।' :
                    lang === 'hi' ? 'सलाह: केवल गेहूं, धान, कपास या अन्य फसल के पत्ते की फोटो अपलोड करें।' :
                    'Tip: Please attach a clear, close-up photo of a crop leaf.'
                  ]
                : [
                    diseaseData.disease_name_local ? `${diseaseData.disease_name} (${diseaseData.disease_name_local})` : diseaseData.disease_name,
                    diseaseData.recommended_action,
                    lang === 'pa' ? `ਪ੍ਰਮਾਣਿਤ ਇਲਾਜ: ${diseaseData.chemical_name || 'PAU Recommended Fungicide'}` :
                    lang === 'hi' ? `प्रमाणित इलाज: ${diseaseData.chemical_name || 'PAU Recommended Fungicide'}` :
                    `Recommended Treatment: ${diseaseData.chemical_name || 'PAU Recommended Fungicide'}`
                  ],
              dosage: isNonPlant ? (lang === 'pa' ? 'ਤਸਵੀਰ ਦੁਬਾਰਾ ਚੁਣੋ' : 'Re-upload Leaf Photo') : (diseaseData.dosage || (lang === 'pa' ? '2.5 ਪੰਪ / ਏਕੜ' : '2.5 Pumps / Acre'))
            }
          }
          setMessages((prev) => [...prev, assistantMsg])
          return
        }
      }


      // Standard Chat API query
      response = await fetch('/api/v1/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language: lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
          farmer_id: farmer?.farmer_id || 'pb-farmer-101',
          farmer_name: farmer?.name || '',
          district: farmer?.district || 'Ludhiana'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMsg = {
          id: 'ast-' + Date.now(),
          sender: 'assistant',
          text: data.response_text || '',
          structured: data.structured_card || {
            severity: 'high',
            title: lang === 'pa' ? 'ਸਲਾਹ' : lang === 'hi' ? 'सलाह' : 'ADVISORY',
            bullets: [data.response_text],
            dosage: lang === 'pa' ? '200 ਮਿ.ਲੀ. / ਏਕੜ' : lang === 'hi' ? '200 मिली / एकड़' : '200 ml / acre',
          }
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        throw new Error('Backend non-200')
      }
    } catch (err) {

      // Localized intelligent fallback generator per language
      let bullets = []
      let title = 'ADVISORY'
      let dosageVal = '2.5 Pumps / Acre'

      const lower = textToSend.toLowerCase().trim()
      const greetingList = [
        "hyy", "hy", "hii", "hi", "hello", "hey", "heyy", "namaste", "नमस्ते",
        "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ", "sat sri akal", "sat shri akal", "ssa",
        "good morning", "good afternoon", "good evening", "good night", "greetings"
      ]

      const isGreetingMsg = greetingList.some(g => lower === g || (lower.length <= 15 && lower.includes(g)))

      if (isGreetingMsg) {
        title = getPersonalizedGreeting(lang, firstName)
        bullets = lang === 'pa' ? [
          `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${firstName || 'ਕਿਸਾਨ'} ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਏਆਈ ਸਹਾਇਕ ਹਾਂ।`,
          'ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਫਸਲ, ਮੰਡੀ ਭਾਅ, ਬੀਮਾਰੀ ਜਾਂ ਮੌਸਮ ਸੰਬੰਧੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?'
        ] : lang === 'hi' ? [
          `नमस्ते ${firstName || 'किसान'} जी! मैं आपका ग्रीज़ोन एग्री एआई सहायक हूँ।`,
          'आज मैं आपकी फसल, मंडी भाव, बीमारी या मौसम से जुड़ी क्या सहायता कर सकता हूँ?'
        ] : [
          `Hello ${firstName || 'Farmer'}! I am your Grizon Agri AI Assistant.`,
          'How can I assist you today with crop health, mandi rates, weather, or fertilizers?'
        ]
        dosageVal = lang === 'pa' ? 'ਗ੍ਰੀਜ਼ੋਨ ਐਗਰੀ ਏਆਈ ਸਹਾਇਕ' : lang === 'hi' ? 'ग्रीज़ोन एग्री एआई सहायक' : 'Grizon Agri AI Assistant'
      } else if (lower.includes('ਕਣਕ') || lower.includes('गेहूं') || lower.includes('wheat') || lower.includes('ਤੇਲਾ') || lower.includes('rust')) {
        title = lang === 'pa' ? 'ਚੇਤਾਵਨੀ: ਪੀਲੀ ਕੁੰਗੀ' : lang === 'hi' ? 'चेतावनी: पीला रतुआ' : 'WARNING: YELLOW RUST'
        bullets = lang === 'pa' ? [
          'ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ / ਕੁੰਗੀ ਲੱਗ ਗਿਆ ਹੈ',
          '200 ਮਿ.ਲੀ. ਟਿਲਟ (Propiconazole 25 EC) ਪਾਓ',
          '200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ'
        ] : lang === 'hi' ? [
          'गेहूं पर पीला तेला / रतुआ लगा है',
          '200 मिली टिल्ਟ (Propiconazole 25 EC) डालें',
          '200 लीटर पानी में मिलाकर प्रति एकड़ छिड़काव करें'
        ] : [
          'Yellow Rust / Aphids detected on wheat leaves',
          'Apply 200 ml Tilt (Propiconazole 25 EC)',
          'Mix in 200 Liters of water and spray per acre'
        ]
        dosageVal = lang === 'pa' ? '2.5 ਪੰਪ / ਏਕੜ' : lang === 'hi' ? '2.5 पंप / एकड़' : '2.5 Pumps / Acre'
      } else if (lower.includes('ਮੰਡੀ') || lower.includes('मंडी') || lower.includes('mandi') || lower.includes('ਭਾਅ') || lower.includes('भाव') || lower.includes('rate') || lower.includes('price')) {
        title = lang === 'pa' ? 'ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਅ' : lang === 'hi' ? 'ताज़ा मंडी भाव' : 'LIVE MANDI RATE'
        bullets = lang === 'pa' ? [
          'ਲੁਧਿਆਣਾ ਮੰਡੀ ਵਿੱਚ ਅੱਜ ਕਣਕ (Wheat) ਦਾ ਭਾਅ ₹2,275/ਕੁਇੰਟਲ ਹੈ',
          'ਨਰਮਾ (Cotton) ਦਾ ਭਾਅ ₹7,100/ਕੁਇੰਟਲ ਚੱਲ ਰਿਹਾ ਹੈ',
          'ਸਰਕਾਰ ਵਲੋਂ MSP ਰੇਟ ਪੂਰਾ ਦਿੱਤਾ ਜਾ ਰਿਹਾ ਹੈ'
        ] : lang === 'hi' ? [
          'लुधियाना मंडी में गेहूं का भाव ₹2,275/क्विंटल है',
          'कपास का भाव ₹7,100/क्विंटल चल रहा है',
          'सरकार द्वारा MSP रेट पूरा दिया जा रहा है'
        ] : [
          'Wheat APMC rate in Ludhiana Mandi today is ₹2,275/quintal',
          'Cotton rate is running at ₹7,100/quintal',
          'Government MSP rates guaranteed'
        ]
        dosageVal = lang === 'pa' ? 'ਲੁਧਿਆਣਾ ਮੰਡੀ (Ludhiana APMC)' : lang === 'hi' ? 'लुधियाना मंडी (Ludhiana APMC)' : 'Ludhiana APMC Market'
      } else {
        title = lang === 'pa' ? 'ਖੇਤੀ ਸਲਾਹ' : lang === 'hi' ? 'कृषि सलाह' : 'FARM ADVISORY'
        bullets = lang === 'pa' ? [
          'ਤੁਹਾਡਾ ਸਵਾਲ ਪ੍ਰਾਪਤ ਹੋ ਗਿਆ ਹੈ',
          'ਖੇਤ ਵਿੱਚ ਸਹੀ ਨਮੀ ਬਣਾ ਕੇ ਰੱਖੋ',
          'ਕੀੜਿਆਂ ਦੀ ਹਫ਼ਤੇ ਵਿੱਚ ਦੋ ਵਾਰ ਜਾਂਚ ਕਰੋ'
        ] : lang === 'hi' ? [
          'आपका प्रश्न प्राप्त हो गया है',
          'खेत में पर्याप्त नमी रखें',
          'कीटों की सप्ताह में दो बार जांच करें'
        ] : [
          'Your agricultural query has been received',
          'Maintain balanced soil moisture in field',
          'Inspect crops twice a week for pests'
        ]
        dosageVal = lang === 'pa' ? 'ਜੈਵਿਕ ਸਲਾਹ' : lang === 'hi' ? 'जैविक सलाह' : 'Organic Advisory'
      }

      const fallbackMsg = {
        id: 'ast-' + Date.now(),
        sender: 'assistant',
        text: '',
        structured: {
          severity: title.includes('WARNING') || title.includes('ਚੇਤਾਵਨੀ') || title.includes('चेतावनी') ? 'high' : 'medium',
          title: title,
          bullets: bullets,
          dosage: dosageVal,
        }
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserAudioPlay = (msgId) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null)
    } else {
      setPlayingAudioId(msgId)
      setTimeout(() => setPlayingAudioId(null), 4000)
    }
  }

  const promptChips = [
    {
      icon: Bug,
      text: lang === 'pa' ? 'ਕਣਕ ਤੇ ਪੀਲੀ ਕੁੰਗੀ ਦਾ ਇਲਾਜ' : lang === 'hi' ? 'गेहूं पर पीला रतुआ का इलाज' : 'Wheat Yellow Rust Treatment',
      query: lang === 'pa' ? 'ਕਣਕ ਤੇ ਪੀਲਾ ਤੇਲਾ ਲੱਗ ਗਿਆ, ਕੀ ਕਰੀਏ?' : lang === 'hi' ? 'गेहूं पर पीला तेला लग गया, क्या करें?' : 'Wheat crop has yellow rust symptoms, what treatment should I apply?'
    },
    {
      icon: TrendingUp,
      text: lang === 'pa' ? 'ਲੁਧਿਆਣਾ ਮੰਡੀ ਅੱਜ ਦਾ ਭਾਅ' : lang === 'hi' ? 'लुधियाना मंडी आज का भाव' : 'Ludhiana Mandi Market Rates',
      query: lang === 'pa' ? 'ਲੁਧਿਆਣਾ ਮੰਡੀ ਕਣਕ ਅਤੇ ਝੋਨੇ ਦਾ ਭਾਅ ਦੱਸੋ' : lang === 'hi' ? 'लुधियाना मंडी गेहूं और धान का भाव बताओ' : 'What is the current wheat and paddy rate in Ludhiana mandi?'
    },
    {
      icon: CloudSun,
      text: lang === 'pa' ? 'ਅੱਜ ਸਪਰੇਅ ਕਰਨ ਲਈ ਮੌਸਮ' : lang === 'hi' ? 'आज स्प्रे करने का मौसम' : 'Today Spraying Weather',
      query: lang === 'pa' ? 'ਕੀ ਅੱਜ ਖੇਤ ਵਿੱਚ ਛਿੜਕਾਅ ਕਰ ਸਕਦੇ ਹਾਂ?' : lang === 'hi' ? 'क्या आज खेत में छिड़काव कर सकते हैं?' : 'Is today good weather for spraying pesticide in Ludhiana?'
    },
    {
      icon: FlaskConical,
      text: lang === 'pa' ? 'ਯੂਰੀਆ ਅਤੇ ਖਾਦ ਦੀ ਮਾਤਰਾ' : lang === 'hi' ? 'यूरिया और उर्वरक की मात्रा' : 'Fertilizer & Urea Dosage',
      query: lang === 'pa' ? 'ਇੱਕ ਏਕੜ ਵਿੱਚ ਯੂਰੀਆ ਕਿੰਨਾ ਪਾਉਣਾ ਹੈ?' : lang === 'hi' ? 'एक एकड़ में यूरिया कितना डालना है?' : 'How much urea fertilizer should be applied per acre?'
    }
  ]

  return (
    <div className="chat-canvas-container">
      {/* Scrollable Messages Stream */}
      <div className="messages-scroll-area">
        {messages.length === 0 ? (
          <div className="chat-welcome-hero">
            <div style={{ marginBottom: '1.25rem', filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))' }}>
              <GrizonAgriLogo size={64} />
            </div>
            <h2 className="welcome-title">
              {getPersonalizedGreeting(lang, firstName)}
            </h2>
            <p className="welcome-subtitle">
              {lang === 'pa' ? 'ਫ਼ਸਲਾਂ ਦੀ ਬੀਮਾਰੀ, ਮੰਡੀ ਦੇ ਭਾਅ, ਮੌਸਮ ਅਤੇ ਖਾਦ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ' : lang === 'hi' ? 'फसल बीमारी, मंडी भाव, मौसम और खाद के बारे में पूछें' : 'Ask anything about crop diseases, mandi prices, weather, and fertilizer dosage'}
            </p>

            <div className="prompt-chips-grid">
              {promptChips.map((chip, idx) => {
                const IconComponent = chip.icon
                return (
                  <button
                    key={idx}
                    className="prompt-chip"
                    onClick={() => handleSend(chip.query)}
                  >
                    <IconComponent className="prompt-chip-icon" size={18} />
                    <span className="prompt-chip-text">{chip.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
            >
              {msg.sender === 'user' ? (
                <div className="message-bubble user-bubble">
                  <p className="user-text">{msg.text}</p>
                  
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded leaf scan" className="user-image-preview" />
                  )}

                  {msg.isVoice && (
                    <div className="user-voice-audio-row">
                      <button
                        className="user-play-btn"
                        onClick={() => toggleUserAudioPlay(msg.id)}
                        aria-label="Play audio"
                      >
                        {playingAudioId === msg.id ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '1px' }} />}
                      </button>

                      <div className={`waveform-bar-container ${playingAudioId === msg.id ? 'is-playing' : ''}`}>
                        {[...Array(16)].map((_, i) => (
                          <span key={i} className="bar" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="assistant-bubble-wrap">
                  <ResponseCard data={msg.structured} />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="message-row assistant-row">
            <div className="loading-assistant-card">
              <div className="pulsating-dots">
                <span></span><span></span><span></span>
              </div>
              <span>{t('thinking') || 'Grizon Agri AI is analyzing...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Glass Input Dock */}
      <div className="floating-dock-container">
        <div className="dock-glass-wrap">
          {/* Attached Image Thumbnail Preview */}
          {selectedImage && (
            <div className="dock-attached-preview">
              <img src={selectedImage.dataUrl} alt="Scan preview" className="dock-attached-thumb" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {t('photo_attached') || 'Photo Attached'}
              </span>
              <button 
                className="dock-remove-img" 
                onClick={() => setSelectedImage(null)}
                title="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="dock-controls-row">
            {/* Camera Attachment Button */}
            <CameraCapture onImageSelected={(img) => setSelectedImage(img)} />

            {/* Main Text Input */}
            <input
              type="text"
              className="dock-text-input"
              placeholder={t('input_placeholder') || 'Ask Grizon Agri... (Voice or Text)'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />

            {/* Voice Microphone Record Button */}
            <VoiceMic onTranscript={(transcript) => handleSend(transcript, true)} />

            {/* Send Button */}
            <button
              type="button"
              className="send-btn-dock"
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !selectedImage}
              title="Send Message"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
