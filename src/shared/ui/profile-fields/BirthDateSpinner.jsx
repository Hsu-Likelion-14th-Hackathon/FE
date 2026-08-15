import { useId, useMemo, useState } from 'react'

import styles from './BirthDateSpinner.module.scss'
import ScrollSelect from './ScrollSelect.jsx'

const MIN_YEAR = 1900

function getToday() {
  const now = new Date()

  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function toIsoDate({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  if (!match) return null

  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  if (date.month < 1 || date.month > 12) return null
  if (date.day < 1 || date.day > getDaysInMonth(date.year, date.month)) return null

  return date
}

function toNumber({ year, month, day }) {
  return year * 10_000 + month * 100 + day
}

function range(count, start = 1) {
  return Array.from({ length: count }, (_, index) => index + start)
}

/**
 * 생년월일을 연·월·일 세 칸으로 고른다.
 *
 * 달력(BirthDateField)은 회원가입처럼 화면을 다 쓰는 자리에 맞는다. 여권처럼
 * 아래에서 올라오는 시트에서는 여섯 주짜리 격자가 자리를 다 먹고, 스무 해 전을
 * 찾으려면 달을 수백 번 넘겨야 한다. 태어난 해는 목록에서 바로 고르는 편이 빠르다.
 *
 * @param {{ value: string, onChange: (value: string) => void }} props ISO(`2000-01-01`)
 */
export default function BirthDateSpinner({ value, onChange }) {
  const today = useMemo(() => getToday(), [])
  const selected = parseIsoDate(value)
  const reactId = useId()
  const labelId = `birth-spinner-${reactId.replaceAll(':', '')}-label`
  // 세 칸이 나란히 있어 하나가 열리면 나머지는 닫혀야 한다.
  const [openField, setOpenField] = useState(null)

  const yearOptions = useMemo(
    () =>
      Array.from({ length: today.year - MIN_YEAR + 1 }, (_, index) => today.year - index).map(
        (year) => ({ value: year, label: `${year}년` }),
      ),
    [today.year],
  )
  const monthOptions = useMemo(
    () => range(12).map((month) => ({ value: month, label: `${month}월` })),
    [],
  )
  // 2월을 고른 뒤 31일이 남아 있으면 없는 날짜를 고르게 된다.
  const dayCount = selected ? getDaysInMonth(selected.year, selected.month) : 31
  const dayOptions = useMemo(
    () => range(dayCount).map((day) => ({ value: day, label: `${day}일` })),
    [dayCount],
  )

  /** 세 칸 중 하나가 바뀌면 나머지를 붙여 온전한 날짜로 만든다. */
  const commit = (patch) => {
    const base = selected ?? { year: today.year, month: 1, day: 1 }
    const next = { ...base, ...patch }
    // 달이 짧아지면 날짜가 넘칠 수 있다. 3월 31일에서 2월로 옮기면 2월 31일이 된다.
    next.day = Math.min(next.day, getDaysInMonth(next.year, next.month))
    // 태어난 날이 오늘보다 뒤일 수는 없다.
    onChange(toIsoDate(toNumber(next) > toNumber(today) ? today : next))
  }

  const fieldProps = (name) => ({
    isOpen: openField === name,
    onOpenChange: (isOpen) => setOpenField(isOpen ? name : null),
  })

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.label} id={labelId}>
        <span>생년월일</span>
        <span className={styles.required} aria-hidden="true">
          *
        </span>
        <span className="sr-only">필수 입력</span>
      </span>

      <div className={styles.spinners}>
        <ScrollSelect
          label="연도"
          placeholder="연도"
          value={selected?.year ?? ''}
          options={yearOptions}
          onChange={(year) => commit({ year })}
          {...fieldProps('year')}
        />
        <ScrollSelect
          label="월"
          placeholder="월"
          value={selected?.month ?? ''}
          options={monthOptions}
          onChange={(month) => commit({ month })}
          {...fieldProps('month')}
        />
        <ScrollSelect
          label="일"
          placeholder="일"
          value={selected?.day ?? ''}
          options={dayOptions}
          onChange={(day) => commit({ day })}
          {...fieldProps('day')}
        />
      </div>

      <input type="hidden" name="birthDate" value={selected ? toIsoDate(selected) : ''} />
    </div>
  )
}
