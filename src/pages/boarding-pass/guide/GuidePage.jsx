import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { getBoardingPassRoute, getLatestBoardingPass } from '@/shared/api/boardingPassApi.js'
import { getFloor, getFloors } from '@/shared/api/floorApi.js'
import guideDecoTopImg from '@/shared/assets/boarding-pass/guide/deco-top.png'
import emblemCrestImg from '@/shared/assets/boarding-pass/guide/emblem-crest.png'
import emblemLaurelImg from '@/shared/assets/boarding-pass/guide/emblem-laurel.png'
import overviewFigureImg from '@/shared/assets/boarding-pass/guide/overview-figure.png'
import overviewMainImg from '@/shared/assets/boarding-pass/guide/overview-main.png'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import BoardingPassStageBackdrop from '@/shared/layout/BoardingPassStageBackdrop.jsx'
import BoardingPassStageHeader from '@/shared/layout/BoardingPassStageHeader.jsx'
import BoardingPassStepNav from '@/shared/layout/BoardingPassStepNav.jsx'
import { FLIGHT_STEP, GUIDE_FLOOR_ORDER } from '@/shared/layout/boardingPassSteps.js'
import scrollDocumentToTop from '@/shared/layout/scrollDocumentToTop.js'
import StateNotice from '@/shared/ui/state-notice/StateNotice.jsx'

import styles from './GuidePage.module.scss'

/**
 * 여행 가이드 (44)(45)(46)(47)(47-1).
 * 개요 → 1F → 2F → 3F → 5F. 층 구성·배지·콘텐츠는 백엔드(GET /floors,
 * GET /floors/{id})에서 오고, 개요 인트로 카피만 디자인 문구다.
 * AI 추천 동선(GET /boarding-passes/{id}/route)은 개요 칩에 표시한다.
 */

/** 개요 인트로 — 계약에 없는 Figma 카피 */
const INTRO_COPY = {
  lead: '1976년 뮌헨에서 태어난 이름 하나가',
  emphasis: '2026년',
  tail: ' 다시 같은 질문을 던진다',
  quote: '우리는 어디로, 왜 떠나는가?',
}

function initialGuideFloor(location) {
  const requested = location.state?.floor
  return GUIDE_FLOOR_ORDER.includes(requested) ? requested : 'overview'
}

