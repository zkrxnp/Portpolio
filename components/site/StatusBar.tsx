/** 옵시디언 오른쪽 아래 상태 표시줄처럼, 문서의 단어·글자·연결 수를 보여줍니다. */
export function StatusBar({ items }: { items: string[] }) {
  return (
    <p className="statusbar num" aria-label="문서 정보">
      {items.map((t) => <span key={t}>{t}</span>)}
    </p>
  )
}

export default StatusBar
