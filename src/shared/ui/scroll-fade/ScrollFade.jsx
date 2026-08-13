import styles from './ScrollFade.module.scss'

/**
 * 목록 화면 바닥에 깔리는 페이드.
 *
 * 아래로 더 볼 게 남았다는 신호라서 장식이 아니다. 다만 읽는 데 방해가 되면
 * 안 되므로 클릭은 통과시키고 스크린리더에서는 감춘다.
 */
function ScrollFade() {
  return <div className={styles.scrollFade} aria-hidden="true" />
}

export default ScrollFade
