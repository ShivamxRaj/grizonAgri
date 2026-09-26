import React, { useState, useRef } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function VoiceMic({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const { lang } = useLang()

  const getLangCode = () => {
    if (lang === 'pa') return 'pa-IN'
    if (lang === 'hi') return 'hi-IN'
    return 'en-IN'
  }

  const startListening = async () => {
    // 1. Try Native Web Speech API (Chrome / Edge / Brave / Safari)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = getLangCode()
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => {
          setIsRecording(true)
        }

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          if (transcript && onTranscript) {
            onTranscript(transcript)
          }
          setIsRecording(false)
        }

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error)
          setIsRecording(false)
          // Fallback to MediaRecorder + Sarvam STT if browser speech recognition blocks audio
          startAudioRecording()
        }

        recognition.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        return
      } catch (e) {
        console.warn('Speech recognition init error:', e)
      }
    }

    // 2. Fallback to MediaRecorder + Backend Sarvam STT
    startAudioRecording()
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await sendAudioToBackend(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.warn('Microphone access denied or unverified:', err)
      alert('Microphone access was denied or unsupported. Please type your query in the chat box.')
      setIsRecording(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop() } catch (e) {}
    }
    setIsRecording(false)
  }

  const sendAudioToBackend = async (blob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('language', getLangCode())

      const response = await fetch('/api/v1/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (onTranscript && data.transcript) {
          onTranscript(data.transcript)
        }
      } else {
        throw new Error('STT returned error status')
      }
    } catch (err) {
      console.warn('Backend STT failed:', err)
      alert('Could not transcribe audio. Please type your query directly.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClick = () => {
    if (isRecording) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <button
      type="button"
      className={`mic-btn-dock ${isRecording ? 'is-recording' : ''}`}
      onClick={handleClick}
      disabled={isProcessing}
      title={isRecording ? 'Stop Recording' : 'Voice Input (Say query in Hindi, Punjabi, or English)'}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isRecording ? (
        <Square size={16} />
      ) : (
        <Mic size={19} />
      )}
    </button>
  )
}
