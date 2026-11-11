import { beforeEach, describe, expect, it } from 'vitest'

import { mockRespond, resetMockState } from './mockServer.js'

const call = (method, url, body) =>
  mockRespond({ method, url: `https://api.test${url}`, body, baseUrl: 'https://api.test' })

beforeEach(() => resetMockState())

describe('mockServer', () => {
  it('실서버와 같은 공통 래퍼로 감싼다', async () => {
    const response = await call('GET', '/surveys/questions')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ isSuccess: true, code: 'COMMON2000' })
    expect(response.body.result.questions.length).toBeGreaterThan(0)
  })

  it('발급 전에는 최근 보딩패스가 404, 발급 후에는 그 패스를 돌려준다', async () => {
    expect((await call('GET', '/boarding-passes/latest')).status).toBe(404)

    const issued = await call('POST', '/boarding-passes', { dataConsent: true, answers: [] })
    const latest = await call('GET', '/boarding-passes/latest')

    expect(latest.body.result.boardingPassId).toBe(issued.body.result.boardingPassId)
  })

  it('스캔 → 종료하면 크레딧과 여권 스탬프가 쌓인다', async () => {
    const pass = (await call('POST', '/boarding-passes', { dataConsent: false, answers: [] })).body
      .result
    const before = (await call('GET', '/passport')).body.result

    const scan = (await call('POST', `/boarding-passes/${pass.boardingPassId}/scan`)).body.result
    await call('POST', `/boarding-passes/${pass.boardingPassId}/complete`)
    const after = (await call('GET', '/passport')).body.result
    const visit = await call('GET', `/passport/visits/${scan.visitLogId}`)

    expect(after.creditBalance).toBe(before.creditBalance + scan.earnedCredit)
    expect(after.totalVisitCount).toBe(1)
    expect(visit.status).toBe(200)
  })

  it('위시리스트 담기·삭제가 이어지는 조회에 반영된다', async () => {
    await call('POST', '/wishlist', { productColorId: 51 })
    let ids = (await call('GET', '/wishlist')).body.result.items.map((item) => item.productColorId)
    expect(ids).toContain(51)

    await call('DELETE', '/wishlist/51')
    ids = (await call('GET', '/wishlist')).body.result.items.map((item) => item.productColorId)
    expect(ids).not.toContain(51)
  })

  it('base URL이 상대 경로(/backend)여도 경로를 찾는다', async () => {
    const response = await mockRespond({ url: '/backend/floors', baseUrl: '/backend' })
    expect(response.body.result.floors.length).toBeGreaterThan(0)
  })

  it('모르는 경로면 null — 호출부가 원래 오류를 올린다', async () => {
    expect(await call('GET', '/unknown')).toBeNull()
  })
})
