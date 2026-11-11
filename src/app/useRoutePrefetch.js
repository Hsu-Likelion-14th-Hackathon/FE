import { useEffect } from 'react'
import { useLocation } from 'react-router'

import landingPlane from '@/shared/assets/boarding-pass/landing/plane.webp'
import introPassCard from '@/shared/assets/boarding-pass/intro/pass-card.webp'
import completeStageBack from '@/shared/assets/boarding-pass/complete/stage-back.webp'
import scanStageBack from '@/shared/assets/boarding-pass/scan/stage-back.webp'
import stageBg from '@/shared/assets/boarding-pass/stage-bg.webp'
import flightMap from '@/shared/assets/boarding-pass/flight/map.webp'
import flightTicketSheetBack from '@/shared/assets/boarding-pass/flight/ticket-sheet-back.webp'
import guideOverviewMain from '@/shared/assets/boarding-pass/guide/overview-main.webp'
import guideOverviewFigure from '@/shared/assets/boarding-pass/guide/overview-figure.webp'
import guideEmblemLaurel from '@/shared/assets/boarding-pass/guide/emblem-laurel.webp'

import {
  loadCompletePage,
  loadFlightPage,
  loadGuidePage,
  loadIntroPage,
  loadLandingPage,
  loadPassportPage,
  loadScanPage,
  loadSurveyPage,
} from './routeModules.js'

/**
 * 지금 화면에서 다음으로 갈 가능성이 큰 화면.
 *
 * 화면은 넘어가야 그 화면의 JS를 받고, 렌더된 뒤에야 이미지를 요청한다.
 * 보딩패스 여정은 순서가 정해져 있으니 지금 화면을 보는 동안 다음 화면의
 * 모듈과 큰 이미지를 미리 받아 둔다. 이미지는 첫 화면에 바로 보이는
 * 배경·히어로만 고른다 — 페이지가 import하는 전부를 받을 이유는 없다.
 */
export const ROUTE_PREFETCH = {
  '/': { modules: [loadLandingPage], images: [landingPlane] },
  // 랜딩에서 여권으로 바로 가는 사람은 적다. three.js(gzip 약 140KB)를
  // 모두에게 미리 받게 하지 않고, 여정 끝(비행·가이드)에서 받는다.
  '/boarding-pass': { modules: [loadIntroPage], images: [introPassCard] },
  '/boarding-pass/intro': { modules: [loadSurveyPage], images: [] },
  '/boarding-pass/survey': { modules: [loadCompletePage], images: [completeStageBack] },
  '/boarding-pass/complete': { modules: [loadScanPage], images: [scanStageBack] },
  '/boarding-pass/scan': {
    modules: [loadFlightPage],
    images: [stageBg, flightMap, flightTicketSheetBack],
  },
  '/boarding-pass/flight': {
    modules: [loadGuidePage, loadPassportPage],
    images: [guideOverviewMain, guideOverviewFigure, guideEmblemLaurel],
  },
  '/boarding-pass/guide': { modules: [loadPassportPage], images: [] },
}

/** 데이터 절약 모드나 2G에서는 쓰지 않을 수도 있는 것을 미리 받지 않는다. */
function shouldSkip() {
  const connection = typeof navigator === 'undefined' ? null : navigator.connection
  if (!connection) return false
  return connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? '')
}

function whenIdle(callback) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 3000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(callback, 1200)
  return () => window.clearTimeout(id)
}

/**
 * pathname에 해당하는 다음 화면을 받는다. 실패해도 조용히 넘긴다 —
 * 실제로 넘어갈 때 lazy가 다시 받으면서 원래 오류를 올린다.
 */
export function prefetchNextRoutes(pathname, { prefetch = ROUTE_PREFETCH, loadImage } = {}) {
  const entry = prefetch[pathname.replace(/\/+$/, '') || '/']
  if (!entry) return
  for (const load of entry.modules) load().catch(() => {})
  const load = loadImage ?? defaultLoadImage
  for (const src of entry.images) load(src)
}

function defaultLoadImage(src) {
  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.src = src
}

/** 화면이 바뀔 때마다, 브라우저가 한가해지면 다음 화면을 미리 받는다. */
export default function useRoutePrefetch() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 테스트는 화면 모듈을 직접 다룬다. 뒤에서 다른 화면을 불러오면
    // 타이밍에 민감한 테스트가 흔들린다.
    if (import.meta.env.MODE === 'test' || shouldSkip()) return undefined
    return whenIdle(() => prefetchNextRoutes(pathname))
  }, [pathname])
}
