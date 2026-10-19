import Visual from './Visual'

/**
 * 프로젝트 대표 그림. 관리자가 thumbnail(이미지 경로)을 넣었으면 그 이미지를,
 * 없으면 기존 visual 그래픽을 씁니다. 경로는 저장 단계(zod)에서 / 또는 https만 통과합니다.
 */
export function ProjectArt({ thumbnail, visual, title }: { thumbnail?: string; visual: string; title: string }) {
  if (thumbnail) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="art-img" src={thumbnail} alt={`${title} 대표 이미지`} loading="lazy" decoding="async" />
  }
  return <Visual kind={visual} />
}

export default ProjectArt