export function Component() {
  const navigate = useNavigate()
  const location = useLocation()
  const [floor, setFloor] = useState(() => initialGuideFloor(location))
  // 층 목록·추천 동선. 상세는 층에 처음 들어갈 때 받아 캐시한다.
  const [floors, setFloors] = useState(null)
  const [floorsError, setFloorsError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [route, setRoute] = useState(null)
  // 추천 밖의 층을 한 번이라도 봤으면 전 층 순서를 유지한다.
  const [allFloorsPinned, setAllFloorsPinned] = useState(false)
  const [details, setDetails] = useState({})
  // 요청 중인 층. state로 두면 effect 안에서 동기 setState가 필요해진다.
  const inFlightRef = useRef(new Set())

  // AI가 추천한 층만 가이드에 세운다 — 순서는 추천 동선(sequence)을 따른다.
  // 동선을 아직 못 받았거나 추천이 하나도 없으면 전 층을 보여 준다.
  // 빈 가이드는 아무것도 안내하지 못한다.
  const recommendedIds = (route ?? [])
    .filter((step) => step.isRecommended)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((step) => step.id)
  const allFloorIds = floors
    ? [...floors].sort((a, b) => a.floorNo - b.floorNo).map((item) => item.id)
    : GUIDE_FLOOR_ORDER.slice(1)
  // 비행 화면 슬라이더는 전 층 눈금을 준다. 추천에 없는 층을 보고 있으면 전 층
  // 순서로 안내한다 — 추천만 남기면 현재 층이 순서에 없어 슬라이더 위치가
  // 어긋나고 "이전"이 비행 화면으로 이탈한다. 한 번 전 층 모드가 됐으면 이
  // 방문 동안 고정한다(allFloorsPinned). 층을 옮길 때마다 다시 판정하면 추천
  // 층에 도착하는 순간 순서가 접혀 방금 있던 층의 눈금이 사라진다.
  const offRoute =
    floor !== 'overview' && recommendedIds.length > 0 && !recommendedIds.includes(floor)
  const visibleFloorIds =
    !recommendedIds.length || offRoute || allFloorsPinned ? allFloorIds : recommendedIds
  const order = ['overview', ...visibleFloorIds]
  const floorIndex = order.indexOf(floor)
  const atStart = floorIndex <= 0
  const atEnd = floorIndex >= order.length - 1
  // 하단 슬라이더도 보이는 층만큼만 눈금을 만든다.
  const step = FLIGHT_STEP + 1 + Math.max(floorIndex, 0)
  const stepLabels = ['MAPS', '가이드 개요', ...visibleFloorIds.map((id) => id.toUpperCase())]

  useLayoutEffect(() => {
    scrollDocumentToTop()
  }, [floor])

  useEffect(() => {
    let alive = true

    getFloors()
      .then(({ floors: loaded }) => {
        if (!alive) return
        setFloors(loaded)
        setFloorsError(null)
      })
      .catch((cause) => {
        if (alive) setFloorsError(cause)
      })

    // 추천 표시는 장식이다. 보딩패스가 없거나 실패해도 가이드는 그대로 돈다.
    getLatestBoardingPass()
      .then((pass) => (pass ? getBoardingPassRoute(pass.boardingPassId) : null))
      .then((steps) => {
        if (alive && steps) setRoute(steps)
      })
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [retryCount])

  // 화면을 떠난 뒤 도착한 응답을 버리기 위한 표식. StrictMode는 마운트 효과를
  // 두 번 돌리므로 설치 시점에 true로 되돌려 둔다.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 층 상세 lazy 로드. 한 번 받은 층은 다시 부르지 않는다. 상세가 없는 동안
  // 화면은 로딩으로 그린다(entry 없음 = 로딩).
  useEffect(() => {
    if (floor === 'overview' || !floors) return
    const meta = floors.find((item) => item.id === floor)
    if (!meta || details[floor] || inFlightRef.current.has(floor)) return

    inFlightRef.current.add(floor)
    getFloor(meta.floorId)
      // 층을 떠난 뒤 도착한 결과도 캐시한다. 버리면 그 층에 돌아왔을 때
      // inFlightRef 때문에 재요청도 안 나가 로딩 화면에 갇힌다.
      .then((data) => {
        if (mountedRef.current)
          setDetails((current) => ({ ...current, [floor]: { status: 'ready', data } }))
      })
      .catch(() => {
        if (mountedRef.current)
          setDetails((current) => ({ ...current, [floor]: { status: 'error' } }))
      })
      .finally(() => {
        inFlightRef.current.delete(floor)
      })
  }, [floor, floors, details])

  const retryFloors = () => {
    setFloors(null)
    setFloorsError(null)
    setRetryCount((count) => count + 1)
  }

  const retryDetail = () => {
    setDetails((current) => {
      const next = { ...current }
      delete next[floor]
      return next
    })
  }

  // 층 이동은 전부 여기를 지난다. 추천 밖 층에서 떠나는 순간 전 층 모드를
  // 고정해, 도착한 층이 추천이어도 방금 있던 층의 눈금이 사라지지 않게 한다.
  function moveTo(nextFloor) {
    if (offRoute) setAllFloorsPinned(true)
    setFloor(nextFloor)
  }

  function goRelative(delta) {
    if (delta > 0) {
      const next = order[floorIndex + 1]
      if (next) moveTo(next)
      return
    }

    if (atStart) {
      navigate('/boarding-pass/flight')
      return
    }

    const prev = order[floorIndex - 1]
    if (prev) moveTo(prev)
  }

  function goToStep(nextStep) {
    if (nextStep <= FLIGHT_STEP) {
      navigate('/boarding-pass/flight')
      return
    }
    const nextFloor = order[nextStep - FLIGHT_STEP - 1]
    if (nextFloor) moveTo(nextFloor)
  }

  return (
    <div className={styles.page}>
      <StoreHeader />

      <div className={styles.stage}>
        <BoardingPassStageBackdrop />

        <main className={styles.main}>
          <BoardingPassStageHeader
            title="TRAVEL GUIDE"
            closeLabel="비행으로 돌아가기"
            onClose={() => navigate('/boarding-pass/flight')}
          />

          <div key={floor} className={styles.scroll}>
            {floor === 'overview' ? (
              <OverviewView
                floors={floors}
                error={floorsError}
                route={route}
                onRetry={retryFloors}
                onSelectFloor={moveTo}
              />
            ) : (
              <FloorView
                meta={floors?.find((item) => item.id === floor) ?? null}
                entry={details[floor] ?? null}
                onRetry={retryDetail}
              />
            )}
          </div>
        </main>

        <BoardingPassStepNav
          step={step}
          labels={stepLabels}
          onPrev={() => goRelative(-1)}
          onNext={() => goRelative(1)}
          onSelectStep={goToStep}
          nextDisabled={atEnd}
          groupLabel="여행 진행"
          note={floor === 'overview' ? 'AI가 고객님만의 MCM 비행 가이드를 준비했습니다' : undefined}
        />
      </div>
    </div>
  )
}

function OverviewView({ floors, error, route, onRetry, onSelectFloor }) {
  // 건물처럼 위층부터 쌓는다.
  const ordered = [...(floors ?? [])].sort((a, b) => b.floorNo - a.floorNo)
  const recommended = new Set(
    (route ?? []).filter((step) => step.isRecommended).map((step) => step.id),
  )
  // 추천 동선이 있으면 그 층만 세운다. 없으면(동선 실패·패스 없음) 전 층이다.
  const shown = recommended.size ? ordered.filter((item) => recommended.has(item.id)) : ordered

  return (
    <div>
      <div className={styles.introBlock}>
        <img src={guideDecoTopImg} alt="" aria-hidden="true" className={styles.planeDeco} />
        <div className={styles.introCard}>
          <div className={styles.introLines}>
            <p>{INTRO_COPY.lead}</p>
            <p>
              <span className={styles.introEm}>{INTRO_COPY.emphasis}</span>
              {INTRO_COPY.tail}
            </p>
          </div>
          <p className={styles.introQuote}>“ {INTRO_COPY.quote} ”</p>
        </div>
      </div>

      <div className={styles.overviewStage}>
        <img src={overviewMainImg} alt="MCM HAUS 야간 전경" className={styles.overviewMain} />
        <img src={overviewFigureImg} alt="" aria-hidden="true" className={styles.overviewFigure} />

        {error ? (
          <StateNotice
            role="alert"
            variant="dark"
            eyebrow="Notice"
            message={error.message ?? '층 안내를 불러오지 못했습니다.'}
            hint="잠시 후 다시 시도해 주세요"
            action={{ label: '다시 시도', onClick: onRetry }}
          />
        ) : !floors ? (
          <p className={styles.floorStatus} role="status">
            층 안내를 불러오는 중…
          </p>
        ) : (
          <div className={styles.floorChips}>
            {shown.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectFloor(item.id)}
                className={`${styles.floorChip} ${
                  shown.length === 1
                    ? styles.floorChipSingle
                    : index === 0
                      ? styles.floorChipTop
                      : index === shown.length - 1
                        ? styles.floorChipBottom
                        : styles.floorChipMid
                }`}
              >
                <p className={styles.floorChipBadge}>
                  {item.badge}
                  {recommended.has(item.id) ? (
                    <span className={styles.aiPick} aria-label="AI 추천 층">
                      ✦ AI
                    </span>
                  ) : null}
                </p>
                <p className={styles.floorChipSub}>{item.tagline || item.subtitle}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 층 상세. 배지·부제는 층 목록에서, 본문 블록은 층 상세 계약에서 온다.
 * blockType이 그리는 모양을 정한다 — TEXT 문단, LIST 목록, QUOTE 인용,
 * IMAGE 사진, PRODUCT 상품 카드.
 */
function FloorView({ meta, entry, onRetry }) {
  if (!meta) return null

  return (
    <div className={styles.panelStack}>
      <div className={styles.floorBadge}>
        <p className={styles.floorChipBadge}>{meta.badge}</p>
        <p className={styles.floorChipSub}>{meta.tagline || meta.subtitle}</p>
      </div>

      {meta.code === 'EMBLEM' ? (
        <div className={styles.headlineWithEmblem}>
          <div className={styles.emblemRow} aria-hidden="true">
            <img src={emblemLaurelImg} alt="" className={styles.emblemLaurel} />
            <img src={emblemCrestImg} alt="" className={styles.emblemCrest} />
          </div>
          <FloorHeadline meta={meta} />
        </div>
      ) : (
        <FloorHeadline meta={meta} />
      )}

      {entry?.status === 'ready' ? (
        <FloorContents contents={entry.data.contents} floorCode={entry.data.code} />
      ) : entry?.status === 'error' ? (
        <StateNotice
          role="alert"
          variant="dark"
          eyebrow="Notice"
          message="층 콘텐츠를 불러오지 못했습니다."
          hint="잠시 후 다시 시도해 주세요"
          action={{ label: '다시 시도', onClick: onRetry }}
        />
      ) : (
        <p className={styles.floorStatus} role="status">
          층 안내를 불러오는 중…
        </p>
      )}
    </div>
  )
}

function FloorHeadline({ meta }) {
  return (
    <div className={styles.floorHeadline}>
      <p className={styles.floorHeadlineText}>{meta.subtitle}</p>
      {meta.tagline ? <p className={styles.floorQuote}>“ {meta.tagline} ”</p> : null}
    </div>
  )
}

function FloorContents({ contents, floorCode }) {
  const rendered = []
  let listBuffer = []
  let productBuffer = []

  const flushList = (key) => {
    if (!listBuffer.length) return
    rendered.push(
      <div className={styles.panel} key={key}>
        <ul className={styles.panelList}>
          {listBuffer.map((block) => (
            <li key={block.orderNo}>{block.body}</li>
          ))}
        </ul>
      </div>,
    )
    listBuffer = []
  }

  // 연이은 PRODUCT 블록은 층 배치대로 묶는다. 여정(Figma 45)은 두 카드가
  // 나란히 서고, 나머지 층(46·47)은 와이드 카드가 세로로 쌓인다.
  const flushProducts = (key) => {
    if (!productBuffer.length) return
    if (floorCode === 'JOURNEY' && productBuffer.length > 1) {
      rendered.push(
        <div className={styles.productPair} key={key}>
          {productBuffer.map((block) => (
            <FloorProductCard compact product={block.product} key={block.orderNo} />
          ))}
        </div>,
      )
    } else {
      for (const block of productBuffer) {
        rendered.push(<FloorProductCard product={block.product} key={block.orderNo} />)
      }
    }
    productBuffer = []
  }

  for (const block of contents) {
    if (block.blockType === 'LIST') {
      // 연이은 LIST 블록은 한 목록으로 묶는다.
      flushProducts(`products-${block.orderNo}`)
      listBuffer.push(block)
      continue
    }
    if (block.blockType === 'PRODUCT' && block.product) {
      flushList(`list-${block.orderNo}`)
      productBuffer.push(block)
      continue
    }
    flushList(`list-${block.orderNo}`)
    flushProducts(`products-${block.orderNo}`)

    if (block.blockType === 'TEXT') {
      rendered.push(
        <div className={styles.panel} key={block.orderNo}>
          <div className={styles.panelBlock}>
            {block.body.split('\n').map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>,
      )
    } else if (block.blockType === 'QUOTE') {
      rendered.push(
        <p className={styles.floorQuote} key={block.orderNo}>
          “ {block.body} ”
        </p>,
      )
    } else if (block.blockType === 'IMAGE' && block.imageUrl) {
      rendered.push(
        <img className={styles.contentImage} src={block.imageUrl} alt="" key={block.orderNo} />,
      )
    }
  }
  flushList('list-end')
  flushProducts('products-end')

  return <>{rendered}</>
}

function FloorProductCard({ product, compact = false }) {
  return (
    <div
      className={`${styles.productCard} ${compact ? styles.productCardCompact : styles.productCardWide}`}
    >
      <div className={styles.productThumb}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className={styles.productThumbImg} />
        ) : null}
      </div>
      <div className={styles.productMeta}>
        <p className={`${styles.productName} ${compact ? '' : styles.productNameWide}`}>
          <FitLine className={styles.productNameLine}>{product.name}</FitLine>
        </p>
        {product.priceLabel ? <p className={styles.productPrice}>{product.priceLabel}</p> : null}
      </div>
    </div>
  )
}

function FitLine({ children, className }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    let lastWidth = -1

    function fit() {
      const width = el.clientWidth
      if (width === lastWidth) return
      lastWidth = width

      el.style.fontSize = ''
      const maxSize = Number.parseFloat(getComputedStyle(el).fontSize)
      let size = maxSize
      const minSize = 8
      while (el.scrollWidth > el.clientWidth + 0.5 && size > minSize) {
        size -= 0.25
        el.style.fontSize = `${size}px`
      }
    }

    fit()

    const target = el.parentElement ?? el
    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(fit)
    observer.observe(target)
    return () => observer.disconnect()
  }, [children])

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}
