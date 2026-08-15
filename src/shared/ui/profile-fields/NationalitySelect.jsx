import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import 'country-flag-icons/3x2/flags.css'

import chevronMutedIcon from '@/assets/icons/auth/chevron-muted.svg'
import chevronOpenIcon from '@/assets/icons/auth/chevron-open.svg'
import chevronSelectedIcon from '@/assets/icons/auth/chevron-selected.svg'
import mapPinActiveIcon from '@/assets/icons/auth/map-pin-active.svg'
import mapPinMutedIcon from '@/assets/icons/auth/map-pin-muted.svg'

import { countryOptions, getCountryOption } from './country-options.js'
import styles from './NationalitySelect.module.scss'

/**
 * 목록 맨 위에 고정할 국가.
 *
 * 250개를 알파벳순으로 훑게 두면 대한민국을 고르는 데도 한참 걸린다. MCM HAUS를
 * 찾는 사람 대부분은 이 여섯 중 하나라 위로 올려 한 번에 끝나게 한다.
 * 검색을 시작하면 이 구분은 사라지고 결과만 남는다.
 */
const PINNED_CODES = ['KR', 'JP', 'US', 'CN', 'FR', 'DE']

const pinnedCountries = PINNED_CODES.map((code) => getCountryOption(code)).filter(Boolean)
const restCountries = countryOptions.filter((country) => !PINNED_CODES.includes(country.code))
/** 검색 전 기본 순서. 하나의 평평한 배열이라 위아래 이동은 두 묶음을 그냥 넘나든다. */
const defaultCountries = [...pinnedCountries, ...restCountries]

