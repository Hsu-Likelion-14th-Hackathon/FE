/**
 * 미동작 CTA 공통 컴포넌트.
 * deferredId는 local/plans/deferred-actions.md의 ID(D-01~D-07 등)를 사용한다.
 * 클릭해도 아무 동작도 하지 않는다 (navigate 금지 항목 포함).
 */
function DeferredButton({ deferredId, children, className = '', ...rest }) {
  return (
    <button type="button" data-deferred-id={deferredId} className={className} {...rest}>
      {children}
    </button>
  )
}

export default DeferredButton
