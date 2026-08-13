import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import {
  guideFloorContent,
} from '@/features/boarding-pass/travel-guide/guideFloorContent.js'
import guideDecoTopImg from '@/shared/assets/boarding-pass/guide/deco-top.png'
import emblemCrestImg from '@/shared/assets/boarding-pass/guide/emblem-crest.png'
import emblemLaurelImg from '@/shared/assets/boarding-pass/guide/emblem-laurel.png'
import navNextImg from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/guide/nav-prev.svg'
import overviewFigureImg from '@/shared/assets/boarding-pass/guide/overview-figure.png'
import overviewMainImg from '@/shared/assets/boarding-pass/guide/overview-main.png'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import BoardingPassStageBackdrop from '@/shared/layout/BoardingPassStageBackdrop.jsx'
import BoardingPassStageHeader from '@/shared/layout/BoardingPassStageHeader.jsx'

import styles from './GuidePage.module.scss'

/** 층 전환 축 */
const FLOOR_ORDER = ['overview', '1f', '2f', '3f', '5f']

/**
 * 여행 가이드 (44)(45)(46)(47)(47-1).
 * 개요 → 1F → 2F → 3F → 5F. 상태바 미구현. 도슨트는 BoardingPassDocent(M-01).
 */
export function Component() {
  const navigate = useNavigate()
  const [floor, setFloor] = useState('overview')
  const floorIndex = FLOOR_ORDER.indexOf(floor)
  const progress = ((floorIndex + 1) / FLOOR_ORDER.length) * 100
  const atStart = floorIndex <= 0
  const atEnd = floorIndex >= FLOOR_ORDER.length - 1

  function goRelative(delta) {
    if (delta > 0) {
      const next = FLOOR_ORDER[floorIndex + 1]
      if (next) setFloor(next)
      return
    }

    if (atStart) {
      navigate('/boarding-pass/flight')
      return
    }

    const prev = FLOOR_ORDER[floorIndex - 1]
    if (prev) setFloor(prev)
  }

  function selectFloor(id) {
    setFloor(id)
  }

  return (
    <div className={styles.page}>
      <BoardingPassChrome />

      <div className={styles.stage}>
        <BoardingPassStageBackdrop />

        <main className={styles.main}>
        <BoardingPassStageHeader
          title="TRAVEL GUIDE"
          closeLabel="비행으로 돌아가기"
          onClose={() => navigate('/boarding-pass/flight')}
        />

        <div className={styles.scroll} data-overflow={floor === 'overview' ? 'visible' : 'auto'}>
          {floor === 'overview' ? (
            <OverviewView onSelectFloor={selectFloor} />
          ) : (
            <FloorView floor={floor} />
          )}
        </div>

        <div className={styles.nav}>
          <div className={styles.navRow} role="group" aria-label="층 전환">
            <button
              type="button"
              aria-label="이전"
              onClick={() => goRelative(-1)}
              className={styles.navBtn}
            >
              <img src={navPrevImg} alt="" className={styles.navBtnImg} />
            </button>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <button
              type="button"
              aria-label="다음"
              disabled={atEnd}
              onClick={() => goRelative(1)}
              className={styles.navBtn}
            >
              <img src={navNextImg} alt="" className={styles.navBtnImg} />
            </button>
          </div>
          <p className={styles.footerNote}>AI가 고객님만의 MCM 비행 가이드를 준비했습니다</p>
        </div>
      </main>
      </div>
    </div>
  )
}

