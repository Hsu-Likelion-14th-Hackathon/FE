/**
 * 국기 SVG의 URL — country-flag-icons의 낱장 파일을 그대로 쓴다.
 *
 * 패키지의 flags.css는 267개국 국기를 data URI로 한 파일에 담아 gzip으로도
 * 48KB다. 국적 목록을 열면 화면에 보이는 몇 개만 필요하므로, 낱장 파일을
 * 에셋으로 내보내고 <img loading="lazy">로 보이는 것만 받는다.
 *
 * no-inline: 국기 대부분이 4KB 미만이라 기본값이면 Vite가 data URI로 JS에
 * 박아 넣는다. 그러면 CSS 대신 JS가 무거워질 뿐이다.
 */
const flagUrls = import.meta.glob('/node_modules/country-flag-icons/3x2/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default',
})

const byCode = Object.fromEntries(
  Object.entries(flagUrls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]),
)

/** @param {string} code ISO 3166-1 alpha-2 */
export function getFlagUrl(code) {
  return byCode[code] ?? null
}
