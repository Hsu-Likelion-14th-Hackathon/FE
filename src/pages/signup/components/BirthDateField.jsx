import { useEffect, useId, useMemo, useRef, useState } from 'react'

import calendarIcon from '@/assets/icons/auth/calendar.svg'
import chevronMutedIcon from '@/assets/icons/auth/chevron-muted.svg'
import chevronOpenIcon from '@/assets/icons/auth/chevron-open.svg'
import chevronSelectedIcon from '@/assets/icons/auth/chevron-selected.svg'

import styles from './BirthDateField.module.scss'

const MIN_YEAR = 1900
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

function getToday() {
  const now = new Date()

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

function getDefaultBirthDate(today) {
  const year = Math.max(MIN_YEAR, today.year - 20)

  return {
    year,
    month: today.month,
    day: Math.min(today.day, getDaysInMonth(year, today.month)),
  }
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function toDateNumber({ year, month, day }) {
  return year * 10_000 + month * 100 + day
}

function toIsoDate({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const [, yearText, monthText, dayText] = match
  const date = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  }

  if (
    date.month < 1 ||
    date.month > 12 ||
    date.day < 1 ||
    date.day > getDaysInMonth(date.year, date.month)
  ) {
    return null
  }

  return date
}

function isWithinRange(date, today) {
  return date.year >= MIN_YEAR && toDateNumber(date) <= toDateNumber(today)
}

function clampDate(date, today) {
  const minimum = { year: MIN_YEAR, month: 1, day: 1 }

  if (toDateNumber(date) < toDateNumber(minimum)) {
    return minimum
  }

  if (toDateNumber(date) > toDateNumber(today)) {
    return today
  }

  return date
}

function changeMonth(date, monthDelta, today) {
  const nextMonth = new Date(date.year, date.month - 1 + monthDelta, 1)
  const year = nextMonth.getFullYear()
  const month = nextMonth.getMonth() + 1
  const day = Math.min(date.day, getDaysInMonth(year, month))

  return clampDate({ year, month, day }, today)
}

function changeDay(date, dayDelta, today) {
  const nextDate = new Date(date.year, date.month - 1, date.day + dayDelta)

  return clampDate(
    {
      year: nextDate.getFullYear(),
      month: nextDate.getMonth() + 1,
      day: nextDate.getDate(),
    },
    today,
  )
}

function formatDisplayDate(date) {
  return `${date.year}. ${String(date.month).padStart(2, '0')}. ${String(date.day).padStart(2, '0')}.`
}

function getCalendarWeeks(year, month) {
  const leadingCellCount = new Date(year, month - 1, 1).getDay()
  const dayCount = getDaysInMonth(year, month)
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leadingCellCount + 1

    return day >= 1 && day <= dayCount ? day : null
  })

  return Array.from({ length: 6 }, (_, weekIndex) => cells.slice(weekIndex * 7, weekIndex * 7 + 7))
}

