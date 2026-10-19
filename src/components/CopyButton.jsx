import { useState } from 'react'

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for browsers that block clipboard API
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all
        ${copied
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-[#FFF0F4] text-[#B85C72] border border-[#FFC5D3] hover:bg-[#FFE0E9]'
        }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}