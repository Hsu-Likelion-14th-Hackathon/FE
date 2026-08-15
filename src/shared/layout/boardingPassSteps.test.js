import { describe, expect, it } from 'vitest'

import {
  boardingPassStepProgress,
  BOARDING_PASS_STEP_COUNT,
  FLIGHT_STEP,
  guideFloorFromStep,
  guideFloorStep,
} from './boardingPassSteps.js'

describe('boardingPassSteps', () => {
  it('maps flight and guide floors onto a 6-step slider', () => {
    expect(BOARDING_PASS_STEP_COUNT).toBe(6)
    expect(guideFloorStep('overview')).toBe(2)
    expect(guideFloorStep('1f')).toBe(3)
    expect(guideFloorStep('5f')).toBe(6)
    expect(boardingPassStepProgress(FLIGHT_STEP)).toBeCloseTo(100 / 6)
    expect(boardingPassStepProgress(6)).toBe(100)
  })

  it('maps a slider step back to MAPS or a guide floor', () => {
    expect(guideFloorFromStep(1)).toBeNull()
    expect(guideFloorFromStep(2)).toBe('overview')
    expect(guideFloorFromStep(3)).toBe('1f')
    expect(guideFloorFromStep(6)).toBe('5f')
  })
})