/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export default function BirthDateField({ value, onChange, isOpen, onOpenChange }) {
  const today = useMemo(() => getToday(), [])
  const selectedDate = parseIsoDate(value)
  const validSelectedDate = selectedDate && isWithinRange(selectedDate, today) ? selectedDate : null
  const defaultBirthDate = useMemo(() => getDefaultBirthDate(today), [today])
  const initialDate = validSelectedDate ?? defaultBirthDate
  const [viewYear, setViewYear] = useState(initialDate.year)
  const [viewMonth, setViewMonth] = useState(initialDate.month)
  const [focusedDate, setFocusedDate] = useState(initialDate)
  const triggerRef = useRef(null)
  const dateButtonRefs = useRef(new Map())
  const shouldFocusDateRef = useRef(false)
  const reactId = useId()
  const idPrefix = `birth-date-${reactId.replaceAll(':', '')}`
  const labelId = `${idPrefix}-label`
  const valueId = `${idPrefix}-value`
  const dialogId = `${idPrefix}-dialog`
  const dialogTitleId = `${idPrefix}-dialog-title`
  const calendarLabelId = `${idPrefix}-calendar-label`
  const years = useMemo(
    () => Array.from({ length: today.year - MIN_YEAR + 1 }, (_, index) => today.year - index),
    [today.year],
  )
  const calendarWeeks = getCalendarWeeks(viewYear, viewMonth)
  const isFirstMonth = viewYear === MIN_YEAR && viewMonth === 1
  const isCurrentMonth = viewYear === today.year && viewMonth === today.month
  const displayValue = validSelectedDate ? formatDisplayDate(validSelectedDate) : ''

  useEffect(() => {
    if (!isOpen || !shouldFocusDateRef.current) {
      return
    }

    const focusedButton = dateButtonRefs.current.get(toIsoDate(focusedDate))

    if (focusedButton) {
      focusedButton.focus()
      shouldFocusDateRef.current = false
    }
  }, [focusedDate, isOpen, viewMonth, viewYear])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onOpenChange(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onOpenChange])

  const updateView = (nextDate, shouldFocusDate = false) => {
    setViewYear(nextDate.year)
    setViewMonth(nextDate.month)
    setFocusedDate(nextDate)
    shouldFocusDateRef.current = shouldFocusDate
  }

  const closeAndRestoreFocus = () => {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  const handleTriggerClick = () => {
    if (!isOpen) {
      const nextDate = validSelectedDate ?? defaultBirthDate
      updateView(nextDate, true)
    }

    onOpenChange(!isOpen)
  }

  const handleYearChange = (event) => {
    const year = Number(event.target.value)
    const month = year === today.year ? Math.min(viewMonth, today.month) : viewMonth
    const maximumDay = getDaysInMonth(year, month)
    const day = Math.min(focusedDate.day, maximumDay)

    updateView(clampDate({ year, month, day }, today))
  }

  const handleMonthChange = (event) => {
    const month = Number(event.target.value)
    const maximumDay = getDaysInMonth(viewYear, month)
    const day = Math.min(focusedDate.day, maximumDay)

    updateView(clampDate({ year: viewYear, month, day }, today))
  }

  const handleMonthMove = (monthDelta) => {
    updateView(changeMonth(focusedDate, monthDelta, today))
  }

  const handleDateSelect = (date) => {
    onChange(toIsoDate(date))
    closeAndRestoreFocus()
  }

  const handleDateKeyDown = (event, date) => {
    const keyActions = {
      ArrowLeft: () => changeDay(date, -1, today),
      ArrowRight: () => changeDay(date, 1, today),
      ArrowUp: () => changeDay(date, -7, today),
      ArrowDown: () => changeDay(date, 7, today),
      Home: () => changeDay(date, -new Date(date.year, date.month - 1, date.day).getDay(), today),
      End: () => changeDay(date, 6 - new Date(date.year, date.month - 1, date.day).getDay(), today),
      PageUp: () => changeMonth(date, event.shiftKey ? -12 : -1, today),
      PageDown: () => changeMonth(date, event.shiftKey ? 12 : 1, today),
    }
    const getNextDate = keyActions[event.key]

    if (!getNextDate) {
      return
    }

    event.preventDefault()
    updateView(getNextDate(), true)
  }

  const chevronIcon = isOpen
    ? chevronOpenIcon
    : validSelectedDate
      ? chevronSelectedIcon
      : chevronMutedIcon

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.label} id={labelId}>
        <span>생년월일</span>
        <span className={styles.required} aria-hidden="true">
          *
        </span>
        <span className="sr-only">필수 입력</span>
      </span>

      <button
        className={`${styles.trigger} ${isOpen || validSelectedDate ? styles.triggerActive : ''}`}
        ref={triggerRef}
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={handleTriggerClick}
      >
        <img className={styles.controlIcon} src={calendarIcon} alt="" aria-hidden="true" />
        <span
          className={displayValue ? styles.value : styles.placeholder}
          id={valueId}
          aria-live="polite"
        >
          {displayValue || '생년월일을 선택해 주세요'}
        </span>
        <img className={styles.chevron} src={chevronIcon} alt="" aria-hidden="true" />
      </button>

      <input type="hidden" name="birthDate" value={value} />

      {isOpen ? (
        <div className={styles.dialog} id={dialogId} role="dialog" aria-labelledby={dialogTitleId}>
          <h2 className="sr-only" id={dialogTitleId}>
            생년월일 선택
          </h2>

          <div className={styles.calendarHeader}>
            <button
              className={styles.monthButton}
              type="button"
              aria-label="이전 달"
              disabled={isFirstMonth}
              onClick={() => handleMonthMove(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div className={styles.selectGroup}>
              <select
                className={styles.select}
                aria-label="연도"
                value={viewYear}
                onChange={handleYearChange}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                aria-label="월"
                value={viewMonth}
                onChange={handleMonthChange}
              >
                {MONTHS.map((month) => (
                  <option
                    key={month}
                    value={month}
                    disabled={viewYear === today.year && month > today.month}
                  >
                    {month}월
                  </option>
                ))}
              </select>
            </div>

            <button
              className={styles.monthButton}
              type="button"
              aria-label="다음 달"
              disabled={isCurrentMonth}
              onClick={() => handleMonthMove(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <p className="sr-only" id={calendarLabelId} aria-live="polite">
            {viewYear}년 {viewMonth}월
          </p>

          <div className={styles.calendar} role="grid" aria-labelledby={calendarLabelId}>
            <div className={styles.week} role="row">
              {WEEKDAYS.map((weekday) => (
                <span className={styles.weekday} key={weekday} role="columnheader">
                  {weekday}
                </span>
              ))}
            </div>

            {calendarWeeks.map((week, weekIndex) => (
              <div className={styles.week} key={`${viewYear}-${viewMonth}-${weekIndex}`} role="row">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <span
                        className={styles.emptyCell}
                        key={`empty-${weekIndex}-${dayIndex}`}
                        role="gridcell"
                        aria-hidden="true"
                      />
                    )
                  }

                  const date = { year: viewYear, month: viewMonth, day }
                  const isoDate = toIsoDate(date)
                  const isSelected = validSelectedDate
                    ? isoDate === toIsoDate(validSelectedDate)
                    : false
                  const isToday = isoDate === toIsoDate(today)
                  const isFuture = toDateNumber(date) > toDateNumber(today)
                  const isFocused = isoDate === toIsoDate(focusedDate)

                  return (
                    <span
                      className={styles.dateCell}
                      key={isoDate}
                      role="gridcell"
                      aria-selected={isSelected}
                    >
                      <button
                        className={`${styles.dateButton} ${isSelected ? styles.dateButtonSelected : ''}`}
                        ref={(node) => {
                          if (node) {
                            dateButtonRefs.current.set(isoDate, node)
                          } else {
                            dateButtonRefs.current.delete(isoDate)
                          }
                        }}
                        type="button"
                        aria-label={`${date.year}년 ${date.month}월 ${date.day}일`}
                        aria-current={isToday ? 'date' : undefined}
                        disabled={isFuture}
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => handleDateSelect(date)}
                        onKeyDown={(event) => handleDateKeyDown(event, date)}
                      >
                        {day}
                      </button>
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
