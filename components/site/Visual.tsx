const logLines = [
  { t: '04:11:02', w: 44 },
  { t: '04:11:06', w: 72 },
  { t: '04:11:09', w: 31 },
  { t: '04:12:41', w: 88, hit: true },
  { t: '04:12:43', w: 64, hit: true },
  { t: '04:13:17', w: 38 },
  { t: '04:13:55', w: 56 },
]

const hexRows = [
  { off: '0000', bytes: '45 00 00 3c 1c 46 40 00', ascii: 'E..<.F@.' },
  { off: '0008', bytes: '40 06 b1 e6 c0 a8 00 68', ascii: '@......h' },
  { off: '0010', bytes: 'c0 a8 00 01 00 50 1f 90', ascii: '.....P..' },
  { off: '0018', bytes: '47 45 54 20 2f 61 64 6d', ascii: 'GET /adm' },
  { off: '0020', bytes: '69 6e 2f 2e 2e 25 32 66', ascii: 'in/..%2f', hot: true },
  { off: '0028', bytes: '2e 2e 25 32 66 65 74 63', ascii: '..%2fetc', hot: true },
]

export function Visual({ kind }: { kind?: string | null }) {
  if (kind === 'log') {
    return (
      <div className="v-log" role="img" aria-label="로그 흐름 속에서 이상 징후 두 건이 경보로 올라온 모습">
        {logLines.map((line) => (
          <div className={line.hit ? 'line hit' : 'line'} key={line.t}>
            <time>{line.t}</time>
            <i style={{ width: `${line.w}%` }} />
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'trust') {
    return (
      <svg className="v-trust" viewBox="0 0 300 205" role="img" aria-label="모든 요청을 경계에서 다시 검증한 뒤 자원으로 보내는 구조">
        <rect x="92" y="18" width="192" height="169" fill="none" stroke="#17263b" strokeDasharray="3 4" opacity=".45" />
        <text x="99" y="33" fontSize="7.5" fill="#46618f" fontFamily="IBM Plex Mono, monospace">trust boundary</text>
        <rect x="14" y="60" width="38" height="17" fill="none" stroke="#17263b" />
        <rect x="14" y="94" width="38" height="17" fill="none" stroke="#17263b" />
        <rect x="14" y="128" width="38" height="17" fill="none" stroke="#17263b" />
        <g stroke="#17263b" strokeWidth="1" fill="none" opacity=".5">
          <path d="M52 68.5 H68 V103 H112" />
          <path d="M52 102.5 H112" />
          <path d="M52 136.5 H68 V103 H112" />
        </g>
        <rect x="112" y="84" width="24" height="38" fill="#0b1d4d" />
        <path d="M118.5 102.5 l4.5 5 l8.5 -11" fill="none" stroke="#c8dcff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="112" y="136" fontSize="7.5" fill="#46618f" fontFamily="IBM Plex Mono, monospace">verify</text>
        <g stroke="#1446c8" strokeWidth="1.4" fill="none">
          <path d="M136 103 H166" />
          <path d="M166 103 V77 H186" />
          <path d="M166 103 H186" />
          <path d="M166 103 V129 H186" />
        </g>
        <g fill="none" stroke="#17263b">
          <rect x="186" y="68" width="82" height="18" />
          <rect x="186" y="94" width="82" height="18" />
          <rect x="186" y="120" width="82" height="18" />
        </g>
      </svg>
    )
  }

  if (kind === 'hex') {
    return (
      <div className="v-hex" role="img" aria-label="헥스 덤프에서 경로 조작 시도가 드러난 구간">
        {hexRows.map((row) => (
          <div key={row.off}>
            <span className="off">{row.off}</span>
            <span className={row.hot ? 'hot' : undefined}>{row.bytes}</span>
            <span className="asc">{row.ascii}</span>
          </div>
        ))}
      </div>
    )
  }

  return <div className="v-blank" aria-hidden />
}

export default Visual
