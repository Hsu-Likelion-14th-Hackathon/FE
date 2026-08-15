import { useState } from 'react'

/**
 * 음성 AI 도슨트 UI Mock (M-01).
 * 실제 음성 재생은 하지 않고 재생/정지 상태 토글만 표현한다.
 * 화면별 비주얼은 className으로 덮어쓸 수 있다.
 */
function VoiceDocentMock({ className = '', label = 'AI 도슨트' }) {
  const [playing, setPlaying] = useState(false)

  return (
    <button
      type="button"
      aria-pressed={playing}
      data-deferred-id="M-01"
      onClick={() => setPlaying((prev) => !prev)}
      className={`inline-flex items-center gap-2 rounded-full bg-[rgba(25,25,25,0.8)] px-4 py-2 text-xs font-semibold text-[#fafafa] ${className}`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {playing ? '■' : '▶'}
      </span>
      {label}
      <span className="sr-only">{playing ? '정지' : '재생'}</span>
    </button>
  )
}

export default VoiceDocentMock
