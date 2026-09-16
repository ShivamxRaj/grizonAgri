import React, { useRef } from 'react'
import { Camera } from 'lucide-react'
import { useLang } from '../i18n/LangProvider'

export default function CameraCapture({ onImageSelected }) {
  const { t } = useLang()
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (onImageSelected) {
        onImageSelected({ file, dataUrl: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={triggerCamera}
        className="dock-action-btn"
        title={t('scan_disease') || 'Attach / Scan Crop Photo'}
      >
        <Camera size={19} />
      </button>
    </>
  )
}
