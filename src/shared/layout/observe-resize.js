/**
 * 요소의 크기 변화를 관찰한다.
 *
 * ResizeObserver는 2020년 이후 브라우저에는 다 있지만, 오래된 인앱 웹뷰나
 * 서버 렌더링처럼 전역이 없는 환경도 있다. 없다고 화면이 통째로 죽으면 안 되므로
 * 창 크기 변화로 대신한다. 요소만 바뀌고 창은 그대로인 경우를 놓치지만,
 * 이 훅들이 쫓는 것은 결국 화면 크기라 실질적인 손해가 크지 않다.
 *
 * @param {Element} element 관찰할 요소
 * @param {() => void} onResize 크기가 바뀔 때 부를 함수
 * @returns {() => void} 관찰을 멈추는 함수
 */
export default function observeResize(element, onResize) {
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(onResize)
    observer.observe(element)
    return () => observer.disconnect()
  }

  if (typeof window === 'undefined') return () => {}

  // 회전은 resize를 함께 쏘지 않는 기기가 있어 따로 듣는다.
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
  }
}
