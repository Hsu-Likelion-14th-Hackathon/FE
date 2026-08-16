import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { PASS_STORAGE_KEY } from '@/features/boarding-pass/boarding-ticket/passStorage.js'
import IssueLoadingOverlay from '@/features/boarding-pass/issue-loading/IssueLoadingOverlay.jsx'
import { getSurveyQuestions, issueBoardingPass } from '@/shared/api/boardingPassApi.js'
import backArrow from '@/shared/assets/boarding-pass/icons/back-arrow.svg'
import qPlane from '@/shared/assets/boarding-pass/survey/q-plane.svg'
import revealBelowBrowserChrome from '@/shared/layout/revealBelowBrowserChrome.js'
import scrollDocumentToTop from '@/shared/layout/scrollDocumentToTop.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import StateNotice from '@/shared/ui/state-notice/StateNotice.jsx'

import styles from './SurveyPage.module.scss'

/**
 * 설문 (24)~(29) — 백엔드가 주는 문항으로 돈다(Q1~Q5 단일 선택 필수,
 * Q6 자유 입력 선택). 최종 제출 시 발급 로딩 오버레이(30)~(32) → complete.
 */

/** 문항 부제는 계약에 없는 디자인 카피다. 모든 문항이 같은 문구를 쓴다. */
const SURVEY_SUBTITLE = '고객님의 취향 분석을 위한 수속 절차를 진행하겠습니다'

export function Component() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  // 위시리스트·쇼핑백 데이터 활용 동의(BoardingPassIssueRequest.dataConsent).
  // 동의하지 않아도 발급된다 — 설문만으로 상품을 고를 뿐이다.
  const [dataConsent, setDataConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  // '다시 시도'가 올릴 때마다 문항 조회 effect가 다시 돈다.
  const [retryCount, setRetryCount] = useState(0)
  const scrollRef = useRef(null)
  const ctaRef = useRef(null)

  useLayoutEffect(() => {
    scrollDocumentToTop()
    scrollRef.current?.scrollTo?.(0, 0)
  }, [step, loading])

  useEffect(() => {
    let cancelled = false
    getSurveyQuestions()
      .then((data) => {
        if (!cancelled) setQuestions(data.questions ?? data ?? [])
      })
      .catch(() => {
        if (!cancelled) setLoadError('설문 문항을 불러오지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [retryCount])

  const retryLoad = () => {
    setLoadError(null)
    setRetryCount((count) => count + 1)
  }

  const question = questions[step]
  const answer = question ? answers[question.id] : null
  const isTextQuestion = question?.type === 'TEXT'
  // 선택 문항(TEXT·isRequired false)은 비워 두고도 넘어갈 수 있다.
  const canProceed = question
    ? isTextQuestion
      ? !question.isRequired || Boolean(String(answer ?? '').trim())
      : answer != null
    : false
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0
  const isLast = step >= questions.length - 1

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1)
      return
    }
    navigate('/boarding-pass/intro')
  }

  const handleSelect = (optionId) => {
    if (!question) return
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
    revealBelowBrowserChrome(ctaRef.current)
  }

  const handleNext = async () => {
    if (!question || !canProceed || loading) return

    if (!isLast) {
      setStep((s) => s + 1)
      return
    }

    // TEXT 문항은 surveyOptionId 대신 textAnswer를 싣는다. 빈 답은 null이다.
    const payload = questions.map((q) =>
      q.type === 'TEXT'
        ? {
            surveyQuestionId: q.id,
            surveyOptionId: null,
            textAnswer: String(answers[q.id] ?? '').trim() || null,
          }
        : { surveyQuestionId: q.id, surveyOptionId: answers[q.id] },
    )

    setLoading(true)
    try {
      const pass = await issueBoardingPass({ dataConsent, answers: payload })
      sessionStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(pass))
      navigate('/boarding-pass/complete', { state: { pass } })
    } catch (cause) {
      setLoading(false)
      // SURVEY_INCOMPLETE처럼 백엔드가 사유를 담아 준다. 그대로 보여 준다.
      setLoadError(cause.message ?? '보딩패스 발급에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <main className={`${styles.page}${loading ? ` ${styles.pageLoading}` : ''}`}>
      <StoreHeader />
      <hr className={styles.divider} />

      <div className={styles.progressRow}>
        <button type="button" aria-label="이전" onClick={handleBack} className={styles.backBtn}>
          <img src={backArrow} alt="" className={styles.backIcon} />
        </button>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.body}>
        <div ref={scrollRef} className={styles.scroll}>
          {loadError && !question ? (
            <StateNotice
              role="alert"
              eyebrow="Notice"
              message={loadError}
              hint="잠시 후 다시 시도해 주세요"
              action={{ label: '다시 시도', onClick: retryLoad }}
            />
          ) : question ? (
            <>
              <div className={styles.qLabel}>
                <img src={qPlane} alt="" aria-hidden="true" className={styles.qPlane} />
                <p className={styles.qText}>{question.label}</p>
              </div>

              <div className={styles.copy}>
                <h2 className={styles.title}>
                  <span className={styles.titleLine}>{question.title}</span>
                </h2>
                <p className={styles.description}>{SURVEY_SUBTITLE}</p>
              </div>

              {isTextQuestion ? (
                <textarea
                  className={styles.freeText}
                  aria-label={question.label}
                  maxLength={200}
                  placeholder="자유롭게 적어 주세요 (선택)"
                  rows={5}
                  value={answers[question.id] ?? ''}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                  }
                />
              ) : (
                <div className={styles.options} role="listbox" aria-label={question.label}>
                  {question.options.map((option) => {
                    const selected = answer === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => handleSelect(option.id)}
                        className={`${styles.option}${selected ? ` ${styles.optionSelected}` : ''}`}
                      >
                        <p className={styles.optionTitle}>{option.title}</p>
                        <p className={styles.optionDesc}>{option.description}</p>
                      </button>
                    )
                  })}
                </div>
              )}

              {loadError ? <p className={styles.error}>{loadError}</p> : null}
            </>
          ) : (
            <p className={styles.status}>설문을 불러오는 중…</p>
          )}
        </div>

        {question ? (
          <div className={styles.footer}>
            <div className={styles.footerBlur} aria-hidden="true" />
            {/* 발급 직전에만 묻는다. dataConsent가 false면 백엔드가 위시리스트·
                쇼핑백을 읽지 않는다. */}
            {isLast ? (
              <label className={styles.consent}>
                <input
                  type="checkbox"
                  checked={dataConsent}
                  onChange={(event) => setDataConsent(event.target.checked)}
                />
                <span>위시리스트·쇼핑백 정보를 추천에 활용하는 데 동의합니다 (선택)</span>
              </label>
            ) : null}
            <button
              ref={ctaRef}
              type="button"
              disabled={!canProceed || loading}
              onClick={handleNext}
              className={styles.cta}
            >
              계속하기
            </button>
          </div>
        ) : null}
      </div>

      {loading ? <IssueLoadingOverlay /> : null}
    </main>
  )
}
