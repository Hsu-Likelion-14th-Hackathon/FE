import { useCallback, useEffect, useId, useRef, useState } from 'react'

import styles from './ScrollSelect.module.scss'

/** 자리가 넉넉할 때 쓰는 최대 높이. */
const PANEL_MAX_HEIGHT = 220
/** 트리거와 목록 사이 간격. SCSS의 .panel / .panelUp과 같아야 한다. */
const PANEL_GAP = 4
/** 세 줄은 보여야 목록처럼 보인다. 이보다 좁으면 자리가 없어도 이만큼은 쓴다. */
const PANEL_MIN_HEIGHT = 132

/**
 * 목록을 실제로 잘라 내는 상자.
 *
 * 창 높이로 재면 안 된다. 이 컴포넌트는 스크롤되는 시트 안에 놓이는데, 시트가
 * overflow를 갖는 순간 그 경계에서 잘린다. 창은 아직 한참 남았는데 목록은 이미
 * 반이 사라진 상태가 된다. 자르는 조상을 찾아 그 경계를 쓴다.
 */
function findClipBox(element) {
  let node = element?.parentElement
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') {
      const box = node.getBoundingClientRect()
      return { top: box.top, bottom: box.bottom }
    }
    node = node.parentElement
  }
  return { top: 0, bottom: window.innerHeight }
}

/**
 * 한 칸짜리 선택 목록.
 *
 * 네이티브 `<select>`의 펼침 목록은 운영체제가 그린다. 연도처럼 항목이 많으면
 * 그 안에 회색 스크롤 막대가 뜨는데, 브라우저 밖에서 그려지는 것이라 CSS로는
 * 숨길 수 없다. 그래서 목록을 직접 그리고 막대만 감춘다(스크롤은 그대로 된다).
 *
 * 열림 상태는 밖에서 쥔다. 연·월·일이 나란히 있어 하나가 열리면 나머지는 닫혀야
 * 하는데, 각자 제 상태를 들면 서로를 모른다.
 *
 * @param {{
 *   label: string,
 *   value: number | string,
 *   options: { value: number | string, label: string }[],
 *   placeholder: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   onChange: (value: number | string) => void,
 * }} props
 */
export default function ScrollSelect({
  label,
  value,
  options,
  placeholder,
  isOpen,
  onOpenChange,
  onChange,
}) {
  const reactId = useId()
  const listboxId = `scroll-select-${reactId.replaceAll(':', '')}`
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const optionRefs = useRef([])
  const [activeIndex, setActiveIndex] = useState(0)
  // 어느 쪽으로 얼마나 펼칠지. 시트는 화면 바닥에 붙은 데다 높이도 400px이 안 돼
  // 아래위 어느 쪽도 넉넉하지 않다. 방향과 높이를 여는 순간 함께 정한다.
  const [placement, setPlacement] = useState({ up: false, height: PANEL_MAX_HEIGHT })

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const close = useCallback(
    ({ restoreFocus = false } = {}) => {
      onOpenChange(false)
      // 여기서도 스크롤을 막는다. 트리거로 초점을 돌리는 것뿐인데 브라우저가
      // 시트를 함께 굴려 화면이 튄다.
      if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
    },
    [onOpenChange],
  )

  /**
   * 항목을 패널 안에서만 보이게 옮긴다.
   *
   * scrollIntoView는 조상 스크롤 컨테이너를 전부 함께 민다. 목록을 열거나 위아래로
   * 옮기는 순간 시트와 화면까지 올라가 버린다. 패널의 scrollTop만 직접 건드린다.
   */
  const revealInPanel = (element, { center = false } = {}) => {
    const panel = panelRef.current
    if (!panel || !element) return

    if (center) {
      panel.scrollTop = element.offsetTop - (panel.clientHeight - element.offsetHeight) / 2
      return
    }

    const top = element.offsetTop
    const bottom = top + element.offsetHeight
    if (top < panel.scrollTop) panel.scrollTop = top
    else if (bottom > panel.scrollTop + panel.clientHeight) {
      panel.scrollTop = bottom - panel.clientHeight
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined

    // 고른 값이 보이는 자리에서 열려야 한다. 2000년을 골라 뒀는데 목록이 맨 위에서
    // 열리면 다시 백 줄을 굴려야 한다.
    //
    const target = optionRefs.current[Math.max(selectedIndex, 0)]
    revealInPanel(target, { center: true })
    target?.focus({ preventScroll: true })

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close()
    }
    // Tab으로 목록 밖에 나가면 닫아야 한다. 열어 둔 채 다음 칸으로 넘어가면
    // 목록이 그 칸을 덮은 채 남는다.
    const handleFocusOut = (event) => {
      if (!rootRef.current?.contains(event.relatedTarget)) close()
    }
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      close({ restoreFocus: true })
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleEscape)
    rootRef.current?.addEventListener('focusout', handleFocusOut)
    const root = rootRef.current

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleEscape)
      root?.removeEventListener('focusout', handleFocusOut)
    }
    // selectedIndex는 열리는 순간의 값만 쓰면 된다. 고를 때마다 다시 굴리면
    // 목록이 손 밑에서 튄다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, isOpen])

  const focusOption = (index) => {
    const next = (index + options.length) % options.length
    setActiveIndex(next)
    revealInPanel(optionRefs.current[next])
    optionRefs.current[next]?.focus({ preventScroll: true })
  }

  const handleOptionKeyDown = (event, index) => {
    const moves = {
      ArrowDown: () => focusOption(index + 1),
      ArrowUp: () => focusOption(index - 1),
      Home: () => focusOption(0),
      End: () => focusOption(options.length - 1),
    }
    const move = moves[event.key]
    if (!move) return

    event.preventDefault()
    move()
  }

  return (
    <div className={styles.field} ref={rootRef}>
      <button
        className={`${styles.trigger} ${selected ? styles.triggerActive : ''}`}
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          setActiveIndex(Math.max(selectedIndex, 0))
          // 여는 순간의 자리로 방향과 높이를 정한다. 열린 뒤에 재면 이미 잘린 뒤다.
          const box = triggerRef.current?.getBoundingClientRect()
          const clip = findClipBox(triggerRef.current)
          const below = box ? clip.bottom - box.bottom : 0
          const above = box ? box.top - clip.top : 0
          const up = above > below
          const room = (up ? above : below) - PANEL_GAP
          setPlacement({
            up,
            height: Math.max(PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, room)),
          })
          onOpenChange(!isOpen)
        }}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected?.label ?? placeholder}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ⌄
        </span>
      </button>

      {isOpen ? (
        <div
          className={`${styles.panel} ${placement.up ? styles.panelUp : ''}`}
          ref={panelRef}
          style={{ maxHeight: `${placement.height}px` }}
          id={listboxId}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => (
            <button
              className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                onChange(option.value)
                close({ restoreFocus: true })
              }}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
