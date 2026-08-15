/** 하단 슬라이더 1~6: MAPS → 가이드 개요 → 1F → 2F → 3F → 5F */
export const BOARDING_PASS_STEP_COUNT = 6

export const GUIDE_FLOOR_ORDER = ['overview', '1f', '2f', '3f', '5f']

export const FLIGHT_STEP = 1

export const BOARDING_PASS_STEP_LABELS = ['MAPS', '가이드 개요', '1F', '2F', '3F', '5F']

export function boardingPassStepProgress(step) {
  return (step / BOARDING_PASS_STEP_COUNT) * 100
}

export function guideFloorStep(floor) {
  const floorIndex = GUIDE_FLOOR_ORDER.indexOf(floor)
  return floorIndex >= 0 ? FLIGHT_STEP + 1 + floorIndex : FLIGHT_STEP + 1
}

/** 1=MAPS, 2~6=가이드. MAPS면 null */
export function guideFloorFromStep(step) {
  if (step <= FLIGHT_STEP) return null
  return GUIDE_FLOOR_ORDER[step - FLIGHT_STEP - 1] ?? null
}
