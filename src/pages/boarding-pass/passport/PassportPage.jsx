import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { PASSPORT_NAME_MAX_LENGTH, toPassportName } from '@/shared/lib/passportName.js'
import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import stageBack from '@/shared/assets/boarding-pass/landing/stage-back.svg'
import journeyDecoration from '@/shared/assets/boarding-pass/passport/journey-decoration.png'
import journeyTicket from '@/shared/assets/boarding-pass/passport/journey-ticket.png'
import journeyTicketMark from '@/shared/assets/boarding-pass/passport/journey-ticket-mark.png'
import mcmHaus from '@/shared/assets/boarding-pass/passport/mcm-haus.png'
import bowLeft from '@/shared/assets/boarding-pass/passport/passport-bow-left.png'
import bowRight from '@/shared/assets/boarding-pass/passport/passport-bow-right.png'
import coverMcm from '@/shared/assets/boarding-pass/passport/cover-mcm.png'
import coverPassport from '@/shared/assets/boarding-pass/passport/cover-passport.png'
import coverStar from '@/shared/assets/boarding-pass/passport/cover-star.png'
import passportCover from '@/shared/assets/boarding-pass/passport/passport-cover.png'
import passportEmblem from '@/shared/assets/boarding-pass/passport/passport-emblem.png'
import passportSpread from '@/shared/assets/boarding-pass/passport/passport-spread.png'
import passportStamp from '@/shared/assets/boarding-pass/passport/passport-stamp.webp'
import passportStampBow from '@/shared/assets/boarding-pass/passport/passport-stamp-bow.png'
import { usePassport } from '@/entities/passport/usePassport.js'
import { updateMe } from '@/shared/api/authApi.js'
import { getAccessToken } from '@/shared/api/authToken.js'
import { getFloor } from '@/shared/api/floorApi.js'
import { getBoardingPassRoute } from '@/shared/api/boardingPassApi.js'
import { getVisitDetail } from '@/shared/api/passportApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import {
  findCountryByStoredValue,
  getCountryOption,
} from '@/shared/ui/profile-fields/country-options.js'

import { passportTicket, passportVisit } from './passportData.js'
import styles from './PassportPage.module.scss'
import PassportPageTurn from './PassportPageTurn.jsx'

/*
 * 수정 칸은 시트를 열어야 보인다. 함께 묶으면 국가 223개 목록과 국기 CSS가
 * 여권 첫 화면에 딸려 와, 정작 급한 3D 지면이 늦게 뜬다.
 */
const BirthDateSpinner = lazy(() => import('@/shared/ui/profile-fields/BirthDateSpinner.jsx'))
const NationalitySelect = lazy(() => import('@/shared/ui/profile-fields/NationalitySelect.jsx'))

const sheetLabels = {
  profile: '여권 신분 정보 수정',
  history: '여행 기록',
  ticket: '탑승권',
}

/**
 * 표기명 한 줄.
 *
 * 백엔드는 name 한 필드로 주고, 연동 전 고정 데이터는 givenName/surname으로
 * 나뉘어 있다. 캔버스(drawProfile)와 같은 규칙을 써야 두 화면이 안 어긋난다.
 */
function toDisplayName(profile) {
  return profile?.name ?? `${profile?.givenName ?? ''} ${profile?.surname ?? ''}`.trim()
}

/**
 * 여권 지면 표기 ↔ API 표기.
 *
 * 지면은 Figma를 따라 `2000 01 01`로 그리지만, 백엔드와 달력 컴포넌트는 둘 다
 * ISO(`2000-01-01`)를 쓴다(UserUpdateRequest.birthDate). 두 표기가 섞이면 달력이
 * 값을 못 읽어 빈 채로 열린다.
 */
function toIsoBirthDate(display) {
  return String(display ?? '')
    .trim()
    .replaceAll(' ', '-')
}

function toDisplayBirthDate(iso) {
  return String(iso ?? '')
    .slice(0, 10)
    .replaceAll('-', ' ')
}

/**
 * 지면에 찍는 국적.
 *
 * 저장·전송은 백엔드 명세대로 alpha-2(`KR`)지만, 지면에는 실제 여권처럼
 * alpha-3(`KOR`)을 찍는다. 공식 국명을 쓰면 최대 46자
 * (`Independent and Sovereign Republic of Kiribati`)라 197px 행에서 절반이
 * 말줄임으로 사라진다.
 *
 * 모르는 값이 오면 지어내지 않고 받은 그대로 대문자로만 올린다. 빈 칸으로
 * 두면 백엔드가 무엇을 줬는지 화면에서 알 수 없다.
 */
