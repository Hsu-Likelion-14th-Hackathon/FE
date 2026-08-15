function getShellScroller() {
  return document.querySelector('[data-device-screen]')?.firstElementChild
}

function visualViewBottom() {
  const visual = window.visualViewport
  if (visual) return visual.offsetTop + visual.height
  return window.innerHeight
}

/**
 * 모바일 하단 브라우저 바에 가린 요소가 보이도록 창을 내린다.
 * 선택지 클릭처럼 사용자 제스처 안에서 호출해야 바가 접힐 여지가 있다.
 */
export default function revealBelowBrowserChrome(element) {
  if (!element) return

  const overflow = element.getBoundingClientRect().bottom - visualViewBottom()
  if (overflow <= 0) return

  const top = overflow + 12
  window.scrollBy({ top, behavior: 'smooth' })
  getShellScroller()?.scrollBy?.({ top, behavior: 'smooth' })
  element.scrollIntoView({ block: 'end', behavior: 'smooth', inline: 'nearest' })
}