function normalizeSearchText(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function CountryName({ country, className, id }) {
  const hasAccessibleLabel = Boolean(id)

  return (
    <span className={className} id={id} aria-live={id ? 'polite' : undefined}>
      {hasAccessibleLabel ? (
        <span className="sr-only">
          {country.nativeName} ({country.englishName})
        </span>
      ) : null}
      <span className={styles.nativeName} dir="auto" aria-hidden={hasAccessibleLabel || undefined}>
        {country.nativeName}
      </span>
      <span className={styles.englishName} dir="ltr" aria-hidden={hasAccessibleLabel || undefined}>
        {' '}
        ({country.englishName})
      </span>
    </span>
  )
}

export default function NationalitySelect({ value, onChange, isOpen, onOpenChange }) {
  const generatedId = useId()
  const fieldId = `nationality-${generatedId}`
  const labelId = `${fieldId}-label`
  const valueId = `${fieldId}-value`
  const listboxId = `${fieldId}-options`
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const optionRefs = useRef([])
  const focusOptionOnOpenRef = useRef(false)
  const initialFocusIndexRef = useRef(0)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedCountry = getCountryOption(value)
  const pinnedCount = pinnedCountries.length

  const filteredCountries = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query)

    if (!normalizedQuery) {
      return defaultCountries
    }

    return countryOptions.filter((country) => {
      const searchableText = normalizeSearchText(
        `${country.code} ${country.nativeName} ${country.englishName} ${country.apiValue} ${country.koreanName}`,
      )

      return searchableText.includes(normalizedQuery)
    })
  }, [query])

  const displayedCountry =
    selectedCountry ?? (isOpen ? (filteredCountries[activeIndex] ?? null) : null)

  const closeList = useCallback(
    ({ restoreFocus = false } = {}) => {
      setQuery('')
      onOpenChange(false)

      if (restoreFocus) {
        triggerRef.current?.focus()
      }
    },
    [onOpenChange],
  )

  const openList = ({ focusOption = false, index } = {}) => {
    // 열 때는 검색이 비므로 기준도 기본 순서다. countryOptions로 재면 자주 찾는
    // 국가를 위로 올린 만큼 초점이 엉뚱한 줄에 간다.
    const selectedIndex = defaultCountries.findIndex(
      (country) => country.code === selectedCountry?.code,
    )
    const nextIndex = index ?? Math.max(selectedIndex, 0)

    setQuery('')
    setActiveIndex(nextIndex)
    initialFocusIndexRef.current = nextIndex
    focusOptionOnOpenRef.current = focusOption
    onOpenChange(true)
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    if (focusOptionOnOpenRef.current) {
      optionRefs.current[initialFocusIndexRef.current]?.focus()
    } else {
      searchRef.current?.focus()
    }

    focusOptionOnOpenRef.current = false

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        closeList()
      }
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      closeList({ restoreFocus: true })
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeList, isOpen])

  const focusOption = (index) => {
    if (filteredCountries.length === 0) {
      return
    }

    const nextIndex = (index + filteredCountries.length) % filteredCountries.length
    setActiveIndex(nextIndex)
    optionRefs.current[nextIndex]?.focus()
  }

  const handleTriggerClick = () => {
    if (isOpen) {
      closeList()
      return
    }

    openList()
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const selectedIndex = defaultCountries.findIndex(
      (country) => country.code === selectedCountry?.code,
    )
    const index = event.key === 'ArrowUp' ? defaultCountries.length - 1 : Math.max(selectedIndex, 0)

    if (isOpen) {
      focusOption(index)
      return
    }

    openList({ focusOption: true, index })
  }

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
    setActiveIndex(0)
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(activeIndex)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(filteredCountries.length - 1)
    }
  }

  const handleOptionKeyDown = (event, index) => {
    const keyActions = {
      ArrowDown: () => focusOption(index + 1),
      ArrowUp: () => focusOption(index - 1),
      Home: () => focusOption(0),
      End: () => focusOption(filteredCountries.length - 1),
    }
    const action = keyActions[event.key]

    if (!action) {
      return
    }

    event.preventDefault()
    action()
  }

  const handleCountrySelect = (country) => {
    onChange(country.code)
    closeList({ restoreFocus: true })
  }

  const countryChevron = isOpen
    ? chevronOpenIcon
    : selectedCountry
      ? chevronSelectedIcon
      : chevronMutedIcon

  return (
    <div className={styles.field} ref={rootRef}>
      <label className={styles.label} id={labelId} htmlFor={fieldId}>
        <span>국적</span>
        <span className={styles.required} aria-hidden="true">
          *
        </span>
        <span className="sr-only">필수 입력</span>
      </label>

      <button
        className={`${styles.trigger} ${isOpen || selectedCountry ? styles.triggerActive : ''}`}
        id={fieldId}
        ref={triggerRef}
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        {displayedCountry ? (
          <span
            className={`${styles.flag} flag:${displayedCountry.code}`}
            role="img"
            aria-label={`${displayedCountry.englishName} 국기`}
          />
        ) : (
          <img
            className={styles.controlIcon}
            src={isOpen ? mapPinActiveIcon : mapPinMutedIcon}
            alt=""
            aria-hidden="true"
          />
        )}
        {displayedCountry ? (
          <CountryName country={displayedCountry} className={styles.value} id={valueId} />
        ) : (
          <span className={styles.placeholder} id={valueId} aria-live="polite">
            국적을 선택해 주세요
          </span>
        )}
        <img className={styles.chevron} src={countryChevron} alt="" aria-hidden="true" />
      </button>

      {/* 백엔드는 ISO 3166-1 alpha-2를 받는다(추가 정보 입력·회원정보 수정 명세의
          `예: KR`). 여권 지면이 alpha-3으로 그리는 것은 표시 단계의 변환이다. */}
      <input type="hidden" name="nationality" value={selectedCountry?.code ?? ''} />

      {isOpen ? (
        <div className={styles.panel}>
          <div className={styles.searchShell}>
            <input
              className={styles.searchInput}
              ref={searchRef}
              type="search"
              value={query}
              autoComplete="off"
              spellCheck="false"
              aria-label="국가 검색"
              placeholder="국가 이름 또는 국가 코드 검색"
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div className={styles.options} id={listboxId} role="listbox" aria-label="국적 선택">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => {
                const isSelected = country.code === selectedCountry?.code
                const isActive = index === activeIndex

                return (
                  <Fragment key={country.code}>
                    {/* 고정 묶음과 전체 목록의 경계. 검색 중에는 순서가 하나뿐이라
                        머리말을 붙이지 않는다. 화면에서는 구분선 겸 이름표다. */}
                    {!query && index === 0 ? (
                      <p className={styles.groupLabel} role="presentation">
                        자주 찾는 국가
                      </p>
                    ) : null}
                    {!query && index === pinnedCount ? (
                      <p className={styles.groupLabel} role="presentation">
                        전체 국가
                      </p>
                    ) : null}
                    <button
                      className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isActive ? styles.optionActive : ''}`}
                      ref={(element) => {
                        optionRefs.current[index] = element
                      }}
                      type="button"
                      role="option"
                      tabIndex={isActive ? 0 : -1}
                      aria-label={`${country.nativeName} (${country.englishName})`}
                      aria-selected={isSelected}
                      onClick={() => handleCountrySelect(country)}
                      onFocus={() => setActiveIndex(index)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      onPointerMove={() => setActiveIndex(index)}
                    >
                      <span
                        className={`${styles.optionFlag} flag:${country.code}`}
                        aria-hidden="true"
                      />
                      <CountryName country={country} className={styles.optionName} />
                    </button>
                  </Fragment>
                )
              })
            ) : (
              <p className={styles.emptyState} role="status">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
