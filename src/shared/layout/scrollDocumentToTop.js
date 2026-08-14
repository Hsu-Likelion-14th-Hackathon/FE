/** 창·문서·모바일 셸 스크롤을 맨 위로 맞춘다. */
export default function scrollDocumentToTop() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  document.querySelector('[data-device-screen]')?.firstElementChild?.scrollTo?.(0, 0)
}