function OverviewView({ onSelectFloor }) {
  const content = guideFloorContent.overview

  return (
    <div>
      <div className={styles.introBlock}>
          <img src={guideDecoTopImg} alt="" aria-hidden="true" className={styles.planeDeco} />
          <div className={styles.introCard}>
            <div className={styles.introLines}>
              <p>{content.introLead}</p>
              <p>
                <span className={styles.introEm}>{content.introEmphasis}</span>
                {content.introTail}
              </p>
            </div>
            <p className={styles.introQuote}>“ {content.quote} ”</p>
          </div>
        </div>

      <div className={styles.overviewStage}>
        <img src={overviewMainImg} alt="MCM HAUS 야간 전경" className={styles.overviewMain} />
        <img src={overviewFigureImg} alt="" aria-hidden="true" className={styles.overviewFigure} />

        <div className={styles.floorChips}>
          {content.floors.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFloor(item.id)}
              className={`${styles.floorChip} ${
                item.shape === 'top'
                  ? styles.floorChipTop
                  : item.shape === 'mid'
                    ? styles.floorChipMid
                    : styles.floorChipBottom
              }`}
            >
              <p className={styles.floorChipBadge}>{item.badge}</p>
              <p className={styles.floorChipSub}>{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FloorView({ floor }) {
  const content = guideFloorContent[floor]
  if (!content) return null

  return (
    <div className={styles.panelStack}>
      <div className={styles.floorBadge}>
        <p className={styles.floorChipBadge}>{content.badge}</p>
        <p className={styles.floorChipSub}>{content.subtitle}</p>
      </div>

      {content.showEmblems ? (
        <div className={styles.headlineWithEmblem}>
          <div className={styles.emblemRow} aria-hidden="true">
            <img src={emblemLaurelImg} alt="" className={styles.emblemLaurel} />
            <img src={emblemCrestImg} alt="" className={styles.emblemCrest} />
          </div>
          <div className={styles.floorHeadline}>
            <p className={styles.floorHeadlineText}>{content.headline}</p>
            <p className={styles.floorQuote}>“ {content.quote} ”</p>
          </div>
        </div>
      ) : (
        <div className={styles.floorHeadline}>
          <p className={styles.floorHeadlineText}>{content.headline}</p>
          <p className={styles.floorQuote}>“ {content.quote} ”</p>
        </div>
      )}

      {content.panels.map((panel, panelIndex) => (
        <div key={`${floor}-panel-${panelIndex}`} className={styles.panel}>
          {panel.blocks.map((lines, blockIndex) => (
            <div key={`${floor}-block-${panelIndex}-${blockIndex}`} className={styles.panelBlock}>
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      ))}

      {content.productRow === 'pair' ? (
        <div className={styles.productPair}>
          {content.products.map((product) => (
            <ProductCard key={product.nameLines.join(' ')} product={product} />
          ))}
        </div>
      ) : null}

      {content.productRow === 'cognac' ? (
        <div className={styles.productCognacRow}>
          <div className={styles.cognacNote}>
            {content.cognacNote.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {content.products.map((product) => (
            <ProductCard key={product.nameLines.join(' ')} product={product} />
          ))}
        </div>
      ) : null}

      {content.productRow === 'stack' ? (
        <div className={styles.productStack}>
          {content.products.map((product) => (
            <ProductCard key={product.nameLines.join(' ')} product={product} wide />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ProductCard({ product, wide = false }) {
  return (
    <div
      className={`${styles.productCard} ${
        wide || product.layout === 'wide' ? styles.productCardWide : styles.productCardCompact
      }`}
    >
      <div className={styles.productThumb}>
        <img src={product.image} alt="" className={styles.productThumbImg} />
      </div>
      <div className={styles.productMeta}>
        <p
          className={`${styles.productName} ${
            product.layout === 'wide' ? styles.productNameWide : ''
          }`}
        >
          {product.nameLines.map((line) => (
            <FitLine key={line} className={styles.productNameLine}>
              {line}
            </FitLine>
          ))}
        </p>
        {product.price ? <p className={styles.productPrice}>{product.price}</p> : null}
        {product.detailLines ? (
          <p className={styles.productDetail}>
            {product.detailLines.map((line) => (
              <span key={line} style={{ display: 'block' }}>
                {line}
              </span>
            ))}
          </p>
        ) : null}
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
