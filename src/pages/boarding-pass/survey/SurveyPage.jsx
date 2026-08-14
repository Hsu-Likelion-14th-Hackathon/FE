import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { PASS_STORAGE_KEY } from '@/features/boarding-pass/boarding-ticket/passStorage.js'
import IssueLoadingOverlay from '@/features/boarding-pass/issue-loading/IssueLoadingOverlay.jsx'
import { getSurveyQuestions, issueBoardingPass } from '@/shared/api/boardingPassApi.js'
import backArrow from '@/shared/assets/boarding-pass/icons/back-arrow.svg'
import qPlane from '@/shared/assets/boarding-pass/survey/q-plane.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './SurveyPage.module.scss'

function scrollDocumentToTop() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  document.querySelector('[data-device-screen]')?.firstElementChild?.scrollTo?.(0, 0)
}

/**
 * 설문 Q1~Q3 (24)~(29).
 * 최종 제출 시 발급 로딩 오버레이(30)~(32) → complete 이동.
 */
export function Component() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useLayoutEffect(() => {
    scrollDocumentToTop()
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
  }, [])

  const question = questions[step]
  const selectedOptionId = question ? answers[question.id] : null
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0
  const isLast = step >= questions.length - 1

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1)
      return
    }
    navigate('/boarding-pass')
  }

  const handleSelect = (optionId) => {
    if (!question) return
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  const handleNext = async () => {
    if (!question || selectedOptionId == null || loading) return

    if (!isLast) {
      setStep((s) => s + 1)
      return
    }

    const payload = questions.map((q) => ({
      surveyQuestionId: q.id,
      surveyOptionId: answers[q.id],
    }))

    setLoading(true)
    try {
      const pass = await issueBoardingPass(payload)
      sessionStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(pass))
      navigate('/boarding-pass/complete', { state: { pass } })
    } catch {
      setLoading(false)
      setLoadError('보딩패스 발급에 실패했습니다. 다시 시도해 주세요.')
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
        <div className={styles.scroll}>
          {loadError && !question ? (
            <p className={styles.status}>{loadError}</p>
          ) : question ? (
            <>
              <div className={styles.qLabel}>
                <img src={qPlane} alt="" aria-hidden="true" className={styles.qPlane} />
                <p className={styles.qText}>{question.label}</p>
              </div>

              <div className={styles.copy}>
                <h2 className={styles.title}>
                  {question.titleLines.map((line) => (
                    <span key={line} className={styles.titleLine}>
                      {line}
                    </span>
                  ))}
                </h2>
                <p className={styles.description}>{question.description}</p>
              </div>

              <div className={styles.options} role="listbox" aria-label={question.label}>
                {question.options.map((option) => {
                  const selected = selectedOptionId === option.id
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

              {loadError ? <p className={styles.error}>{loadError}</p> : null}
            </>
          ) : (
            <p className={styles.status}>설문을 불러오는 중…</p>
          )}
        </div>

        {question ? (
          <div className={styles.footer}>
            <button
              type="button"
              disabled={selectedOptionId == null || loading}
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