function toDisplayNationality(stored) {
  const country = findCountryByStoredValue(stored)
  return country?.alpha3 ?? String(stored ?? '').toUpperCase()
}

/**
 * 눌러서 고칠 수 있는 신분 정보 한 줄.
 *
 * 캔버스가 글자를 그리고 이 DOM은 투명하다. 버튼이 보이지 않으니 눌러서 고칠 수
 * 있다는 걸 알 방법이 없어, 호버·포커스 때 글자 위에 표시를 얹는다.
 *
 * 호버와 포커스는 서로 독립이다. 하나로 합치면 키보드로 머문 채 마우스가
 * 스치기만 해도(pointerleave) 표시가 사라진다. 둘 다 풀렸을 때만 지운다.
 * 표시할 자리는 44px 클릭 영역이 아니라 실제 글자 상자다.
 */
function EditableRow({
  label,
  value,
  editLabel,
  cueLabel,
  isRestoringFocus,
  onNameHover,
  onEdit,
  resetKey,
  disabled = false,
}) {
  const active = useRef({ hover: false, focus: false })
  const sync = (event) => {
    const { hover, focus } = active.current
    onNameHover?.(hover || focus ? event.currentTarget.querySelector('strong') : null)
  }

  // 지면을 넘기거나 시트가 열리면 pointerleave 없이 버튼이 사라진다. 켜진 채
  // 남은 상태를 털지 않으면 돌아왔을 때 만진 적 없는 표시가 뜬다.
  useEffect(() => {
    active.current = { hover: false, focus: false }
  }, [resetKey])

  return (
    <p>
      {label}{' '}
      <button
        className={styles.nameButton}
        type="button"
        aria-label={editLabel}
        disabled={disabled}
        onPointerEnter={(event) => {
          active.current.hover = true
          sync(event)
        }}
        onPointerLeave={(event) => {
          active.current.hover = false
          sync(event)
        }}
        onFocus={(event) => {
          // 시트를 닫으면 초점이 여기로 돌아온다. 그건 사용자가 이 줄로 온 것이
          // 아니므로 표시를 켜지 않는다.
          if (isRestoringFocus?.()) return
          active.current.focus = true
          sync(event)
        }}
        onBlur={(event) => {
          active.current.focus = false
          sync(event)
        }}
        onClick={onEdit}
      >
        {/* 호버 표시가 이 글자 상자를 재고, 무엇을 고치는 줄인지도 여기서 읽는다. */}
        <strong data-cue-label={cueLabel}>{value}</strong>
      </button>
    </p>
  )
}

/**
 * 방문 동선에 AI 추천 표시를 얹는다.
 *
 * 방문 상세(travelHistory)에는 추천 여부가 없다. 그 방문의 보딩패스 동선
 * (GET /boarding-passes/{id}/route)에 층별 isRecommended·reason이 남아 있어
 * floorId로 맞춰 합친다. 동선 조회가 실패해도 기록 자체는 보여야 하므로
 * 그때는 표시 없이 그대로 돌려준다.
 */
async function withRouteBadges(detail) {
  if (!detail.boardingPassId) return detail
  try {
    const steps = await getBoardingPassRoute(detail.boardingPassId)
    const byFloor = new Map(steps.map((step) => [step.floorId, step]))
    return {
      ...detail,
      travelHistory: detail.travelHistory.map((floor) => {
        const step = byFloor.get(floor.floorId)
        if (!step?.isRecommended) return floor
        return { ...floor, isRecommended: true, reason: step.reason }
      }),
    }
  } catch {
    return detail
  }
}

