import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import {
  guideFloorContent,
  overviewHeroes,
} from '@/features/boarding-pass/travel-guide/guideFloorContent.js'
import cloudLargeImg from '@/shared/assets/boarding-pass/flight/cloud-large.png'
import planeDecoImg from '@/shared/assets/boarding-pass/flight/plane-deco.png'
import guideDecoTopImg from '@/shared/assets/boarding-pass/guide/deco-top.png'
import emblemCrestImg from '@/shared/assets/boarding-pass/guide/emblem-crest.png'
import emblemLaurelImg from '@/shared/assets/boarding-pass/guide/emblem-laurel.png'
import navNextImg from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/guide/nav-prev.svg'
import overviewFigureImg from '@/shared/assets/boarding-pass/guide/overview-figure.png'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import VoiceDocentMock from '@/shared/ui/VoiceDocentMock.jsx'

import styles from './GuidePage.module.scss'

/** 층 전환 축 (개요 히어로 4컷은 overview 내부 서브 인덱스) */
const FLOOR_ORDER = ['overview', '1f', '2f', '3f']

/**
 * 여행 가이드 (44)(44-1~3)(45)(46)(47).
 * 개요 히어로 넘김 → 1F → 2F → 3F. 상태바 미구현. VoiceDocentMock 스텁 유지.
 */
function GuidePage() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [floor, setFloor] = useState('overview')
  const [heroIndex, setHeroIndex] = useState(0)
  const floorIndex = FLOOR_ORDER.indexOf(floor)
  const progress = ((floorIndex + 1) / FLOOR_ORDER.length) * 100
  const atStart = floorIndex <= 0 && heroIndex <= 0
  const atEnd = floorIndex >= FLOOR_ORDER.length - 1

  function goRelative(delta) {
    if (delta > 0) {
      if (floor === 'overview' && heroIndex < overviewHeroes.length - 1) {
        setHeroIndex((i) => i + 1)
        return
      }
      const next = FLOOR_ORDER[floorIndex + 1]
      if (next) {
        setFloor(next)
        if (next === 'overview') setHeroIndex(0)
      }
      return
    }

    if (floor === 'overview' && heroIndex > 0) {
      setHeroIndex((i) => i - 1)
      return
    }
    const prev = FLOOR_ORDER[floorIndex - 1]
    if (prev) {
      setFloor(prev)
      if (prev === 'overview') setHeroIndex(overviewHeroes.length - 1)
    }
  }

  function selectFloor(id) {
    setFloor(id)
    if (id === 'overview') setHeroIndex(0)
  }

  return (
    <div className={styles.stage}>
      <BoardingPassChrome {...bagHandlers} />

      <div aria-hidden="true" className={styles.deco}>
        <img src={cloudLargeImg} alt="" className={styles.cloudTop} />
        <img src={cloudLargeImg} alt="" className={styles.cloudBottom} />
        <img src={planeDecoImg} alt="" className={styles.planeDeco} />
        <div className={styles.footerFade} />
      </div>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <button
            type="button"
            aria-label="비행으로 돌아가기"
            onClick={() => navigate('/boarding-pass/flight')}
            className={styles.close}
          >
            <img src={closeIcon} alt="" className={styles.closeImg} />
          </button>
          <div className={styles.docent}>
            <p className={styles.docentHint}>음성 AI 도슨트가 고객님의 여정을 안내합니다</p>
            <VoiceDocentMock label="AI 도슨트" />
          </div>
        </div>

        <h2 className={styles.title}>TRAVEL GUIDE</h2>

        <div className={styles.scroll}>
          {floor === 'overview' ? (
            <OverviewView heroIndex={heroIndex} onSelectFloor={selectFloor} />
          ) : (
            <FloorView floor={floor} />
          )}
        </div>

        <div className={styles.nav}>
          <div className={styles.navRow} role="group" aria-label="층 전환">
            <button
              type="button"
              aria-label="이전"
              disabled={atStart}
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
  )
}

function OverviewView({ heroIndex, onSelectFloor }) {
  const content = guideFloorContent.overview
  const hero = overviewHeroes[heroIndex] ?? overviewHeroes[0]

  return (
    <div>
      <div className={styles.introCard}>
        <div className={styles.introLines}>
          <p>{content.introLead}</p>
          <p>
            <span className={styles.introEm}>{content.introEmphasis}</span>
            {content.introTail}
          </p>
        </div>
        <p className={styles.introQuote}>“ {content.quote} ”</p>
        <img
          src={guideDecoTopImg}
          alt=""
          aria-hidden="true"
          className={styles.planeDecoTop}
        />
      </div>

      <div className={styles.overviewStage}>
        <img src={hero.src} alt={hero.alt} className={styles.overviewMain} />
        <img
          src={overviewFigureImg}
          alt=""
          aria-hidden="true"
          className={styles.overviewFigure}
        />

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
            <span key={line} style={{ display: 'block' }}>
              {line}
            </span>
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

export default GuidePage
