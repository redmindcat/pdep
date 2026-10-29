/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import chaJo from '../assets/cha_jo.png'
import { computeNumberPositionForProblem } from '../utils/numberPosition'
import { API_BASE_URL } from '../config'

const PDF_WIDTH = 595
const CHOICE_VISUAL_OFFSET_X = 1
const CHOICE_VISUAL_OFFSET_Y = 2

const Icon = {
	Close: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>),
	Check: () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5 5.5-7"/></svg>),
	Plus: () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="12" height="12" rx="1.5" strokeDasharray="2.4 1.8"/><path d="M7.5 4.5v6M4.5 7.5h6"/></svg>),
	Refresh: ({ spin = false } = {}) => (<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" className={spin ? 'pdf-spin' : undefined}><path d="M482-160q-134 0-228-93t-94-227v-7l-64 64-56-56 160-160 160 160-56 56-64-64v7q0 100 70.5 170T482-240q26 0 51-6t49-18l60 60q-38 22-78 33t-82 11Zm278-161L600-481l56-56 64 64v-7q0-100-70.5-170T478-720q-26 0-51 6t-49 18l-60-60q38-22 78-33t82-11q134 0 228 93t94 227v7l64-64 56 56-160 160Z"/></svg>),
	Number: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5h8M7 2.5v9M5 11.5h4"/></svg>),
	Merge: () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="8" height="8" rx="1.2" strokeDasharray="2.3 1.6"/><rect x="6" y="1" width="8" height="8" rx="1.2" strokeDasharray="2.3 1.6"/></svg>),
	Trash: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M3.5 4l.8 7.5h5.4L10.5 4"/></svg>),
	ChevronLeft: () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2L4 6l4 4"/></svg>),
	ChevronRight: () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 4-4 4"/></svg>),
}

function sortProblemsByDisplayOrder(problems, pageConfig, movedProblem) {
	if (!problems?.length) return problems
	const getPdfWidth = (page) => pageConfig?.[page]?.pdfWidth ?? pageConfig?.[String(page)]?.pdfWidth ?? PDF_WIDTH
	return [...problems].sort((a, b) => {
		if (a.page !== b.page) return a.page - b.page
		const w = getPdfWidth(a.page)
		const aX = a.coords?.areas?.[0]?.topLeft?.x ?? 0
		const bX = b.coords?.areas?.[0]?.topLeft?.x ?? 0
		const aCol = aX < w / 2 ? 0 : 1
		const bCol = bX < w / 2 ? 0 : 1
		if (aCol !== bCol) return aCol - bCol
		const aY = a.coords?.areas?.[0]?.topLeft?.y ?? 0
		const bY = b.coords?.areas?.[0]?.topLeft?.y ?? 0
		if (aY !== bY) return aY - bY
		if (movedProblem) {
			if (a === movedProblem) return -1
			if (b === movedProblem) return 1
		}
		return 0
	})
}

function isSymbolInsideArea(symbol, area, problemPage) {
	const symbolPage = symbol.page ?? problemPage
	const areaPage = area.page ?? problemPage
	const margin = 2
	const centerX = Number(symbol.x ?? 0)
	const centerY = Number(symbol.y ?? 0)
	return (
		symbolPage === areaPage &&
		centerX >= area.topLeft.x - margin &&
		centerX <= area.bottomRight.x + margin &&
		centerY >= area.topLeft.y - margin &&
		centerY <= area.bottomRight.y + margin
	)
}

const CHOICE_PATTERN = /^[①②③④⑤\u2460-\u2464](?:\s|$|[가-힣ㄱ-ㅎ])|^[1-5]\s*[)]$/

function isChoiceSymbol(symbol) {
	if (!symbol) return false
	const type = symbol.type || symbol.kind
	if (type !== 'text') return false
	const height = Number(symbol.height ?? 0)
	if (!(height >= 2 && height <= 30)) return false
	const text = String(symbol.text ?? symbol.str ?? '').trim()
	return CHOICE_PATTERN.test(text)
}

function getPageSymbols(pageSymbolsMap, page) {
	const pageSymbols = pageSymbolsMap?.[page] || pageSymbolsMap?.[String(page)] || []
	if (!Array.isArray(pageSymbols)) return []
	return pageSymbols.map((symbol) => ({ ...symbol, page: symbol.page ?? page }))
}

function getChoiceSymbolKey(symbol, fallbackPage) {
	const page = symbol.page ?? fallbackPage ?? 0
	const x = Number(symbol.x ?? 0).toFixed(2)
	const y = Number(symbol.y ?? 0).toFixed(2)
	const width = Number(symbol.width ?? symbol.height ?? 0).toFixed(2)
	const height = Number(symbol.height ?? 0).toFixed(2)
	const text = String(symbol.text ?? symbol.str ?? '').trim()
	return `${page}:${x}:${y}:${width}:${height}:${text}`
}

function getSymbolDisplayMetrics(symbol) {
	const width = Math.max(1, Number(symbol.width ?? symbol.height ?? 12))
	const height = Math.max(1, Number(symbol.height ?? symbol.width ?? 12))
	const diameter = Math.max(8, Math.min(20, Math.min(width, height) * 0.9))
	const centerX = Number(symbol.x ?? 0)
	const centerY = Number(symbol.y ?? 0)
	return { width, height, diameter, centerX, centerY }
}

function collectChoiceSymbolsForProblem(problem, pageSymbolsMap) {
	const seen = new Set()
	const collected = [];
	(problem.coords?.areas || []).forEach((area) => {
		const areaPage = area.page ?? problem.page
		getPageSymbols(pageSymbolsMap, areaPage).forEach((symbol) => {
			if (!isChoiceSymbol(symbol)) return
			if (!isSymbolInsideArea(symbol, area, problem.page)) return
			const choiceKey = getChoiceSymbolKey(symbol, areaPage)
			if (seen.has(choiceKey)) return
			seen.add(choiceKey)
			collected.push({ ...symbol, _choiceKey: choiceKey })
		})
	})
	return collected.sort((a, b) => {
		const pageA = a.page ?? problem.page
		const pageB = b.page ?? problem.page
		if (pageA !== pageB) return pageA - pageB
		const yDiff = Math.abs((a.y ?? 0) - (b.y ?? 0))
		if (yDiff > 5) return (a.y ?? 0) - (b.y ?? 0)
		return (a.x ?? 0) - (b.x ?? 0)
	})
}

function getNumberPositionRectOnPage(problem, currentPage, pageConfig) {
	const np = problem?.numberPosition
	if (!np || !problem?.coords?.areas?.length) return null
	const area = problem.coords.areas.find(a => (a.page ?? problem.page) === currentPage)
	if (!area) return null
	const pdfH = Math.max(1, pageConfig?.pdfHeight ?? 842)
	const charWidth = np.width || 15
	const charHeight = np.height || 15
	const centerX = np.x + (charWidth / 2)
	const centerY = np.y - (charHeight / 2)
	const visualCenterX = centerX
	const visualCenterY = pdfH - centerY
	const boxSize = 44
	return {
		left: visualCenterX - (boxSize / 2),
		top: visualCenterY - (boxSize / 2),
		width: boxSize,
		height: boxSize,
	}
}

