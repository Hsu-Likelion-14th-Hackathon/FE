import QRCode from 'react-qr-code'

import barcodeImg from '@/shared/assets/boarding-pass/issue/barcode.png'
import planeRouteImg from '@/shared/assets/boarding-pass/issue/plane-route.svg'
import ticketLogoImg from '@/shared/assets/boarding-pass/intro/ticket-logo.png'

import TicketStamp from './TicketStamp.jsx'
import styles from './BoardingTicketCard.module.scss'

/**
 * 보딩패스 티켓 — Figma 532:6224.
 * 절취선 노치: 본문·스텁 모서리가 각각 호로 만나 첨점(V) — 단일 C 반원 아님.
 * API: 승객/클래스/항공편/게이트/탑승일/시각 + QR. 바코드만 정적.
 */
function BoardingTicketCard({ pass, className = '', size = 'md' }) {
  if (!pass) return null

  const compact = size === 'sm'
  const qrValue = String(pass.passCode || pass.qrData || pass.id || pass.boardingPassId || '')
  const fromCity = formatCity(pass.from?.city) || 'Seoul'
  const toCity = formatCity(pass.to?.city) || 'Munich'
  const fromLocal = pass.from?.localName || pass.from?.label || '서울'
  const toLocal = pass.to?.localName || pass.to?.label || 'MCM'
  const depart = pass.timeStart || pass.departureTime || '—'
  const arrive = pass.timeEnd || pass.arrivalTime || '—'
  const qrPx = compact ? 28 : 34

  return (
    <div className={`${styles.wrap} ${compact ? styles.wrapSm : ''} ${className}`.trim()}>
      <TicketStamp size={compact ? 'sm' : 'md'} />

      <article className={styles.card}>
        <div className={styles.topBar} aria-hidden="true" />

        <div className={styles.main}>
          <div className={styles.routeHeader}>
            <div className={styles.endpoint}>
              <span className={styles.city}>{fromCity}</span>
              <span className={styles.code}>{pass.from?.code ?? 'ICN'}</span>
              <span className={styles.local}>{fromLocal}</span>
            </div>

            <div className={styles.routeMid} aria-hidden="true">
              <img src={planeRouteImg} alt="" className={styles.plane} />
            </div>

            <div className={styles.endpoint}>
              <span className={styles.city}>{toCity}</span>
              <span className={styles.code}>{pass.to?.code ?? 'MUC'}</span>
              <span className={styles.local}>{toLocal}</span>
            </div>
          </div>

          <hr className={styles.divider} aria-hidden="true" />

          <div className={styles.fields}>
            <TicketField label="PASSENGER" value={pass.passengerName} />
            <TicketField label="CLASS" value={pass.cabinClass} align="end" />
            <TicketField label="FLIGHT" value={pass.flightCode} />
            <TicketField label="GATE" value={pass.gate} align="end" />
            <TicketField label="BOARDING" value={pass.boardingLabel} />
            <div className={`${styles.field} ${styles.fieldEnd}`}>
              <p className={styles.label}>TIME</p>
              <p className={styles.value}>{depart}</p>
              <p className={styles.value}>{arrive}</p>
            </div>
          </div>

          <img src={ticketLogoImg} alt="MCM" className={styles.mainLogo} />
        </div>

        <div className={styles.tear} aria-hidden="true">
          <span className={styles.tearLine} />
        </div>

        <div className={styles.stub}>
          <img src={barcodeImg} alt="" aria-hidden="true" className={styles.barcode} />
          <div className={styles.qr} aria-label="탑승권 QR 코드">
            {qrValue ? (
              <QRCode value={qrValue} size={qrPx} bgColor="#FFFFFF" fgColor="#191919" />
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}

function TicketField({ label, value, align = 'start' }) {
  return (
    <div className={`${styles.field} ${align === 'end' ? styles.fieldEnd : ''}`}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value ?? '—'}</p>
    </div>
  )
}

function formatCity(city) {
  if (!city) return ''
  const trimmed = String(city).trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default BoardingTicketCard
