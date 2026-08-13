import { useLayoutEffect, useRef, useState } from 'react'

/**
 * 설계 크기로 그려진 화면을 가용 영역 안에 비율 그대로 넣는다.
 *
 * 모바일 브라우저는 주소창과 툴바가 화면을 먹어 설계 높이(844)보다 짧다.
 * 사파리는 대략 745, 카카오 인앱 브라우저는 660 남짓이다. 이때 넘치는 부분을
 * 잘라내면 시계나 CTA처럼 아래에 놓인 요소가 통째로 사라진다.
 *
 * 그래서 자르는 대신 구성 전체를 균일하게 줄인다. 내부 요소는 설계 좌표를
 * 그대로 쓰고 배율만 바깥에서 한 번 곱하므로, Figma 수치를 고칠 일이 없다.
 *
 * 반대로 태블릿처럼 설계보다 넓은 화면에서는 같은 비율로 키운다. 390px 구성을
 * 834px 안에 그대로 두면 가운데만 쓰고 양옆이 비어 액자처럼 보인다. 다만 원본
 * 이미지 해상도를 넘어서면 뭉개지므로 maxScale로 상한을 둔다.
 *
 * @param {number} designWidth 설계 폭(px)
 * @param {number} designHeight 설계 높이(px)
 * @param {number} [maxScale] 확대 상한. 에셋 원본 해상도에 맞춰 정한다.
 * @returns {[import('react').RefObject<HTMLElement>, number]} 가용 영역 ref와 배율
 */
export default function useScaleToFit(designWidth, designHeight, maxScale = 1) {
  const frameRef = useRef(null)
  const [scale, setScale] = useState(1)

  // 배치를 그린 뒤에 배율이 바뀌면 한 프레임 동안 큰 화면이 스쳐 보인다.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined

    const measure = () => {
      const { width, height } = frame.getBoundingClientRect()
      if (!width || !height) return
      // 두 축 모두에 들어가는 배율 — 둘 중 작은 쪽이 화면을 벗어나지 않게 한다.
      setScale(Math.min(maxScale, width / designWidth, height / designHeight))
    }

    measure()

    // 주소창이 접히고 펴질 때도 가용 높이가 바뀐다.
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [designWidth, designHeight, maxScale])

  return [frameRef, scale]
}
