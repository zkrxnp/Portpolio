const logLines = [
  { t: '04:11:02', w: 44 },
  { t: '04:11:06', w: 72 },
  { t: '04:11:09', w: 31 },
  { t: '04:12:41', w: 88, hit: true },
  { t: '04:12:43', w: 64, hit: true },
  { t: '04:13:17', w: 38 },
  { t: '04:13:55', w: 56 },
]

// CVE-2025-32463: sudo -R 이 읽어 들이는, 공격자가 만든 chroot 안의 nsswitch.conf.
// 강조한 바이트가 libnss_/woot1337.so.2 를 root 권한으로 로드하게 만드는 항목입니다.
const hexRows = [
  { off: '0000', bytes: '70 61 73 73 77 64 3a 20', ascii: 'passwd: ' },
  { off: '0008', bytes: '2f 77 6f 6f 74 31 33 33', ascii: '/woot133', hot: true },
  { off: '0010', bytes: '37 0a 67 72 6f 75 70 3a', ascii: '7.group:', hot: true },
  { off: '0018', bytes: '20 66 69 6c 65 73 0a 73', ascii: ' files.s' },
  { off: '0020', bytes: '68 61 64 6f 77 3a 20 66', ascii: 'hadow: f' },
  { off: '0028', bytes: '69 6c 65 73 0a 68 6f 73', ascii: 'iles.hos' },
]

export function Visual({ kind }: { kind?: string | null }) {
  if (kind === 'log') {
    return (
      <div className="v-log" role="img" aria-label="파이프라인 로그 속에서 보안 검사가 두 건을 걸러낸 모습">
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
      <svg className="v-trust" viewBox="0 0 300 205" role="img" aria-label="모든 패키지를 경계에서 검증한 뒤에만 설치로 보내는 구조">
        <rect x="92" y="18" width="192" height="169" fill="none" stroke="#2b2152" strokeDasharray="3 4" opacity=".45" />
        <text x="99" y="33" fontSize="7.5" fill="#6a5a93" fontFamily="DM Mono, monospace">trust boundary</text>
        <rect x="14" y="60" width="38" height="17" fill="none" stroke="#2b2152" />
        <rect x="14" y="94" width="38" height="17" fill="none" stroke="#2b2152" />
        <rect x="14" y="128" width="38" height="17" fill="none" stroke="#2b2152" />
        <g stroke="#2b2152" strokeWidth="1" fill="none" opacity=".5">
          <path d="M52 68.5 H68 V103 H112" />
          <path d="M52 102.5 H112" />
          <path d="M52 136.5 H68 V103 H112" />
        </g>
        <rect x="112" y="84" width="24" height="38" fill="#1c1a62" />
        <path d="M118.5 102.5 l4.5 5 l8.5 -11" fill="none" stroke="#e6ddff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="112" y="136" fontSize="7.5" fill="#6a5a93" fontFamily="DM Mono, monospace">verify</text>
        <g stroke="#6d5dfc" strokeWidth="1.4" fill="none">
          <path d="M136 103 H166" />
          <path d="M166 103 V77 H186" />
          <path d="M166 103 H186" />
          <path d="M166 103 V129 H186" />
        </g>
        <g fill="none" stroke="#2b2152">
          <rect x="186" y="68" width="82" height="18" />
          <rect x="186" y="94" width="82" height="18" />
          <rect x="186" y="120" width="82" height="18" />
        </g>
      </svg>
    )
  }

  if (kind === 'hex') {
    return (
      <div className="v-hex" role="img" aria-label="chroot 안의 nsswitch.conf가 공격자 라이브러리를 가리키는 바이트">
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