export function Component() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [sheet, setSheet] = useState(null)
  // 여권 데이터는 페이지가 한 번 불러와 지면(PageTurn)과 시트가 나눠 쓴다.
  const passport = usePassport()
  // 여행 기록 면(마지막 면)은 스탬프를 눌러야 열린다. 어느 방문을 보는지가
  // 이 상태다. 고르기 전에는 그 면으로 넘길 수 없다(lastStep).
  const [visit, setVisit] = useState(null)

  const openVisit = (stamp) => {
    // 채움 스탬프(조회 실패 시)는 방문 번호가 없다. 채움 방문 상세로 연다.
    if (!stamp.visitLogId) {
      setVisit(passportVisit)
      setStep(3)
      return
    }
    getVisitDetail(stamp.visitLogId)
      .then(withRouteBadges)
      .then((detail) => {
        setVisit(detail)
        setStep(3)
      })
      .catch(() => {
        // 상세를 못 열면 스탬프 면에 머문다.
      })
  }
  // 신분 정보는 사용자가 직접 고칠 수 있다. 캔버스도 이 값으로 다시 굽는다.
  // 저장 형식은 PATCH /users/me(UserUpdateRequest)와 같은 { name, birthDate,
  // nationality }다. birthDate는 ISO, nationality는 `Republic of Korea` 표기다.
  const [profileEdit, setProfileEdit] = useState(null)
  const [nameDraft, setNameDraft] = useState('')
  const [birthDraft, setBirthDraft] = useState('')
  // NationalitySelect는 국가 코드를 다룬다. 저장할 때 API 표기로 옮긴다.
  const [countryDraft, setCountryDraft] = useState('')
  // 연·월·일·국적 목록은 한 번에 하나만 열린다. 겹치면 서로를 가리고,
  // 무엇이 열렸는지 시트가 알아야 Escape가 목록만 닫는다.
  const [openPicker, setOpenPicker] = useState(null)
  // 매 렌더 새 객체를 넘기면 텍스처를 통째로 다시 굽는다. 값이 바뀔 때만 바꾼다.
  const profileOverride = useMemo(() => {
    if (!profileEdit) return null
    return {
      name: profileEdit.name,
      birthDate: toDisplayBirthDate(profileEdit.birthDate),
      nationality: toDisplayNationality(profileEdit.nationality),
    }
  }, [profileEdit])
  // 한글은 ㅇ→아→안 처럼 조합을 거친다. 조합 중에 값을 바꾸면 IME가 되돌리므로
  // (모바일 키보드에서 특히) 조합이 끝난 뒤에 걸러낸다.
  const composingName = useRef(false)
  // 걸러낸 글자가 있을 때만 안내를 띄운다. 처음부터 보여주면 잔소리가 된다.
  const [nameRejected, setNameRejected] = useState(false)
  // 조합 중인 글자가 받을 수 없는 문자면 흐리게 보여 유효하지 않음을 드러낸다.
  const [nameBlocked, setNameBlocked] = useState(false)
  // PATCH /users/me 진행 상태. 실패하면 시트를 열어 둔 채 사유를 보여 준다.
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // 입력 경로가 onChange와 onCompositionEnd 둘이라 필터는 여기 하나로 모은다.
  const handleNameInput = (raw) => {
    if (composingName.current) {
      setNameDraft(raw)
      return
    }
    const next = toPassportName(raw)
    setNameRejected(next !== raw.toUpperCase())
    setNameDraft(next)
  }

  // 조합이 확정되기 전에도 받을 수 없는 글자면 바로 알린다.
  const handleNameComposing = (data) => {
    const blocked = Boolean(data) && toPassportName(data) !== data.toUpperCase()
    setNameBlocked(blocked)
    if (blocked) setNameRejected(true)
  }
  const dialogRef = useRef(null)
  const sheetTriggerRef = useRef(null)
  // 시트를 닫으며 초점을 트리거로 되돌리는 중인지. 그때 들어온 초점은 사용자가
  // 이름으로 옮겨 온 것이 아니라 우리가 돌려놓은 것이라, 수정 표시를 켜면
  // 손을 뗀 뒤에도 밑줄이 남는다.
  const restoringFocus = useRef(false)

  const openSheet = (nextSheet, trigger) => {
    if (!sheet) sheetTriggerRef.current = trigger
    setSheet(nextSheet)
  }
  const closeSheet = () => {
    setSheet(null)
    // 다시 열었을 때 지난 안내와 흐림이 남아 있으면 안 된다.
    setNameRejected(false)
    setNameBlocked(false)
    setSaveError(null)
    setOpenPicker(null)
    composingName.current = false
    restoringFocus.current = true
    requestAnimationFrame(() => {
      sheetTriggerRef.current?.focus()
      restoringFocus.current = false
    })
  }
  // 초점 잡기는 시트가 열릴 때 한 번뿐이다. 달력을 여닫을 때마다 다시 돌면
  // 초점이 첫 입력칸으로 끌려와 날짜를 고를 수가 없다.
  useEffect(() => {
    if (!sheet) return
    const dialog = dialogRef.current
    dialog.scrollTop = 0
    // 이름 수정처럼 입력이 있는 시트는 입력칸부터 잡아야 한다. 버튼을 먼저
    // 찾으면 저장 버튼에 초점이 가서 바로 칠 수가 없다.
    const initialFocus = dialog?.querySelector('input, button') ?? dialog
    initialFocus?.focus()
  }, [sheet])

  useEffect(() => {
    if (!sheet) return undefined
    const onKeyDown = (event) => {
      // 달력이나 국가 목록이 떠 있으면 그쪽이 먼저 Escape를 먹는다. 여기서도
      // 닫으면 시트까지 한 번에 사라져 고르던 값을 잃는다.
      if (event.key === 'Escape' && !openPicker) closeSheet()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openPicker, sheet])

  return (
    <div className={styles.page}>
      <div inert={sheet || undefined} className={sheet ? styles.dimmed : undefined}>
        <StoreHeader />
      </div>
      <section
        className={styles.stage}
        aria-labelledby="passport-title"
        style={{
          minHeight:
            'calc(var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top))',
        }}
      >
        <img src={stageBack} alt="" aria-hidden="true" className={styles.stageBack} />
        <div className={styles.footerFade} aria-hidden="true" />
        <button
          type="button"
          aria-label="닫기"
          onClick={() => (sheet ? closeSheet() : navigate('/boarding-pass'))}
          className={styles.close}
        >
          <img src={closeIcon} alt="" />
        </button>
        <div
          className={`${styles.content} ${sheet ? styles.dimmed : ''}`}
          inert={sheet || undefined}
        >
          <h2 id="passport-title" className={styles.srOnly}>
            MCM PASSPORT
          </h2>
          {/* 안내 두 줄은 랜딩에서 이미 읽은 문구다. 여기서는 여권 자체가
              주인공이라, 걷어낸 자리를 지면 크기로 돌려 글자를 키운다. */}
          <div className={styles.introCopy}>
            <p>MCM BOARDING PASS</p>
          </div>
          <PassportPageTurn
            step={step}
            disabled={Boolean(sheet)}
            passport={{ ...passport, visit }}
            lastStep={visit ? 3 : 2}
            profileOverride={profileOverride}
            onCommit={(direction) =>
              setStep((current) => Math.min(3, Math.max(0, current + direction)))
            }
            renderStep={(visibleStep, visibleProfile, visibleStamps, helpers) => (
              <PassportSpread
                step={visibleStep}
                sheetOpen={Boolean(sheet)}
                isRestoringFocus={() => restoringFocus.current}
                profile={visibleProfile}
                stamps={visibleStamps}
                visit={visit}
                onNameHover={helpers?.onNameHover}
                profileReady={helpers?.profileReady ?? true}
                // 세 칸이 한 시트를 함께 쓴다. 백엔드도 셋을 한 번에 받으므로
                // (UserUpdateRequest는 셋 다 필수) 어느 칸을 눌러도 같은 화면이다.
                onSelectStamp={openVisit}
                onEditProfile={(event) => {
                  setNameDraft(toDisplayName(visibleProfile))
                  setBirthDraft(toIsoBirthDate(visibleProfile?.birthDate))
                  setCountryDraft(findCountryByStoredValue(visibleProfile?.nationality)?.code ?? '')
                  setNameRejected(false)
                  setNameBlocked(false)
                  setOpenPicker(null)
                  composingName.current = false
                  openSheet('profile', event.currentTarget)
                }}
                onHistory={(event) => openSheet('history', event.currentTarget)}
                onTicket={(event) => openSheet('ticket', event.currentTarget)}
                onProducts={() => navigate('/products')}
              />
            )}
          />
        </div>
        {sheet ? (
          <div className={styles.sheetRoot}>
            <button
              type="button"
              aria-label="시트 배경 닫기"
              className={styles.scrim}
              onClick={closeSheet}
            />
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={sheetLabels[sheet]}
              tabIndex="-1"
              className={`${styles.sheet} ${styles[`sheet-${sheet}`]}`}
            >
              {sheet === 'history' ? <HistoryList visit={visit} /> : null}
              {sheet === 'profile' ? (
                <form
                  className={styles.nameForm}
                  onSubmit={(event) => {
                    event.preventDefault()
                    // 조합 중이면 아직 확정되지 않은 글자다. "홍GIL" 상태로 제출하면
                    // 영문만 남기고 시트가 닫혀, 사용자는 지운 적 없는 글자가
                    // 사라진 걸 보게 된다. 조합이 끝날 때까지 기다린다.
                    if (composingName.current) {
                      setNameRejected(true)
                      return
                    }
                    // 조합 중에는 원본을 그대로 담아 두므로 제출 시점에 한 번 더
                    // 거른다. 조합이 끝나기 전에 제출하면 한글이 그대로 들어간다.
                    const next = toPassportName(nameDraft).trim()
                    if (!next) {
                      setNameRejected(true)
                      return
                    }
                    // PATCH /users/me(UserUpdateRequest)와 같은 모양으로 담는다.
                    // birthDate는 ISO. 백엔드는 alpha-2를 받고, 지면 표기(alpha-3)
                    // 변환은 toDisplayNationality가 맡는다.
                    const body = {
                      name: next,
                      birthDate: birthDraft,
                      nationality: getCountryOption(countryDraft)?.code ?? '',
                    }

                    // 여권 라우트는 보호 구간이지만, 시트를 열어 둔 사이
                    // 401로 토큰이 지워졌을 수 있다. 보낼 곳이 없으면 지면
                    // 표기만 바꾼다.
                    if (!getAccessToken()) {
                      setProfileEdit(body)
                      closeSheet()
                      return
                    }

                    setSaving(true)
                    setSaveError(null)
                    updateMe(body)
                      .then(() => {
                        // 서버가 받아 준 값이므로 지면도 그 값으로 굽는다.
                        setProfileEdit(body)
                        closeSheet()
                      })
                      .catch((cause) => setSaveError(cause))
                      .finally(() => setSaving(false))
                  }}
                >
                  <h3 className={styles.sheetTitle}>신분 정보</h3>
                  <label className={styles.nameLabel} htmlFor="passport-name">
                    여권에 표기할 영문 이름
                  </label>
                  <input
                    className={`${styles.nameInput} ${nameBlocked ? styles.nameInputBlocked : ''}`}
                    id="passport-name"
                    aria-describedby="passport-name-hint"
                    value={nameDraft}
                    // 치는 즉시 여권 표기로 바꾼다. 영문·공백·하이픈·아포스트로피만
                    // 남고 소문자는 대문자로 올라간다.
                    onChange={(event) => handleNameInput(event.target.value)}
                    onCompositionStart={(event) => {
                      composingName.current = true
                      handleNameComposing(event.data)
                    }}
                    onCompositionUpdate={(event) => handleNameComposing(event.data)}
                    onCompositionEnd={(event) => {
                      composingName.current = false
                      setNameBlocked(false)
                      // compositionend 뒤에 input이 오지 않는 브라우저가 있어 여기서도 확정한다.
                      handleNameInput(event.target.value)
                    }}
                    // 여권 표기 한도. 이보다 길면 지면 밖으로 넘친다.
                    maxLength={PASSPORT_NAME_MAX_LENGTH}
                    autoCapitalize="characters"
                    autoComplete="off"
                    lang="en"
                  />
                  {nameRejected ? (
                    <p className={styles.nameNotice} id="passport-name-hint" role="status">
                      여권 표기에 맞춰 영문만 입력할 수 있습니다
                    </p>
                  ) : (
                    <p className={styles.srOnly} id="passport-name-hint">
                      여권 표기에 맞춰 영문 대문자로만 입력됩니다. 한글은 입력할 수 없습니다.
                    </p>
                  )}
                  {/* 달력은 여섯 주짜리 격자라 아래에서 올라오는 시트에 넣으면
                      자리를 다 먹는다. 태어난 해는 목록에서 바로 고르는 편이 빠르다. */}
                  <Suspense fallback={<p className={styles.fieldsLoading}>불러오는 중…</p>}>
                    <BirthDateSpinner
                      value={birthDraft}
                      onChange={setBirthDraft}
                      openField={openPicker?.startsWith('birth-') ? openPicker.slice(6) : null}
                      onOpenFieldChange={(field) => setOpenPicker(field ? `birth-${field}` : null)}
                    />
                    <NationalitySelect
                      value={countryDraft}
                      onChange={setCountryDraft}
                      isOpen={openPicker === 'nationality'}
                      onOpenChange={(isOpen) => setOpenPicker(isOpen ? 'nationality' : null)}
                    />
                  </Suspense>
                  {saveError ? (
                    <p className={styles.nameNotice} role="alert">
                      {saveError.message ?? '신분 정보를 저장하지 못했습니다.'}
                    </p>
                  ) : null}
                  <button className={styles.nameSubmit} type="submit" disabled={saving}>
                    {saving ? '저장 중…' : '저장'}
                  </button>
                </form>
              ) : null}
              {sheet === 'ticket' ? (
                <>
                  <h3 className={styles.sheetTitle}>TICKET</h3>
                  {/* 탑승자·패스 코드는 방문 상세의 실제 값으로 덮는다. 편명·시간
                      등 나머지는 방문 상세 계약에 없어 데모 티켓 표기를 쓴다. */}
                  <BoardingTicketCard
                    pass={{
                      ...passportTicket,
                      passengerName: visit?.passengerName || passportTicket.passengerName,
                      passCode: visit?.passCode || passportTicket.passCode,
                    }}
                    size="md"
                  />
                </>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}

/**
 * 여권 지면의 투명 오버레이.
 *
 * 여권 데이터는 페이지(usePassport)가 한 번 불러와 내려준다. 여기서 다시
 * 부르면 단계를 넘길 때마다 같은 API를 또 치게 된다.
 *
 * 모든 값은 캔버스와 같은 profile/stamps/visit에서 꺼낸다. 여기서 고정
 * 데이터를 쓰면 WebGL을 못 쓰는 기기와 스크린리더만 다른 값을 보게 된다.
 */
function PassportSpread({
  step,
  sheetOpen,
  isRestoringFocus,
  profile,
  stamps = [],
  visit,
  onNameHover,
  profileReady = true,
  onSelectStamp,
  onEditProfile,
  onHistory,
  onTicket,
  onProducts,
}) {
  const displayName = toDisplayName(profile)

  // 버튼이 손 밑에서 사라지는 두 경우가 있다. 지면을 넘기면 통째로 없어지고,
  // 시트가 열리면 inert가 되어 포인터 이벤트가 끊긴다. 둘 다 pointerleave가
  // 오지 않아 hover가 켜진 채 남고, 돌아왔을 때 만진 적 없는 표시가 뜬다.
  // 표시를 내리고, 각 줄도 제 상태를 턴다(resetKey).
  useEffect(() => {
    onNameHover?.(null)
  }, [onNameHover, sheetOpen, step])

  const resetKey = `${sheetOpen}|${step}`
  const editable = {
    isRestoringFocus,
    onNameHover,
    onEdit: onEditProfile,
    resetKey,
    // 조회 중에는 화면에 고정 데이터가 떠 있다. 그걸 초안으로 들고 저장하면
    // 뒤늦게 온 진짜 값이 고정 데이터로 덮인다. 도착할 때까지 못 누르게 한다.
    disabled: !profileReady,
  }

  if (step === 0) {
    return (
      <section
        data-passport-surface
        className={`${styles.passport} ${styles.coverPassport}`}
        aria-label="여권 표지"
      >
        <img src={passportCover} alt="" className={styles.passportImage} />
        <img src={coverMcm} alt="MCM" className={styles.coverMcm} />
        <img src={coverStar} alt="" className={styles.coverStar} />
        <img src={coverPassport} alt="PASSPORT" className={styles.coverPassportWord} />
        <img src={passportEmblem} alt="" className={styles.coverEmblem} />
        <img src={bowLeft} alt="" className={styles.coverBowLeft} />
        <img src={bowRight} alt="" className={styles.coverBowRight} />
      </section>
    )
  }

  if (step === 1) {
    return (
      <section
        data-passport-surface
        className={`${styles.passport} ${styles.openPassport}`}
        aria-label="여권 프로필"
      >
        <img
          src={passportSpread}
          alt=""
          className={`${styles.passportImage} ${styles.openPassportImage}`}
        />
        <div className={styles.profile}>
          <h3>PASSPORT</h3>
          <img src={mcmHaus} alt="MCM HAUS 매장 사진" className={styles.haus} />
          <p>
            NUMBER <strong>{profile.passportNumber}</strong>
          </p>
          {/* 백엔드가 셋을 한 번에 받으므로(UserUpdateRequest) 어느 줄을 눌러도
              같은 시트가 열린다. */}
          <EditableRow
            label="NATIONALITY"
            value={profile.nationality}
            editLabel={`국적 ${profile.nationality} 수정`}
            cueLabel="국적 수정"
            {...editable}
          />
          <EditableRow
            label="NAME"
            value={displayName}
            editLabel={`이름 ${displayName} 수정`}
            cueLabel="이름 수정"
            {...editable}
          />
          <EditableRow
            label="DATE OF BIRTH"
            value={profile?.birthDate}
            editLabel={`생년월일 ${profile?.birthDate ?? ''} 수정`}
            cueLabel="생년월일 수정"
            {...editable}
          />
          <p>
            DATE OF ISSUE <strong>{profile.issueDate}</strong>
          </p>
          <p>
            CREDIT <strong>{profile.credit}</strong>
          </p>
          <small className={styles.profileFooter}>
            <span>크레딧으로 AI 가상 피팅 가능</span>
            <button type="button" onClick={onProducts}>
              제품 보러가기
            </button>
          </small>
        </div>
      </section>
    )
  }

  if (step === 2) {
    return (
      <section
        data-passport-surface
        className={`${styles.passport} ${styles.openPassport}`}
        aria-label="여권 방문 스탬프"
      >
        <img
          src={passportSpread}
          alt=""
          className={`${styles.passportImage} ${styles.openPassportImage}`}
        />
        <div className={styles.stamps}>
          <h3>PASSPORT</h3>
          <p>총 방문 횟수 | {profile.visits}회</p>
          <img src={passportStampBow} alt="" className={styles.stampBow} />
          <ul>
            {/* 캔버스도 여섯 칸(3열 2행)만 그린다. 더 읽어 주면 화면과 어긋난다. */}
            {stamps.slice(0, 6).map((stamp) => (
              <li key={stamp.id ?? stamp.date}>
                {/* 스탬프를 눌러야 그 방문의 여행 기록 면이 열린다. */}
                <button
                  type="button"
                  aria-label={`${stamp.date} 방문 기록 보기`}
                  onClick={() => onSelectStamp?.(stamp)}
                >
                  {/* 캔버스와 같은 그림을 가리켜야 한다. 백엔드가 방문마다 다른
                      스탬프를 주면 여기도 따라간다. */}
                  <img src={stamp.imageUrl ?? passportStamp} alt="" />
                  <time>{stamp.date}</time>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section
      data-passport-surface
      className={`${styles.passport} ${styles.openPassport}`}
      aria-label="여권 여행 기록"
    >
      <img
        src={passportSpread}
        alt=""
        className={`${styles.passportImage} ${styles.openPassportImage}`}
      />
      <div role="img" aria-label="비행기와 탑승권" className={styles.journeyArtwork}>
        <span className={styles.journeyTile}>
          <img src={journeyDecoration} alt="" className={styles.journeyDecoration} />
        </span>
        <span className={styles.journeyTile}>
          <span className={styles.journeyTicketGroup}>
            <img src={journeyTicket} alt="" className={styles.journeyTicket} />
            <img src={journeyTicketMark} alt="" className={styles.journeyTicketMark} />
          </span>
        </span>
      </div>
      <h3 className={styles.journeyHeading}>PASSPORT</h3>
      <div className={styles.journeys}>
        <p>
          <time>{visit?.visitedOn}</time>
          <strong>{visit?.storeName}</strong>
          <span>{visit?.address}</span>
        </p>
        <p>
          <strong>
            {visit ? `입장 번호 ${visit.entryNo} | 비행 시간 ${visit.stayMinutes}M` : ''}
          </strong>
        </p>
        <div className={styles.journeyActions}>
          <button type="button" onClick={onHistory} className={styles.history}>
            TRAVEL HISTORY
          </button>
          <button
            type="button"
            onClick={onTicket}
            className={styles.history}
            aria-label="티켓 보기"
          >
            TICKET
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * TRAVEL HISTORY — 방문 동선(travelHistory)을 층 카드로 세운다.
 *
 * 카드는 전부 아코디언이다. 누르면 그 층의 이야기(GET /floors/{floorId}
 * contents)가 펼쳐지고, 다시 누르면 접힌다. 층 이야기는 처음 펼칠 때 받아
 * 캐시한다 — 시트를 닫으면 상태가 사라지므로 오래 들고 있지 않는다.
 */
function HistoryList({ visit }) {
  const all = visit?.travelHistory ?? []
  // 가이드와 같은 규칙 — AI 추천 층만 세운다. 추천 표시가 하나도 없으면
  // (동선 조회 실패 등) 기록 전체를 보여 준다.
  const recommendedOnly = all.filter((record) => record.isRecommended)
  const records = recommendedOnly.length ? recommendedOnly : all
  const [expandedId, setExpandedId] = useState(null)
  const [floorStories, setFloorStories] = useState({})

  const expanded = records.find((record) => record.id === expandedId)

  useEffect(() => {
    if (!expanded?.floorId || floorStories[expanded.floorId]) return undefined

    let alive = true
    const { floorId } = expanded
    getFloor(floorId)
      .then((data) => {
        if (alive) {
          setFloorStories((current) => ({
            ...current,
            [floorId]: { status: 'ready', contents: data.contents },
          }))
        }
      })
      .catch(() => {
        if (alive) setFloorStories((current) => ({ ...current, [floorId]: { status: 'error' } }))
      })

    return () => {
      alive = false
    }
  }, [expanded, floorStories])

  const toggle = (record) => {
    setExpandedId((current) => (current === record.id ? null : record.id))
    // 실패했던 층은 다시 펼칠 때 새로 받는다.
    setFloorStories((current) => {
      if (current[record.floorId]?.status !== 'error') return current
      const next = { ...current }
      delete next[record.floorId]
      return next
    })
  }

  return (
    <>
      <h3 className={styles.sheetTitle}>TRAVEL HISTORY</h3>
      <div className={styles.historyList}>
        {records.map((record) => {
          const isOpen = expandedId === record.id
          const story = floorStories[record.floorId]
          return (
            <div key={record.id} className={styles.historyItem}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-label={`${record.floorNo}F ${record.code} 상세 ${isOpen ? '접기' : '보기'}`}
                className={styles.historyCard}
                onClick={() => toggle(record)}
              >
                <JourneyCard record={record} />
              </button>
              {isOpen ? (
                <div className={styles.detailCopy}>
                  {record.reason ? <p className={styles.aiReason}>✦ {record.reason}</p> : null}
                  {story?.status === 'ready' ? (
                    <FloorStory contents={story.contents} />
                  ) : story?.status === 'error' ? (
                    <p>층 이야기를 불러오지 못했습니다. 다시 눌러 주세요.</p>
                  ) : (
                    <p>층 이야기를 불러오는 중…</p>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}

/** 층 상세 콘텐츠 블록. TEXT는 문단으로, 연이은 LIST는 한 목록으로 묶는다. */
function FloorStory({ contents }) {
  const rendered = []
  let listBuffer = []

  const flushList = (key) => {
    if (!listBuffer.length) return
    rendered.push(
      <ul key={key}>
        {listBuffer.map((block) => (
          <li key={block.orderNo}>{block.body}</li>
        ))}
      </ul>,
    )
    listBuffer = []
  }

  for (const block of contents) {
    if (block.blockType === 'LIST') {
      listBuffer.push(block)
      continue
    }
    flushList(`list-${block.orderNo}`)
    if (block.blockType === 'QUOTE') {
      rendered.push(<h4 key={block.orderNo}>{block.body}</h4>)
    } else if (block.body) {
      rendered.push(
        <div key={block.orderNo}>
          {block.body.split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>,
      )
    }
  }
  flushList('list-end')

  return <>{rendered}</>
}

function JourneyCard({ record }) {
  return (
    <span className={styles.journeyCardContent}>
      <span>
        {`${record.floorNo}F ${record.code} | ${record.title}`}
        {record.isRecommended ? (
          <span className={styles.aiPick} aria-label="AI 추천 층">
            ✦ AI
          </span>
        ) : null}
      </span>
      <strong>{record.tagline}</strong>
    </span>
  )
}
