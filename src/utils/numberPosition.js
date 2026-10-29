// 서버 server/extractProblems.js 의 findNumberPositionInGroup 포팅.
// area 편집 시 문제 번호 위치를 서버 호출 없이 로컬에서 재계산하기 위함.

function pickBest(list) {
  if (!list || list.length === 0) return null
  const sorted = [...list].sort((a, b) => b.y - a.y)
  const best = sorted[0]
  const constrainedWidth = Math.min(best.width || 20, (best.height || 10) * 2.5)
  return {
    x: best.x,
    y: best.y + (best.height || 10),
    height: best.height || 10,
    width: constrainedWidth,
  }
}

export function findNumberPositionInGroup(items) {
  if (!items || items.length === 0) return null

  // 1. 완벽한 패턴: "1.", "1)", "11." 등
  let candidates = items.filter((item) => {
    const t = (item.str || '').trim()
    const isPatternMatch =
      /^(\d+(?:\s*\d+)*)\s*[.)]/.test(t) ||
      /^(\d+(?:\s*\d+)*)\s*\.?\s*zb/i.test(t)
    const isBigEnough = (item.height || 0) >= 2
    return isPatternMatch && isBigEnough
  })

  // 2. 단독 숫자 폴백 ("9", "12" 등)
  if (candidates.length === 0) {
    candidates = items.filter((item) => {
      const t = (item.str || '').trim()
      return /^\d{1,2}$/.test(t) && (item.height || 0) >= 2
    })
  }

  const bestDirect = pickBest(candidates)
  if (bestDirect) return bestDirect

  // 3. 숫자 + 구두점 분리 복합 후보
  const LINE_EPS = 2.5
  const NEAR_X_EPS = 18

  const digitItems = items
    .filter((it) => it && typeof it.str === 'string' && /^\d{1,3}$/.test(it.str.trim()) && (it.height || 0) >= 2)
    .map((it) => ({ ...it, _t: it.str.trim() }))
  const punctItems = items
    .filter((it) => it && typeof it.str === 'string' && /^[).]$/.test(it.str.trim()) && (it.height || 0) >= 2)
    .map((it) => ({ ...it, _t: it.str.trim() }))

  const compoundCandidates = []
  for (const d of digitItems) {
    const p = punctItems.find(
      (pp) =>
        Math.abs(pp.y - d.y) <= LINE_EPS &&
        pp.x >= d.x &&
        pp.x <= d.x + (d.width || 0) + NEAR_X_EPS
    )
    if (!p) continue
    compoundCandidates.push({
      x: d.x,
      y: d.y,
      height: Math.max(d.height || 0, p.height || 0),
      width: Math.max((d.width || 0) + (p.width || 0), (p.x - d.x) + (p.width || 0)),
    })
  }

  return pickBest(compoundCandidates)
}

// 박스 단위로 텍스트를 모아 번호 위치를 추정.
// 인자:
//   problem: { coords: { areas: [...] }, page }
//   pageTextItems: { [pageNum]: TextItem[] }  (마진 없이 페이지 전체 텍스트)
//   pageConfig: { [pageNum]: { pdfWidth, pdfHeight } }
//   columnBounds: { left: { startX, endX }, right: { startX, endX } } | null
//     - 사용자가 정한 컬럼 가이드. 있으면 cross-column contamination 방지에 사용.
// 반환: {x, y, height, width} | null
export function computeNumberPositionForProblem(problem, pageTextItems, pageConfig, columnBounds) {
  if (!problem?.coords?.areas?.length || !pageTextItems) return null

  // 박스 윗변 부근에 있는 번호만 보고 싶음 (다른 문제 번호 오인 방지)
  const PADDING_Y_TOP = 20
  const PADDING_Y_BOTTOM = 30
  const COL_MARGIN = 2

  const collected = []
  for (const area of problem.coords.areas) {
    const pageNum = area.page ?? problem.page
    const items = pageTextItems[pageNum] ?? pageTextItems[String(pageNum)]
    if (!items?.length) continue
    const cfg = pageConfig?.[pageNum] ?? pageConfig?.[String(pageNum)]
    const pageWidth = cfg?.pdfWidth ?? 595.2
    const pageHeight = cfg?.pdfHeight ?? 841.92

    // X 검색 범위: columnBounds가 있으면 그대로 사용, 없으면 midX 폴백.
    let searchMinX, searchMaxX
    const midX = pageWidth / 2
    const isLeftColumn = area.topLeft.x < midX
    if (columnBounds?.left && columnBounds?.right) {
      if (isLeftColumn) {
        searchMinX = Math.max(0, columnBounds.left.startX - COL_MARGIN)
        searchMaxX = columnBounds.left.endX + COL_MARGIN
      } else {
        searchMinX = columnBounds.right.startX - COL_MARGIN
        searchMaxX = Math.min(pageWidth, columnBounds.right.endX + COL_MARGIN)
      }
    } else {
      searchMinX = isLeftColumn ? 0 : midX - 10
      searchMaxX = isLeftColumn ? midX + 10 : pageWidth
    }

    for (const item of items) {
      const textStartX = item.x
      const textY = pageHeight - item.y // PDF 상단 기준 좌표로 변환
      if (
        textStartX >= searchMinX &&
        textStartX <= searchMaxX &&
        textY >= area.topLeft.y - PADDING_Y_TOP &&
        textY <= area.topLeft.y + PADDING_Y_BOTTOM
      ) {
        collected.push(item)
      }
    }
  }

  return findNumberPositionInGroup(collected)
}