function startPdfTypewriter(el) {
	if(!el) return () => {}
	let stopped = false
	let timer = null
	function showPhase() {
		if(stopped || !el.isConnected) return
		el.textContent = '문제 추출 중'
		el.classList.remove('reveal')
		void el.offsetWidth
		el.classList.add('reveal')
		timer = setTimeout(showPhase, 850)
	}
	showPhase()
	return () => { stopped = true; if(timer) clearTimeout(timer) }
}




// ============================================================
// 메인 컴포넌트
// ============================================================
export default function PdfEditModal({ open, mode, filename, initialPdfData, onConfirm, onClose }) {
	// 기존 PdfEditModal state
	const [loading, setLoading] = useState(false) // 타이프라이터 진행
	const [showEdit, setShowEdit] = useState(false)
	const typeTextRef = useRef(null)

	// viewer.js에서 이식한 state
	const [pdfData, setPdfData] = useState(null)
	const [fetchError, setFetchError] = useState(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [selected, setSelected] = useState(null)
	const [dragTarget, setDragTarget] = useState(null)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [suppressTransition, setSuppressTransition] = useState(false)
	const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)
	const [showNumberEditModal, setShowNumberEditModal] = useState(false)
	const [numberEditInputValue, setNumberEditInputValue] = useState('')
	const [missingChoiceModalIndices, setMissingChoiceModalIndices] = useState(null)
	const [saveConfirmModal, setSaveConfirmModal] = useState(false)
	const [mergeConfirmData, setMergeConfirmData] = useState(null)
	const [mergeNoNextModal, setMergeNoNextModal] = useState(false)
	const [mergeSuccessModal, setMergeSuccessModal] = useState(false)
	const [dotOffsetX, setDotOffsetX] = useState(0)
	const [dotOffsetY, setDotOffsetY] = useState(0)
	const [resizeTarget, setResizeTarget] = useState(null)
	const [resizeOffset, setResizeOffset] = useState({ top: 0, bottom: 0 })
	const [columnDrag, setColumnDrag] = useState(null) // { side, edge, value } | null

	const dragRef = useRef(null)
	const dragClickPreventRef = useRef(false)
	const resizeRef = useRef({ startY: 0 })
	const pdfDataRef = useRef(null)
	const canvasRef = useRef(null)

	useEffect(() => { pdfDataRef.current = pdfData }, [pdfData])

	const handleClose = useCallback(() => {
		onClose && onClose(pdfDataRef.current)
	}, [onClose])

	const currentPdfWidth = pdfData?.pageConfig?.[currentPage]?.pdfWidth ?? pdfData?.pageConfig?.[String(currentPage)]?.pdfWidth ?? PDF_WIDTH
	const currentPdfHeight = pdfData?.pageConfig?.[currentPage]?.pdfHeight ?? pdfData?.pageConfig?.[String(currentPage)]?.pdfHeight ?? 842
	const currentPdfCenterX = currentPdfWidth / 2

	useEffect(() => {
		if(!open) {
			setLoading(false)
			setShowEdit(false)
			setFetchError(null)
			setCurrentPage(1)
			setSelected(null)
			setDragTarget(null)
			setDragOffset({ x: 0, y: 0 })
			setDeleteConfirmTarget(null)
			setShowNumberEditModal(false)
			setNumberEditInputValue('')
			setMissingChoiceModalIndices(null)
			setSaveConfirmModal(false)
			setMergeConfirmData(null)
			setMergeNoNextModal(false)
			setMergeSuccessModal(false)
			setResizeTarget(null)
			setResizeOffset({ top: 0, bottom: 0 })
			setColumnDrag(null)
			document.body.style.overflow = ''
			return
		}
		document.body.style.overflow = 'hidden'
		setShowEdit(true)
		setLoading(true)
		let stopTypewriter = null
		const startTimer = setTimeout(() => {
			stopTypewriter = startPdfTypewriter(typeTextRef.current)
		}, 50)
		return () => {
			document.body.style.overflow = ''
			clearTimeout(startTimer)
			if(stopTypewriter) stopTypewriter()
		}
	}, [open, mode])


	useEffect(() => {
		if(!open) return
		if(pdfData || fetchError) setLoading(false)
	}, [open, pdfData, fetchError])


	useEffect(() => {
		if(!open || !filename) return
		if(initialPdfData && (initialPdfData.pdf === filename || !initialPdfData.pdf)) {
			setPdfData(initialPdfData)
			setFetchError(null)
			return
		}
		let cancelled = false
		setFetchError(null);(async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/admin/extract`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ pdfName: filename }),
				})
				const data = await res.json()
				if(cancelled) return
				if(!data.success) {
					setFetchError(data.message || '데이터를 불러오지 못했습니다.')
					return
				}
				setPdfData({
					pdf: data.pdf || filename,
					images: data.images || [],
					problems: data.problems || [],
					pageConfig: data.pageConfig || {},
					pageSymbols: data.pageSymbols || {},
					pageTextItems: data.pageTextItems || {},
				})
			} catch(err) {
				if(!cancelled) setFetchError(err.message || '서버 연결에 실패했습니다.')
			}
		})()
		return () => { cancelled = true }
	}, [open, filename, initialPdfData])


	const columnBounds = useMemo(() => {
		const problems = pdfData?.problems || []
		let leftMinX = Infinity, leftMaxX = -Infinity
		let rightMinX = Infinity, rightMaxX = -Infinity
		problems.forEach(p => {
			const midX = (pdfData?.pageConfig?.[p.page]?.pdfWidth ?? PDF_WIDTH) / 2
			;(p.coords?.areas || []).forEach(a => {
				if(a.bottomRight.x - a.topLeft.x > 30) {
						if(a.topLeft.x < midX) {
							if(a.topLeft.x < leftMinX) leftMinX = a.topLeft.x
							if(a.bottomRight.x > leftMaxX) leftMaxX = a.bottomRight.x
						} else {
							if(a.topLeft.x < rightMinX) rightMinX = a.topLeft.x
							if(a.bottomRight.x > rightMaxX) rightMaxX = a.bottomRight.x
						}
				}
			})
		})
		const defaultMid = PDF_WIDTH / 2
		if(leftMinX === Infinity) leftMinX = 40
		if(leftMaxX === -Infinity) leftMaxX = defaultMid - 20
		if(rightMinX === Infinity) rightMinX = defaultMid + 20
		if(rightMaxX === -Infinity) rightMaxX = PDF_WIDTH - 40
		const left = { startX: leftMinX, endX: leftMaxX, width: leftMaxX - leftMinX }
		const right = { startX: rightMinX, endX: rightMaxX, width: rightMaxX - rightMinX }
		if(columnDrag) {
			const target = columnDrag.side === 'left' ? left : right
			target[columnDrag.edge] = columnDrag.value
			target.width = target.endX - target.startX
		}
		return { left, right }
	}, [pdfData, columnDrag])


	useEffect(() => {
		if(!pdfData?.problems || !pdfData.pageTextItems) return
		let mutated = false
		const next = pdfData.problems.map((p) => {
			const np = computeNumberPositionForProblem(p, pdfData.pageTextItems, pdfData.pageConfig, columnBounds)
			if(!np) return p
			const old = p.numberPosition
			if(old &&
				Math.abs((old.x ?? 0) - np.x) < 0.5 &&
				Math.abs((old.y ?? 0) - np.y) < 0.5 &&
				Math.abs((old.width ?? 0) - np.width) < 0.5 &&
				Math.abs((old.height ?? 0) - np.height) < 0.5
			) return p
			mutated = true
			return { ...p, numberPosition: np }
		})
		if(mutated) setPdfData((prev) => prev ? { ...prev, problems: next } : prev)
	}, [pdfData?.problems, pdfData?.pageTextItems, pdfData?.pageConfig, columnBounds])

	const isPassage = (num) => {
		const s = String(num ?? '').trim()
		if(s.toLowerCase() === 'passage') return true
		if(s.includes('제시문')) return true
		if(s.includes('※')) return true
		return false
	}

	const problemLabelCounts = useMemo(() => {
		const problems = pdfData?.problems
		if(!problems?.length) return {}
		const map = {}; let pCount = 0; let sCount = 0
		problems.forEach((p, idx) => {
			if(isPassage(p.number)) { sCount += 1; map[idx] = { probNum: pCount, passNum: sCount } }
			else { pCount += 1; map[idx] = { probNum: pCount, passNum: sCount } }
		})
		return map
	}, [pdfData?.problems])

	const getAreaLabel = (prob, globalIdx, area, areaIdx) => {
		const counts = problemLabelCounts[globalIdx]
		if(!counts) return '문제 -'
		const passage = isPassage(prob.number)
		const prefix = passage ? '제시문' : '문제'
		const currentNum = passage ? counts.passNum : counts.probNum
		const customAreaLabel = typeof area?.customLabel === 'string' ? area.customLabel : null
		const areas = prob.coords?.areas || []
		if(customAreaLabel) return customAreaLabel
		if(areas.length > 1) return `${prefix} ${currentNum}-${areaIdx + 1}`
		return `${prefix} ${currentNum}`
	}
 
	const handleChoiceSelect = (pIdx, choiceKey) => {
		setPdfData((prev) => {
			if(!prev?.problems?.[pIdx]) return prev
			const updatedProblems = prev.problems.map((problem, index) => {
				if(index !== pIdx) return problem
				const choiceSymbols = collectChoiceSymbolsForProblem(problem, prev.pageSymbols)
				const clickedIndex = choiceSymbols.findIndex((c) => c._choiceKey === choiceKey)
				if(clickedIndex < 0) return problem
				const choiceNum = clickedIndex + 1
				const current = (problem.answer && Array.isArray(problem.answer)) ? [...problem.answer] : []
				const idx = current.indexOf(choiceNum)
				if(idx >= 0) current.splice(idx, 1)
				else current.push(choiceNum)
				current.sort((a, b) => a - b)
				return { ...problem, answer: current }
			})
			return { ...prev, problems: updatedProblems }
		})
	}

	const handleNudge = useCallback((dx, dy) => {
		if(!selected) return
		setPdfData((prev) => {
			if(!prev) return prev
			const newProblems = prev.problems.map((problem, problemIdx) => {
				if(problemIdx !== selected.pIdx) return problem
				const newAreas = (problem.coords?.areas || []).map((area, areaIdx) => {
					if(areaIdx !== selected.areaIdx) return area
					return { ...area, topLeft: { x: area.topLeft.x + dx, y: area.topLeft.y + dy }, bottomRight: { x: area.bottomRight.x + dx, y: area.bottomRight.y + dy } }
				})
				return { ...problem, coords: { ...problem.coords, areas: newAreas } }
			})
			return { ...prev, problems: newProblems }
		})
	}, [selected])

	useEffect(() => {
		if(!open) return
		const handleKeyDown = (e) => {
			if(!selected || showNumberEditModal) return
			if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
			const step = e.shiftKey ? 10 : 1
			switch(e.key) {
				case 'ArrowUp': e.preventDefault(); handleNudge(0, -step); break
				case 'ArrowDown': e.preventDefault(); handleNudge(0, step); break
				case 'ArrowLeft': e.preventDefault(); handleNudge(-step, 0); break
				case 'ArrowRight': e.preventDefault(); handleNudge(step, 0); break
				default: break
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open, selected, showNumberEditModal, handleNudge])

	const handleSave = useCallback(() => {
		if(!pdfData) return
		const problems = pdfData.problems || []
		const problemsWithoutChoice = problems
		.map((p, idx) => {
			const hasChoices = collectChoiceSymbolsForProblem(p, pdfData.pageSymbols).length > 0
			const hasAnswer = Array.isArray(p.answer) && p.answer.length > 0
			if(hasChoices && !hasAnswer) return { index: idx, problem: p }
			return null
		}).filter((p) => p !== null)

		if(problemsWithoutChoice.length > 0) {
			let pCount = 0
			const indexToProbNum = {}
			problems.forEach((p, idx) => {
				if(isPassage(p.number)) { indexToProbNum[idx] = pCount }
				else { pCount += 1; indexToProbNum[idx] = pCount }
			})
			const displayNumbers = problemsWithoutChoice.map(({ index }) => indexToProbNum[index]).filter((n) => n != null && n > 0)
			setMissingChoiceModalIndices(displayNumbers)
			return
		}
		setSaveConfirmModal(true)
	}, [pdfData])

	const handleSaveConfirm = useCallback(() => {
		if(!pdfData) return
		setSaveConfirmModal(false)

		const pageConfig = pdfData.pageConfig || {}
		const problemsWithOffsets = pdfData.problems.map(prob => {
			const correctedSymbols = (prob.symbols || []).map(s => {
				if(isChoiceSymbol(s)) {
					return { ...s, x: Number(s.x ?? 0) + dotOffsetX, y: Number(s.y ?? 0) + dotOffsetY }
				}
				return s
			})

			let correctedNumberPosition = prob.numberPosition
			if(prob.numberPosition) {
				const np = prob.numberPosition
				const charWidth = np.width || 15
				const charHeight = np.height || 15
				const centerX = np.x + (charWidth / 2)
				const centerY = np.y - (charHeight / 2)
				const boxSize = 44
				correctedNumberPosition = {
					...np,
					x: centerX - (boxSize / 2),
					y: centerY + (boxSize / 2),
					width: boxSize,
					height: boxSize,
				}
			}

			const areaPage = prob.page
			const pageWidth = pageConfig?.[areaPage]?.pdfWidth ?? pageConfig?.[String(areaPage)]?.pdfWidth ?? PDF_WIDTH
			const midX = pageWidth / 2
			const normalizedAreas = (prob.coords?.areas || []).map(a => {
				const isLeft = (a.topLeft?.x ?? 0) < midX
				const bounds = isLeft ? columnBounds.left : columnBounds.right
				return {
					...a,
					topLeft: { ...a.topLeft, x: bounds.startX },
					bottomRight: { ...a.bottomRight, x: bounds.endX },
				}
			})

			return {
				...prob,
				coords: { ...prob.coords, areas: normalizedAreas },
				symbols: correctedSymbols,
				numberPosition: correctedNumberPosition,
			}
		})


		const updatedPdfData = { ...pdfData, problems: problemsWithOffsets }
		setPdfData(updatedPdfData)
		pdfDataRef.current = updatedPdfData

		const baseName = (filename || '').replace(/\.pdf$/i, '')
		const pageCount = updatedPdfData.images?.length ?? 0
		const problemCount = problemsWithOffsets.length
		onConfirm && onConfirm({
			filename,
			baseName,
			pageCount,
			problemCount,
			pdfData: updatedPdfData,
			choiceOffsetX: dotOffsetX,
			choiceOffsetY: dotOffsetY,
		})
		onClose && onClose(updatedPdfData)
	}, [pdfData, filename, dotOffsetX, dotOffsetY, onConfirm, onClose, columnBounds])

	const handleConfirmDeleteProblem = () => {
		if(deleteConfirmTarget == null || !pdfData?.problems) return
		const { pIdx } = deleteConfirmTarget
		setSuppressTransition(true)
		setPdfData((prev) => ({ ...prev, problems: prev.problems.filter((_, idx) => idx !== pIdx) }))
		setSelected(null); setDeleteConfirmTarget(null)
		requestAnimationFrame(() => { requestAnimationFrame(() => setSuppressTransition(false)) })
	}

	const handleNumberEdit = () => { setNumberEditInputValue(''); setShowNumberEditModal(true) }

	const handleNumberConfirm = (newNumber) => {
		if(!selected || !pdfData?.problems) return
		const pIdx = selected.pIdx
		const problem = pdfData.problems[pIdx]

		if(newNumber === 'passage') {
			setPdfData((prev) => {
				if(!prev?.problems) return prev
				const updated = [...prev.problems]
				updated[pIdx] = { ...problem, number: 'passage' }
				return { ...prev, problems: updated }
			})
			setShowNumberEditModal(false)
			return
		}

		const targetNum = Number(newNumber)
		if(!Number.isInteger(targetNum) || targetNum < 1) return
		const withoutCurrent = pdfData.problems.filter((_, i) => i !== pIdx)
		let insertionIndex = withoutCurrent.length
		let problemCount = 0
		for(let i = 0; i < withoutCurrent.length; i++) {
			if(!isPassage(withoutCurrent[i].number)) problemCount++
			if(problemCount === targetNum) { insertionIndex = i; break }
		}

		setPdfData((prev) => {
			if(!prev?.problems) return prev
			const problems = [...prev.problems]
			const [currentProblem] = problems.splice(pIdx, 1)
			problems.splice(insertionIndex, 0, { ...currentProblem, number: undefined })
			return { ...prev, problems }
		})
		setSelected({ pIdx: insertionIndex, areaIdx: selected.areaIdx })
		setShowNumberEditModal(false)
	}

	const handleMergeProblem = () => {
		if(!selected || !pdfData?.problems) return
		const pageConfig = pdfData.pageConfig || {}
		const getPdfWidth = (page) => pageConfig[page]?.pdfWidth ?? pageConfig[String(page)]?.pdfWidth ?? PDF_WIDTH
		const sortedProblems = pdfData.problems.map((p, idx) => ({ ...p, originalIndex: idx })).sort((a, b) => {
			if(a.page !== b.page) return a.page - b.page
			const aWidth = getPdfWidth(a.page); const bWidth = getPdfWidth(b.page)
			const aX = a.coords?.areas?.[0]?.topLeft?.x ?? 0; const bX = b.coords?.areas?.[0]?.topLeft?.x ?? 0
			const aCol = aX < aWidth / 2 ? 0 : 1; const bCol = bX < bWidth / 2 ? 0 : 1
			if(aCol !== bCol) return aCol - bCol
			return (a.coords?.areas?.[0]?.topLeft?.y ?? 0) - (b.coords?.areas?.[0]?.topLeft?.y ?? 0)
		})

		const currentProblemRaw = pdfData.problems[selected.pIdx]
		const mySortedIndex = sortedProblems.findIndex((p) => p.originalIndex === selected.pIdx)
		const nextSortedIndex = mySortedIndex + 1

		if(nextSortedIndex >= sortedProblems.length || mySortedIndex === -1) { setMergeNoNextModal(true); return }
		setMergeConfirmData({ nextProblem: sortedProblems[nextSortedIndex], currentProblemRaw, idx1: selected.pIdx })
	}

	const handleMergeConfirm = useCallback(() => {
		const data = mergeConfirmData
		if(!data || !pdfData?.problems) return
		const { nextProblem, currentProblemRaw, idx1 } = data
		const idx2 = nextProblem.originalIndex

		setPdfData((prev) => {
			if(!prev?.problems) return prev
			const updatedProblems = [...prev.problems]
			const pdfWForPage = (page) => prev.pageConfig?.[page]?.pdfWidth ?? prev.pageConfig?.[String(page)]?.pdfWidth ?? PDF_WIDTH

			let mergedAreas = [
				...(currentProblemRaw.coords?.areas || []).map((a) => ({ ...a, page: a.page ?? currentProblemRaw.page })),
				...(nextProblem.coords?.areas || []).map((a) => ({ ...a, page: a.page ?? nextProblem.page })),
			]
			mergedAreas = [...mergedAreas].sort((a, b) => {
				const pageA = a.page ?? currentProblemRaw.page; const pageB = b.page ?? currentProblemRaw.page
				if(pageA !== pageB) return pageA - pageB
				const midX = pdfWForPage(pageA) / 2
				const colA = (a.topLeft?.x ?? 0) < midX ? 0 : 1; const colB = (b.topLeft?.x ?? 0) < midX ? 0 : 1
				if(colA !== colB) return colA - colB
				return (a.topLeft?.y ?? 0) - (b.topLeft?.y ?? 0)
			})

			const mergedSymbols = [
				...(currentProblemRaw.symbols || []).map((s) => ({ ...s, page: s.page ?? currentProblemRaw.page })),
				...(nextProblem.symbols || []).map((s) => ({ ...s, page: s.page ?? nextProblem.page })),
			]
			const mergedProblem = { ...currentProblemRaw, coords: { ...currentProblemRaw.coords, areas: mergedAreas }, symbols: mergedSymbols }

			const minIdx = Math.min(idx1, idx2); const maxIdx = Math.max(idx1, idx2)
			updatedProblems.splice(maxIdx, 1); updatedProblems.splice(minIdx, 1, mergedProblem)
			return { ...prev, problems: updatedProblems }
		})

		setSelected(null); setMergeConfirmData(null); setMergeSuccessModal(true)
	}, [mergeConfirmData, pdfData])

	const handleCreateArea = () => {
		if(!pdfData?.problems) return
		const col = columnBounds.left
		const newArea = {
			topLeft: { x: col.startX, y: 150 },
			bottomRight: { x: col.endX, y: 250 },
			page: currentPage,
		}
		const pageSymbols = getPageSymbols(pdfData.pageSymbols, currentPage)
		const initialSymbols = pageSymbols.filter((s) => isSymbolInsideArea(s, newArea, currentPage))
		const newProblem = { page: currentPage, number: undefined, question: '', coords: { areas: [newArea] }, symbols: initialSymbols, numberPosition: null }
		const next = [...pdfData.problems, newProblem]
		const sorted = sortProblemsByDisplayOrder(next, pdfData.pageConfig, newProblem)
		const newPIdx = sorted.findIndex((p) => p === newProblem)
		setPdfData({ ...pdfData, problems: sorted })
		setSelected({ pIdx: newPIdx >= 0 ? newPIdx : 0, areaIdx: 0 })
	}

	const handleDeleteArea = () => {
		if(!selected || !pdfData?.problems) return
		const { pIdx, areaIdx } = selected
		const problem = pdfData.problems[pIdx]
		if(!problem?.coords?.areas) return
		const newAreas = problem.coords.areas.filter((_, idx) => idx !== areaIdx)
		setSuppressTransition(true)
		const clearSuppress = () => { requestAnimationFrame(() => { requestAnimationFrame(() => setSuppressTransition(false)) }) }
		if(newAreas.length === 0) { setDeleteConfirmTarget({ pIdx }); clearSuppress(); return }
		setPdfData((prev) => {
			const newProblems = prev.problems.map((p, idx) => {
				if(idx !== pIdx) return p
				return { ...p, coords: { ...p.coords, areas: newAreas } }
			})
			return { ...prev, problems: newProblems }
		})
		setSelected(null); clearSuppress()
	}

	const handleResizeStart = (e, globalIdx, areaIdx, edge) => {
		e.preventDefault(); e.stopPropagation()
		resizeRef.current = { startY: e.clientY, lastTop: 0, lastBottom: 0 }
		setResizeTarget({ pIdx: globalIdx, areaIdx, edge })
		setResizeOffset({ top: 0, bottom: 0 })
		const handleMouseMove = (moveEvent) => {
			const totalDelta = moveEvent.clientY - resizeRef.current.startY
			const off = edge === 'top' ? { top: totalDelta, bottom: 0 } : { top: 0, bottom: totalDelta }
			resizeRef.current.lastTop = off.top; resizeRef.current.lastBottom = off.bottom
			setResizeOffset(off)
		}
		const handleMouseUp = () => {
			const top = resizeRef.current.lastTop; const bottom = resizeRef.current.lastBottom
			if(pdfData?.problems && (top !== 0 || bottom !== 0)) {
				const pIdx = globalIdx; const aIdx = areaIdx
				const problem = pdfData.problems[pIdx]; const areas = problem?.coords?.areas
				if(areas?.[aIdx]) {
						const area = { ...areas[aIdx] }
						const newTop = (area.topLeft?.y ?? 0) + top
						const newBottom = (area.bottomRight?.y ?? 0) + bottom
						if(newBottom - newTop >= 10) {
							area.topLeft = { ...area.topLeft, y: newTop }
							area.bottomRight = { ...area.bottomRight, y: newBottom }
							const next = pdfData.problems.map((p, i) => i !== pIdx ? p : { ...p, coords: { ...p.coords, areas: [...(p.coords?.areas || []).map((a, j) => (j === aIdx ? area : a))] } })
							const modifiedProblem = next[pIdx]
							const sorted = sortProblemsByDisplayOrder(next, pdfData.pageConfig, modifiedProblem)
							const newPIdx = sorted.findIndex((p) => p === modifiedProblem)
							setPdfData({ ...pdfData, problems: sorted })
							setSelected(newPIdx >= 0 ? { pIdx: newPIdx, areaIdx: aIdx } : null)
						}
				}
			}
			setResizeTarget(null); setResizeOffset({ top: 0, bottom: 0 })
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}


	const COL_MIN_WIDTH = 50
	const COL_MIN_GAP = 10

	const applyColumnBoundsToProblems = useCallback((side, newStartX, newEndX) => {
		setPdfData((prev) => {
			if(!prev?.problems) return prev
			const next = prev.problems.map((p) => {
				const pageWidth = prev.pageConfig?.[p.page]?.pdfWidth ?? prev.pageConfig?.[String(p.page)]?.pdfWidth ?? PDF_WIDTH
				const midX = pageWidth / 2
				const newAreas = (p.coords?.areas || []).map((a) => {
					const isThisColumn = side === 'left' ? a.topLeft.x < midX : a.topLeft.x >= midX
					if(!isThisColumn) return a
					return {
						...a,
						topLeft: { ...a.topLeft, x: newStartX },
						bottomRight: { ...a.bottomRight, x: newEndX },
					}
				})
				return { ...p, coords: { ...p.coords, areas: newAreas } }
			})
			return { ...prev, problems: next }
		})
	}, [])

	const handleGuideMouseDown = (e, side, edge) => {
		e.preventDefault(); e.stopPropagation()
		const canvasEl = canvasRef.current
		if(!canvasEl) return
		const rect = canvasEl.getBoundingClientRect()
		const scale = rect.width > 0 ? currentPdfWidth / rect.width : 1
		const initialBounds = {
			left: { startX: columnBounds.left.startX, endX: columnBounds.left.endX },
			right: { startX: columnBounds.right.startX, endX: columnBounds.right.endX },
		}
		let lastValue = initialBounds[side][edge]

		const computeClamped = (rawValue) => {
			const lb = initialBounds.left
			const rb = initialBounds.right
			let min, max
			if(side === 'left' && edge === 'startX') {
				min = 0; max = lb.endX - COL_MIN_WIDTH
			} else if(side === 'left' && edge === 'endX') {
				min = lb.startX + COL_MIN_WIDTH; max = rb.startX - COL_MIN_GAP
			} else if(side === 'right' && edge === 'startX') {
				min = lb.endX + COL_MIN_GAP; max = rb.endX - COL_MIN_WIDTH
			} else {
				min = rb.startX + COL_MIN_WIDTH; max = currentPdfWidth
			}
			return Math.max(min, Math.min(max, rawValue))
		}

		const handleMouseMove = (moveEvent) => {
			const rectNow = canvasEl.getBoundingClientRect()
			const xInPdf = (moveEvent.clientX - rectNow.left) * scale
			lastValue = computeClamped(xInPdf)
			setColumnDrag({ side, edge, value: lastValue })
		}
		const handleMouseUp = () => {
			const finalValue = lastValue
			const finalBounds = {
				startX: edge === 'startX' ? finalValue : initialBounds[side].startX,
				endX: edge === 'endX' ? finalValue : initialBounds[side].endX,
			}
			applyColumnBoundsToProblems(side, finalBounds.startX, finalBounds.endX)
			setColumnDrag(null)
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	const handleAreaMouseDown = (e, globalIdx, areaIdx, area, snapLeftX, snapRightX) => {
		const isSelected = selected?.pIdx === globalIdx && selected?.areaIdx === areaIdx
		if(!isSelected || !area?.topLeft || !area?.bottomRight) return
		dragClickPreventRef.current = false
		e.preventDefault(); e.stopPropagation()
		const boxRect = e.currentTarget.getBoundingClientRect()
		const clickOffsetX = e.clientX - boxRect.left
		const startMousePdfX = area.topLeft.x + clickOffsetX
		const width = area.bottomRight.x - area.topLeft.x
		dragRef.current = {
			startX: e.clientX, startY: e.clientY,
			startTopLeft: { x: area.topLeft.x, y: area.topLeft.y },
			startBottomRight: { x: area.bottomRight.x, y: area.bottomRight.y },
			startMousePdfX, width, leftX: snapLeftX, rightX: snapRightX,
			pdfCenterX: currentPdfCenterX, pIdx: globalIdx, areaIdx,
			lastOffset: { x: 0, y: 0 },
		}
		setDragTarget({ pIdx: globalIdx, areaIdx }); setDragOffset({ x: 0, y: 0 })
		const handleMouseMove = (moveEvent) => {
			const ref = dragRef.current
			if(!ref || ref.pIdx !== globalIdx || ref.areaIdx !== areaIdx) return
			const dx = moveEvent.clientX - ref.startX
			const dy = moveEvent.clientY - ref.startY
			if(Math.abs(dx) > 3 || Math.abs(dy) > 3) dragClickPreventRef.current = true
			const targetX = (ref.startMousePdfX + dx) < ref.pdfCenterX ? ref.leftX : ref.rightX
			const offset = { x: targetX - ref.startTopLeft.x, y: dy }
			ref.lastOffset = offset
			setDragOffset(offset)
		}
		const handleMouseUp = () => {
			const ref = dragRef.current
			if(ref && pdfData?.problems) {
				const finalX = ref.startTopLeft.x + (ref.lastOffset?.x ?? 0)
				const finalY = ref.startTopLeft.y + (ref.lastOffset?.y ?? 0)
				// 드롭한 단의 폭에 맞춰 좌/우 x를 컬럼 경계로 스냅
				const isLeftCol = finalX < ref.pdfCenterX
				const colBounds = isLeftCol ? columnBounds.left : columnBounds.right
				const newAreaTopLeftX = colBounds.startX
				const newAreaBottomRightX = colBounds.endX
				const newProblems = pdfData.problems.map((p, idx) => {
						if(idx !== ref.pIdx) return p
						const newAreas = (p.coords?.areas || []).map((a, i) => i !== ref.areaIdx ? a : { ...a, topLeft: { x: newAreaTopLeftX, y: finalY }, bottomRight: { x: newAreaBottomRightX, y: finalY + (ref.startBottomRight.y - ref.startTopLeft.y) } })
						return { ...p, coords: { ...p.coords, areas: newAreas } }
				})
				const movedProblem = newProblems[ref.pIdx]
				const sorted = sortProblemsByDisplayOrder(newProblems, pdfData.pageConfig, movedProblem)
				let newPIdx = sorted.findIndex((p) => p === movedProblem)
				if(newPIdx < 0) {
						const movedArea = movedProblem?.coords?.areas?.[ref.areaIdx]
						if(movedArea?.topLeft) newPIdx = sorted.findIndex((p) => p.coords?.areas?.[ref.areaIdx]?.topLeft?.x === movedArea.topLeft.x && p.coords?.areas?.[ref.areaIdx]?.topLeft?.y === movedArea.topLeft.y)
				}
				setPdfData({ ...pdfData, problems: sorted })
				setSelected(newPIdx >= 0 ? { pIdx: newPIdx, areaIdx: ref.areaIdx } : null)
			}
			setDragTarget(null); setDragOffset({ x: 0, y: 0 }); dragRef.current = null
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
			setTimeout(() => { dragClickPreventRef.current = false }, 50)
		}
		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	if(!open) return null


	const totalPages = pdfData?.images?.length ?? 0
	const currentPageImage = pdfData?.images?.[currentPage - 1]
	const currentPageSymbols = pdfData ? getPageSymbols(pdfData.pageSymbols, currentPage) : []
	const choiceSymbolsByProblem = (pdfData?.problems || []).map((problem) => collectChoiceSymbolsForProblem(problem, pdfData.pageSymbols))
	const areasOnPage = (pdfData?.problems || [])
		.flatMap((prob, globalIdx) => (prob.coords?.areas || []).map((area, aIdx) => ({ problem: prob, globalIdx, area, areaIdx: aIdx })))
		.filter(({ area, problem: p }) => (area.page ?? p.page) === currentPage)
	const selectedAreaPage = selected != null && pdfData?.problems?.[selected.pIdx] != null
		? (pdfData.problems[selected.pIdx].coords?.areas?.[selected.areaIdx]?.page ?? pdfData.problems[selected.pIdx].page)
		: null
	const pageConfigCurrent = pdfData?.pageConfig?.[currentPage] ?? pdfData?.pageConfig?.[String(currentPage)]
	const scoreOverlaysOnPage = (pdfData?.problems || []).map((prob, globalIdx) => {
		if(isPassage(prob.number)) return null
		const rect = getNumberPositionRectOnPage(prob, currentPage, pageConfigCurrent)
		if(!rect) return null
		return { globalIdx, rect, isCorrect: prob.isCorrect }
	}).filter(Boolean)

	const confirmLabel = mode === 'new' ? '추출 완료' : '편집 완료'
	const showCanvas = !!pdfData && !fetchError




	return (
		<div id="pdfEditModal" className="open">
		{/* 로딩 스크린 (타이프라이터) */}
		{loading && (
			<div id="pdfLoadingScreen" className="pdf-loading-screen show">
				<div className="pdf-loading-inner">
					<img src={chaJo} alt=""  />
					<span ref={typeTextRef} className="pdf-type-text"></span>
				</div>
			</div>
		)}


		{/* 편집 화면 */}
		{showEdit && (
			<div id="pdfModalEdit" className={loading ? 'loading' : ''} style={{display:'flex'}}>
				{/* 상단 바 */}
				<div className="pdf-modal-topbar">
					<button className="btn-pdf-close" onClick={handleClose} title="닫기"><Icon.Close /></button>
					<span className="pdf-modal-filename">{filename || '파일명.pdf'}</span>
					<button className="btn-pdf-confirm" onClick={handleSave} disabled={!pdfData}><Icon.Check /><span>{confirmLabel}</span></button>
				</div>

				{/* 캔버스 */}
				<div className="pdf-modal-canvas">
					{fetchError && (
						<div className="pdf-viewer-inline-state">
							<div>{fetchError}</div>
							<button className="pdf-tool-btn" onClick={handleClose}>닫기</button>
						</div>
					)}

					{!fetchError && showCanvas && (
						<div
							ref={canvasRef}
							className={`pdf-viewer pdf-viewer-canvas ${suppressTransition ? 'viewer-no-transition' : ''}`}
							style={{ width: currentPdfWidth, height: currentPdfHeight }}
						>
							{currentPageImage && <img src={currentPageImage} alt={`페이지 ${currentPage}`} className="viewer-page-image" />}
							{[
								{ side: 'left', edge: 'startX', x: columnBounds.left.startX },
								{ side: 'left', edge: 'endX', x: columnBounds.left.endX },
								{ side: 'right', edge: 'startX', x: columnBounds.right.startX },
								{ side: 'right', edge: 'endX', x: columnBounds.right.endX },
							].map((g) => {
								const isDragging = columnDrag && columnDrag.side === g.side && columnDrag.edge === g.edge
								return (
									<div
										key={`${g.side}-${g.edge}`}
										className={`pdf-column-guide${isDragging ? ' is-dragging' : ''}`}
										style={{ left: g.x, height: currentPdfHeight }}
										onMouseDown={(e) => handleGuideMouseDown(e, g.side, g.edge)}
									/>
								)
							}
						)}

							{areasOnPage.map(({ problem: prob, globalIdx, area, areaIdx: aIdx }) => {
								const isSelected = selected?.pIdx === globalIdx && selected?.areaIdx === aIdx && selectedAreaPage === currentPage
								const isDragging = dragTarget?.pIdx === globalIdx && dragTarget?.areaIdx === aIdx
								const isResizingThis = resizeTarget?.pIdx === globalIdx && resizeTarget?.areaIdx === aIdx
								const problemChoiceSymbols = choiceSymbolsByProblem[globalIdx] || []
								const choiceIndexByKey = new Map(problemChoiceSymbols.map((choice, index) => [choice._choiceKey, index]))
								const selectedChoiceNums = (prob.answer && Array.isArray(prob.answer)) ? prob.answer.map(Number) : []

								const ox = isDragging ? dragOffset.x : 0
								const oy = isDragging ? dragOffset.y : 0
								const ro = isResizingThis ? resizeOffset : { top: 0, bottom: 0 }

								// 드래그 중에는 현재 위치 기준으로 도착지 단을 판정해 폭을 즉시 스냅
								const effectiveX = area.topLeft.x + ox
								const isLeftColumn = effectiveX < currentPdfCenterX
								const col = isLeftColumn ? columnBounds.left : columnBounds.right
								const enforcedArea = {
									...area,
									topLeft: { x: col.startX, y: area.topLeft.y },
									bottomRight: { x: col.endX, y: area.bottomRight.y },
								}

								const boxTop = enforcedArea.topLeft.y + oy + ro.top
								const boxHeight = Math.max(10, (enforcedArea.bottomRight.y - enforcedArea.topLeft.y) + (ro.bottom - ro.top))

								return (
									<div
										key={`${globalIdx}-${aIdx}`}
										role="button" tabIndex={0}
										onClick={(e) => { if(dragClickPreventRef.current) { e.preventDefault(); return } setSelected({ pIdx: globalIdx, areaIdx: aIdx }) }}
										onMouseDown={(e) => handleAreaMouseDown(e, globalIdx, aIdx, enforcedArea, columnBounds.left.startX, columnBounds.right.startX)}
										onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected({ pIdx: globalIdx, areaIdx: aIdx }) } }}
										className={`pdf-bbox ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
										style={{ left: enforcedArea.topLeft.x, top: boxTop, width: col.width, height: boxHeight }}
									>
										<div className="pdf-bbox-label">{getAreaLabel(prob, globalIdx, enforcedArea, aIdx)}</div>
										{currentPageSymbols.filter(s => isSymbolInsideArea(s, enforcedArea, prob.page)).map((s, sIdx) => {
											const isChoice = isChoiceSymbol(s)
											if(!isChoice) return null
											const choiceKey = isChoice ? getChoiceSymbolKey(s, currentPage) : null
											const choiceOrder = choiceKey != null ? choiceIndexByKey.get(choiceKey) : undefined
											const isSelectedChoice = choiceOrder !== undefined && selectedChoiceNums.includes(choiceOrder + 1)
											const metrics = getSymbolDisplayMetrics(s)

											return (
												<div
													key={sIdx}
													className={`viewer-symbol-dot ${isChoice ? 'is-choice' : ''} ${isSelectedChoice ? 'is-selected' : ''}`}
													onMouseDown={(e) => { if(!isChoice) return; e.stopPropagation() }}
													onClick={(e) => { if(!isChoice || choiceKey == null) return; e.stopPropagation(); setSelected({ pIdx: globalIdx, areaIdx: aIdx }); handleChoiceSelect(globalIdx, choiceKey) }}
													title={isChoice && choiceOrder !== undefined ? `선택지 ${choiceOrder + 1}` : undefined}
													style={{
													left: metrics.centerX - enforcedArea.topLeft.x - (metrics.diameter / 2) + CHOICE_VISUAL_OFFSET_X + dotOffsetX,
													top: metrics.centerY - enforcedArea.topLeft.y - oy - ro.top - (metrics.diameter / 2) + CHOICE_VISUAL_OFFSET_Y + dotOffsetY,
													width: metrics.diameter,
													height: metrics.diameter,
													cursor: isChoice ? 'pointer' : 'default',
													}}
												/>
											)
										})}
										{isSelected && (
											<>
												<div className="viewer-resize-handle viewer-resize-handle-top" onMouseDown={(e) => handleResizeStart(e, globalIdx, aIdx, 'top')}>
													<div className="viewer-resize-handle-bar" />
												</div>
												<div className="viewer-resize-handle viewer-resize-handle-bottom" onMouseDown={(e) => handleResizeStart(e, globalIdx, aIdx, 'bottom')}>
													<div className="viewer-resize-handle-bar" />
												</div>
											</>
										)}
									</div>
								)
							})}
							{scoreOverlaysOnPage.map(({ globalIdx, rect, isCorrect }) => (
								<div
									key={`score-${globalIdx}`}
									className={`viewer-score-overlay ${isCorrect === true || isCorrect === false ? 'viewer-score-overlay-filled' : 'viewer-score-overlay-placeholder'}`}
									style={{ position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 15 }}
								>
									{isCorrect === true || isCorrect === false
										? <img src={isCorrect ? '/correct.png' : '/incorrect.png'} alt={isCorrect ? '정답' : '오답'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
										: <span className="viewer-score-overlay-label"></span>}
								</div>
							))}
						</div>
					)}
				</div>

				{/* 하단 툴바 */}
				<div className="pdf-modal-toolbar">
					<button className="pdf-tool-btn" onClick={handleCreateArea} disabled={!pdfData}><Icon.Plus />영역 생성</button>
					<button className="pdf-tool-btn" disabled={!selected}><Icon.Refresh />재인식</button>
					<button className="pdf-tool-btn" onClick={handleNumberEdit} disabled={!selected}><Icon.Number />번호 수정</button>
					<button className="pdf-tool-btn gr" onClick={handleMergeProblem} disabled={!selected}><Icon.Merge />그룹 합치기</button>
					<div className="bar"></div>
					<button className="pdf-tool-btn danger" onClick={handleDeleteArea} disabled={!selected}><Icon.Trash />삭제</button>
					<div className="pdf-toolbar-spacer"></div>
					<div className="pdf-adjust-wrap">
						답안 좌표 보정
						<span>가로(X)</span>
						<input
							type="number"
							className="pdf-adjust-input"
							value={dotOffsetX}
							onChange={(e) => setDotOffsetX(Number(e.target.value))}
							placeholder="0"
						/>
						<span>세로(Y)</span>
						<input
							type="number"
							className="pdf-adjust-input"
							value={dotOffsetY}
							onChange={(e) => setDotOffsetY(Number(e.target.value))}
							placeholder="0"
						/>
					</div>
					<div className="bar mg"></div>
					<div className="pdf-page-nav">
						<button
							className="pdf-page-nav-btn"
							title="이전 페이지"
							onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
							disabled={!pdfData || currentPage <= 1}
						>
							<Icon.ChevronLeft />
						</button>
						<span className="pdf-page-num">{pdfData ? `${currentPage} / ${totalPages}` : '- / -'}</span>
						<button
							className="pdf-page-nav-btn"
							title="다음 페이지"
							onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
							disabled={!pdfData || currentPage >= totalPages}
						><Icon.ChevronRight /></button>
					</div>
				</div>



				{/* ===== Viewer Modals ===== */}
				{showNumberEditModal && (
					<div className="viewer-modal-overlay" onClick={() => setShowNumberEditModal(false)} role="dialog" aria-modal="true">
						<div className="viewer-modal-box viewer-number-edit-modal" onClick={(e) => e.stopPropagation()}>
							<h2 className="viewer-modal-title">문제 번호 수정</h2>
							<label className="viewer-modal-label" htmlFor="viewer-number-edit-input">새로운 문제 번호:</label>
							<input
								id="viewer-number-edit-input"
								type="number"
								className="viewer-modal-input"
								value={numberEditInputValue}
								onChange={(e) => setNumberEditInputValue(e.target.value)}
								placeholder="숫자 입력"
								min={1}
								autoFocus
							/>
							<button type="button" className="viewer-modal-btn viewer-modal-btn-passage" onClick={() => handleNumberConfirm('passage')}>제시문</button>
							<div className="viewer-modal-actions">
								<button type="button" className="viewer-modal-btn viewer-modal-btn-cancel" onClick={() => setShowNumberEditModal(false)}>취소</button>
								<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={() => {
									const num = parseInt(numberEditInputValue, 10)
									if(Number.isNaN(num) || num < 1) { alert('오류: 1 이상의 숫자를 입력해주세요.'); return }
									handleNumberConfirm(num)
								}}>확인</button>
							</div>
						</div>
					</div>
				)}

				{deleteConfirmTarget != null && (
				<div className="viewer-modal-overlay" onClick={() => setDeleteConfirmTarget(null)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">문제 삭제</p>
						<p className="viewer-modal-message">이 문제의 모든 영역이 삭제됩니다. 문제를 삭제하시겠습니까?</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-cancel" onClick={() => setDeleteConfirmTarget(null)}>취소</button>
							<button type="button" className="viewer-modal-btn viewer-modal-btn-delete" onClick={handleConfirmDeleteProblem}>삭제</button>
						</div>
					</div>
				</div>
				)}

				{missingChoiceModalIndices != null && missingChoiceModalIndices.length > 0 && (
				<div className="viewer-modal-overlay" onClick={() => setMissingChoiceModalIndices(null)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">정답을 선택해주세요</p>
						<p className="viewer-modal-message">
							다음 문제의 정답을 선택해주세요:<br />
							{missingChoiceModalIndices.length <= 5
							? missingChoiceModalIndices.map((num) => `${num}번`).join(', ')
							: `${missingChoiceModalIndices.slice(0, 3).map((num) => `${num}번`).join(', ')} 외 ${missingChoiceModalIndices.length - 3}개`}
						</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={() => setMissingChoiceModalIndices(null)}>확인</button>
						</div>
					</div>
				</div>
				)}

				{saveConfirmModal && (
				<div className="viewer-modal-overlay" onClick={() => setSaveConfirmModal(false)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">수정 완료</p>
						<p className="viewer-modal-message">수정 내용을 저장하시겠습니까?</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-cancel" onClick={() => setSaveConfirmModal(false)}>취소</button>
							<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={handleSaveConfirm}>저장</button>
						</div>
					</div>
				</div>
				)}

				{mergeConfirmData != null && (
				<div className="viewer-modal-overlay" onClick={() => setMergeConfirmData(null)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">그룹 합치기</p>
						<p className="viewer-modal-message">
							현재 문제(P.{mergeConfirmData.currentProblemRaw.page})와<br />
							다음 위치의 문제(P.{mergeConfirmData.nextProblem.page}, 원래 인덱스 {mergeConfirmData.nextProblem.originalIndex})를<br />
							하나로 합치시겠습니까?
						</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-cancel" onClick={() => setMergeConfirmData(null)}>취소</button>
							<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={handleMergeConfirm}>합치기</button>
						</div>
					</div>
				</div>
				)}

				{mergeNoNextModal && (
				<div className="viewer-modal-overlay" onClick={() => setMergeNoNextModal(false)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">그룹 합치기</p>
						<p className="viewer-modal-message">합칠 다음 문제가 없습니다.</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={() => setMergeNoNextModal(false)}>확인</button>
						</div>
					</div>
				</div>
				)}

				{mergeSuccessModal && (
				<div className="viewer-modal-overlay" onClick={() => setMergeSuccessModal(false)} role="dialog" aria-modal="true">
					<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
						<p className="viewer-modal-title">그룹 합치기</p>
						<p className="viewer-modal-message">문제가 병합되었습니다.</p>
						<div className="viewer-modal-actions">
							<button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={() => setMergeSuccessModal(false)}>확인</button>
						</div>
					</div>
				</div>
				)}
			</div>
		)}
		</div>
	)
}
