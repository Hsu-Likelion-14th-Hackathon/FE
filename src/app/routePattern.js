/**
 * 주소를 라우트 패턴으로 바꾼다(/products/12 → /products/:productId).
 * 성능 지표를 상품마다가 아니라 화면 단위로 모으려는 것이다.
 */
export function toRoutePattern(pathname, params = {}) {
  let route = pathname
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === '*') continue
    route = route
      .replace(`/${encodeURIComponent(value)}`, `/:${key}`)
      .replace(`/${value}`, `/:${key}`)
  }
  return route
}
