import { useState, useEffect, useMemo } from 'react';
import './TextbookList.css';
import { API_BASE_URL } from '../config'
import { BOOKS, APPR, SELL, GRADE_MAP, LG_LEVELS, PUB_VALUES } from '../data/books';

const REG_PALETTE = ['#EB441C','#5BA89E','#6B9FD4','#84C07B','#C97B5E','#9B7DC8','#D4A84B','#7B9ED4','#E89A7E','#8BAE8F','#B07BB0','#5B8FBF','#C8A060']
const Icon = {
	Search: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round"><circle cx="6" cy="6" r="4"/><path d="M10 10l2.5 2.5"/></svg>),
	Filter: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h12M3.5 7h7M6 11h2"/></svg>),
	Down: () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9v2h9V9M6.5 1v7M4 5.5l2.5 2.5L9 5.5"/></svg>),
	Plus: () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>),
	Arrow: () => (<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l4 4 4-4"/></svg>),
	Calendar: () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#bbb" strokeWidth="1.1" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="2"/><path d="M1 5h11M4 1v2M9 1v2"/></svg>),
	calNavLeft: () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2L4 6l4 4"/></svg>),
	calNavRight: () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 4-4 4"/></svg>),
	chipX: () => (<svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>),
	pageCheck: () => (<svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3.5l2.5 2.5 4.5-5"/></svg>),
	pageunCheck: () => (<svg width="8" height="2" viewBox="0 0 8 2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M1 1h6"/></svg>),
	listView: () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12"/></svg>),
	cardView: () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>),
	pageArwLeft: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3L5 7l4 4"/></svg>),
	pageArwRight: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 4-4 4"/></svg>),
	floatApprove: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5"/><path d="M4.5 7l2 2 3-3"/></svg>),
	floatStopSale: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3" width="2.5" height="8" rx="1"/><rect x="8" y="3" width="2.5" height="8" rx="1"/></svg>),
	floatDelete: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M3.5 4l.8 7.5h5.4L10.5 4"/></svg>),
	floatClearAll: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>),
}

function transformRegisteredTextbook(tb, idx) {
	const m = tb.metadata || {}
	const p = tb.price || {}
	const gradeRaw = String(m.grade || '')
	let grade = gradeRaw
	const gm = gradeRaw.match(/(초등|중등|고등)\s*(\d+)\s*학년/)
	if (gm) {
		const prefix = { '초등':'초', '중등':'중', '고등':'고' }[gm[1]]
		grade = `${prefix}${gm[2]}`
	} else if (gradeRaw === 'N수반') {
		grade = 'N수'
	}
	const registeredDate = typeof tb.registeredAt === 'string' && tb.registeredAt
		? tb.registeredAt.slice(0, 10).replace(/-/g, '.')
		: ''
	return {
		id: `REG-${tb.baseName || tb.folder || idx}`,
		baseName: tb.baseName || tb.folder || '',
		name: m.title || '제목 없음',
		pub: m.publisher || '',
		subj: m.subject || '',
		grade,
		price: Number(p.finalPrice ?? p.price ?? 0),
		disc: Number(p.discount ?? 0),
		author: m.author || '',
		sales: null,
		appr: tb.approvalStatus || 'pending',
		sell: tb.sellStatus ?? null,
		date: registeredDate,
		color: REG_PALETTE[idx % REG_PALETTE.length],
		thumbnailUrl: tb.thumbnailUrl || null,
		_registered: true,
		_raw: tb,
	}
}

const MS_LABELS = {subject:'과목', pub:'출판사'}
const MS_OPT_VALUES = {
	subject: ['수학','영어','국어','과학','사회','한국사'],
	pub: PUB_VALUES
}
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const CDAYS = ['일','월','화','수','목','금','토']

function lgKey(lv, g) { return lv+'|'+g }
function lgAllForLevel(lv) { return (GRADE_MAP[lv]||[]).map(g=>lgKey(lv,g)) }
function fmtDate(d) { return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}` }



export default function TextbookList({ onNavigate, onEditBook }) {
	const isEditable = (b) => b._registered && b._raw && b.appr === 'pending'
	const handleBookOpen = (b) => {
	if (!isEditable(b)) return
		onEditBook?.(b._raw)
		onNavigate('textbook-register')
	}

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(24); // 기본값 24개

	const [selected, setSelected] = useState(new Set())
	const [rsTab, setRsTab] = useState('전체')
	const [viewMode, setViewMode] = useState('list')
	const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1200)
	const [registeredBooks, setRegisteredBooks] = useState([])

	useEffect(() => {
		const handleResize = () => setIsNarrow(window.innerWidth < 1200)
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// 서버에서 등록된 교재 불러오기 (더미 데이터와 병합)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/admin/textbook-list`)
				const data = await res.json()
				if (cancelled || !data.success) return
				const transformed = (data.textbooks || []).map((tb, i) => transformRegisteredTextbook(tb, i))
				setRegisteredBooks(transformed)
			} catch (err) {
				console.warn('교재 목록 조회 실패:', err.message)
			}
		})()
		return () => { cancelled = true }
	}, [])

	const allBooks = useMemo(() => [...registeredBooks, ...BOOKS], [registeredBooks])
	const effectiveView = isNarrow ? 'card' : viewMode

	// 필터
	const [filterOpen, setFilterOpen] = useState(false)
	const [msSel, setMsSel] = useState({subject:[], lg:[], pub:[]})
	const [msOpen, setMsOpen] = useState({subject:false, lg:false, pub:false})
	const [calOpen, setCalOpen] = useState(false)
	const [calSel, setCalSel] = useState({start:null, end:null, picking:'start'})
	const [calView, setCalView] = useState({year:new Date().getFullYear(), month:new Date().getMonth()})
	const [dateLabel, setDateLabel] = useState('전체 기간')
	const [appliedCalSel, setAppliedCalSel] = useState({start:null, end:null})

	// 외부 클릭 처리
	useEffect(() => {
		const handler = e => {
			if(!e.target.closest('.filter-date-wrap')) setCalOpen(false)
			if(!e.target.closest('.ms-wrap')) setMsOpen({subject:false,lg:false,pub:false})
		}
		document.addEventListener('click', handler)
		return () => document.removeEventListener('click', handler)
	}, [])

	// pagination
	const pagedBooks = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return allBooks.slice(startIndex, startIndex + itemsPerPage);
	}, [allBooks, currentPage, itemsPerPage]);

	const totalPages = Math.ceil(allBooks.length / itemsPerPage);

	const getPageNumbers = () => {
		const pages = [];
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push('...');
			for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
				pages.push(i);
			}
			if (currentPage < totalPages - 2) pages.push('...');
			pages.push(totalPages);
		}
		return [...new Set(pages)];
	};

	const handlePerPageChange = (e) => {
		setItemsPerPage(Number(e.target.value.replace('개', '')));
		setCurrentPage(1); 
	};

	const handlePageChange = (page) => {
		if (page < 1 || page > totalPages) return;
		setCurrentPage(page);
		window.scrollTo(0, 0);
	};

	// 체크박스
	const toggleRow = (id) => {
		setSelected(s => {
			const n = new Set(s)
			n.has(id) ? n.delete(id) : n.add(id)
			return n
		})
	}

	const isAllPagedChecked = useMemo(() => {
		return pagedBooks.length > 0 && pagedBooks.every(b => selected.has(b.id));
	}, [pagedBooks, selected]);

	const isSomePagedChecked = useMemo(() => {
		const pagedSelectedCount = pagedBooks.filter(b => selected.has(b.id)).length;
		return pagedSelectedCount > 0 && pagedSelectedCount < pagedBooks.length;
	}, [pagedBooks, selected]);

	// 2. 전체 선택 토글 (현재 페이지 아이템들만)
	const toggleAll = () => {
		setSelected(prev => {
			const next = new Set(prev);
			if (isAllPagedChecked) {
				pagedBooks.forEach(b => next.delete(b.id)); // 현재 페이지만 해제
			} else {
				pagedBooks.forEach(b => next.add(b.id));    // 현재 페이지만 선택
			}
			return next;
		});
	};

	const clearAll = () => setSelected(new Set());


	// 서버에서 교재 목록 다시 불러오기 (등록된 교재만)
	const refreshRegistered = async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/admin/textbook-list`)
			const data = await res.json()
			if (data.success) {
				setRegisteredBooks((data.textbooks || []).map((tb, i) => transformRegisteredTextbook(tb, i)))
			}
		} catch (err) {
			console.warn('교재 목록 갱신 실패:', err.message)
		}
	}

	// 벌크 승인: 검토중 + 서버 등록 교재만 처리
	const handleBulkApprove = async () => {
		const targets = allBooks.filter((b) => selected.has(b.id) && b._registered && b.appr === 'pending')
		if (targets.length === 0) { clearAll(); return }
			await Promise.allSettled(targets.map((b) => {
			const baseName = b.baseName
			return fetch(`${API_BASE_URL}/admin/textbook/${encodeURIComponent(baseName)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ approvalStatus: 'approved', sellStatus: 'selling' }),
			})
		}))
		await refreshRegistered()
		clearAll()
	}

	// 벌크 판매중지: 승인 + 판매중 상태만 처리
	const handleBulkStopSale = async () => {
		const targets = allBooks.filter((b) => selected.has(b.id) && b._registered && b.appr === 'approved' && b.sell === 'selling')
		if (targets.length === 0) { clearAll(); return }
		await Promise.allSettled(targets.map((b) => {
			const baseName = b.baseName
			return fetch(`${API_BASE_URL}/admin/textbook/${encodeURIComponent(baseName)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sellStatus: 'stopped' }),
			})
		}))
		await refreshRegistered()
		clearAll()
	}

	// 벌크 삭제: 서버 등록 교재만
	const handleBulkDelete = async () => {
		const targets = allBooks.filter((b) => selected.has(b.id) && b._registered)
			if (targets.length === 0) { clearAll(); return }
			if (!window.confirm(`선택한 ${targets.length}개 교재를 삭제하시겠습니까? (등록된 교재만 실제 삭제되며 되돌릴 수 없습니다.)`)) return
			await Promise.allSettled(targets.map((b) => {
			const baseName = b.baseName
			return fetch(`${API_BASE_URL}/admin/textbook/${encodeURIComponent(baseName)}`, {
				method: 'DELETE',
			})
		}))
		await refreshRegistered()
		clearAll()
	}

	// 멀티셀렉트
	const toggleMsOpt = (key, val) => {
		const allVals = MS_OPT_VALUES[key]||[]
		setMsSel(s => {
		const cur = [...s[key]]
		if(val==='__all__') {
		return {...s, [key]: cur.length===allVals.length ? [] : [...allVals]}
	}
	const idx = cur.indexOf(val)
		if(idx>=0) cur.splice(idx,1); else cur.push(val)
		return {...s, [key]: cur}
		})
	}

	const toggleMs = (key, e) => {
		e.stopPropagation()
		setMsOpen(o => {
			const was = o[key]
			return {subject:false, lg:false, pub:false, [key]: !was}
		})
		setCalOpen(false)
	}

	// 학년 드롭다운
	const toggleLgAll = () => {
	const all = LG_LEVELS.flatMap(lgAllForLevel)
		setMsSel(s => ({...s, lg: s.lg.length===all.length ? [] : [...all]}))
	}
	const toggleLgLevel = (lv) => {
		const keys = lgAllForLevel(lv)
		const isAllSel = keys.length>0 && keys.every(k=>msSel.lg.includes(k))
		setMsSel(s => ({
			...s,
			lg: isAllSel ? s.lg.filter(k=>!k.startsWith(lv+'|')) : [...new Set([...s.lg, ...keys])]
		}))
	}
	const toggleLgGrade = (lv, g) => {
		const k = lgKey(lv,g)
		setMsSel(s => ({
			...s,
			lg: s.lg.includes(k) ? s.lg.filter(x=>x!==k) : [...s.lg, k]
		}))
	}

	const isLvAllSel = (lv) => { const keys=lgAllForLevel(lv); return keys.length>0&&keys.every(k=>msSel.lg.includes(k)) }
	const isLvSomeSel = (lv) => lgAllForLevel(lv).some(k=>msSel.lg.includes(k))

	// 달력
	const moveCal = (dir) => {
		setCalView(v => {
			let m = v.month+dir, y = v.year
			if(m<0){m=11;y--} if(m>11){m=0;y++}
			return {year:y, month:m}
		})
	}
	const selectDay = (y,m,d) => {
		const date = new Date(y,m,d); date.setHours(0,0,0,0)
		setCalSel(s => {
			if(s.picking==='start'||!s.start||(s.start&&s.end)){
				return {start:date, end:null, picking:'end'}
			} else {
				if(date<s.start) return {start:date, end:s.start, picking:'start'}
					return {start:s.start, end:date, picking:'start'}
			}
		})
	}
	const applyCal = () => {
		if(calSel.start&&calSel.end) setDateLabel(`${fmtDate(calSel.start)} ~ ${fmtDate(calSel.end)}`)
		else if(calSel.start) setDateLabel(fmtDate(calSel.start))
		else setDateLabel('전체 기간')
		setAppliedCalSel({start:calSel.start, end:calSel.end})
		setCalOpen(false)
	}
	const clearCal = () => {
		setCalSel({start:null,end:null,picking:'start'})
		setDateLabel('전체 기간')
		setAppliedCalSel({start:null,end:null})
	}

	// 칩 (활성 필터)
	const getChips = () => {
		const chips = []
		msSel.subject.forEach(v => chips.push({type:'ms',key:'subject',val:v,label:v}))
		LG_LEVELS.forEach(lv => {
			const lvKeys = lgAllForLevel(lv)
			if(lvKeys.length>0&&lvKeys.every(k=>msSel.lg.includes(k))) {
				chips.push({type:'lg_level',level:lv,label:lv})
			} else {
				;(GRADE_MAP[lv]||[]).forEach(g => { if(msSel.lg.includes(lgKey(lv,g))) chips.push({type:'lg_grade',level:lv,grade:g,label:lv+' '+g}) })
			}
		})
		msSel.pub.forEach(v => chips.push({type:'ms',key:'pub',val:v,label:v}))
		if(dateLabel!=='전체 기간') chips.push({type:'date',label:dateLabel})
		return chips
	}
	const chips = getChips()

	const removeChip = (c) => {
		if(c.type==='ms') setMsSel(s => ({...s, [c.key]:s[c.key].filter(v=>v!==c.val)}))
		else if(c.type==='lg_level') setMsSel(s => ({...s, lg:s.lg.filter(k=>!k.startsWith(c.level+'|'))}))
		else if(c.type==='lg_grade') setMsSel(s => ({...s, lg:s.lg.filter(k=>k!==lgKey(c.level,c.grade))}))
		else if(c.type==='date') clearCal()
	}
	const resetAll = () => {
		setMsSel({subject:[],lg:[],pub:[]})
		clearCal()
	}

	// 달력 렌더
	const renderCalDays = () => {
		const firstDay = new Date(calView.year,calView.month,1).getDay()
		const daysInMonth = new Date(calView.year,calView.month+1,0).getDate()
		const today = new Date(); today.setHours(0,0,0,0)
		const cells = []
		CDAYS.forEach(d => cells.push(<div key={'dow-'+d} className="cal-dow">{d}</div>))
		for(let i=0;i<firstDay;i++) cells.push(<div key={'empty-'+i} className="cal-day empty"></div>)
		for(let d=1;d<=daysInMonth;d++) {
			const date = new Date(calView.year,calView.month,d); date.setHours(0,0,0,0)
			let cls = 'cal-day'
			if(date.getTime()===today.getTime()) cls+=' today'
			const isStart = calSel.start&&date.getTime()===calSel.start.getTime()
			const isEnd = calSel.end&&date.getTime()===calSel.end.getTime()
			const inRange = calSel.start&&calSel.end&&date>calSel.start&&date<calSel.end
			if(isStart) cls+=' sel-start'
			if(isEnd) cls+=' sel-end'
			if(inRange||isStart||isEnd) cls+=' in-range'
			cells.push(<div key={d} className={cls} onClick={e=>{e.stopPropagation();selectDay(calView.year,calView.month,d)}}>{d}</div>)
		}
		return cells
	}

	const calHint = () => {
		if(calSel.start&&calSel.end) return <span>기간이 선택되었습니다. <span>적용</span>을 눌러 확인하세요</span>
		if(calSel.start) return <span><span>종료일</span>을 선택해 주세요</span>
		return <span><span>시작일</span>을 선택해 주세요</span>
	}
	const calRangeDisplay = () => {
		if(calSel.start&&calSel.end) return `${fmtDate(calSel.start)} ~ ${fmtDate(calSel.end)}`
		if(calSel.start) return `${fmtDate(calSel.start)} ~`
		return ''
	}

	// LG 패널
	const renderLgPanel = () => {
		const allKeys = LG_LEVELS.flatMap(lgAllForLevel)
		const allSel = msSel.lg.length===allKeys.length&&allKeys.length>0
		return (
			<>
				<div className="ms-opt ms-all" onClick={toggleLgAll}>
					<input type="checkbox" readOnly checked={allSel} /> 전체
				</div>
				{LG_LEVELS.map(lv => (
				<div key={lv}>
					<div className="ms-lv-row" onClick={()=>toggleLgLevel(lv)}>
						<input type="checkbox" readOnly checked={isLvAllSel(lv)} style={{opacity:isLvSomeSel(lv)&&!isLvAllSel(lv)?'.45':'1'}} /> {lv}
					</div>
					{(GRADE_MAP[lv]||[]).map(g => (
					<div key={g} className="ms-sub-opt" onClick={()=>toggleLgGrade(lv,g)}>
						<input type="checkbox" readOnly checked={msSel.lg.includes(lgKey(lv,g))} /> {g}
					</div>
				))}
				</div>
				))}
			</>
		)
	}

	const allChecked = selected.size === allBooks.length
	const someChecked = selected.size > 0 && selected.size < allBooks.length



	return (
		<>
			{/* searchBar */}
			<div className="searchBarBox">		
				<div className="search-action-bar">
					<div className="filter-search">						
						<Icon.Search />
						<input type="text" placeholder="교재명, 저자, 출판사 검색" />
					</div>
					<button className={`filter-toggle-btn${filterOpen ? ' active' : ''}`} onClick={() => setFilterOpen(o=>!o)} >
						<Icon.Filter />						
						필터 {chips.length > 0 && <span className="filter-count-badge">{chips.length}</span>}
					</button>
					<div className="bar"></div>
					<button className="btn-export"><Icon.Down /> 엑셀 다운</button>
					<div className="filter-spacer"></div>
					<button className="btn-register" onClick={() => onNavigate('교재 등록')}><Icon.Plus /> 교재 등록</button>
				</div>		

				{/* filterPanel */}
				<div className={`filter-panel${filterOpen ? ' open' : ''}`} id="filterPanel">
					{/* 과목 */}
					<div className="ms-wrap" onClick={e=>e.stopPropagation()}>
						<div className={`ms-btn${msSel.subject.length>0?' has-value':''}${msOpen.subject?' open':''}`} onClick={e=>toggleMs('subject',e)}>
							<span>{msSel.subject.length>0 ? msSel.subject.join(', ') : '과목'}</span>
							<span className="ms-arr"><Icon.Arrow /></span>
						</div>
						{msOpen.subject && (
						<div className="ms-panel open">
							<div className="ms-opt ms-all" onClick={()=>toggleMsOpt('subject','__all__')}>
								<input type="checkbox" readOnly checked={msSel.subject.length===MS_OPT_VALUES.subject.length&&MS_OPT_VALUES.subject.length>0} /> 전체
							</div>
							{MS_OPT_VALUES.subject.map(v => (
								<div key={v} className="ms-opt" onClick={()=>toggleMsOpt('subject',v)}>
									<input type="checkbox" readOnly checked={msSel.subject.includes(v)} /> {v}
								</div>
							))}
						</div>
						)}
					</div>

					{/* 과정/학년 */}
					<div className="ms-wrap" onClick={e=>e.stopPropagation()}>
						<div className={`ms-btn${msSel.lg.length>0?' has-value':''}${msOpen.lg?' open':''}`} onClick={e=>toggleMs('lg',e)}>
							<span>과정/학년</span>
							<span className="ms-arr"><Icon.Arrow /></span>
						</div>
						{msOpen.lg && (
						<div className="ms-panel open" style={{minWidth:'160px'}}>{renderLgPanel()}</div>
						)}
					</div>

					{/* 출판사 */}
					<div className="ms-wrap" onClick={e=>e.stopPropagation()}>
						<div className={`ms-btn${msSel.pub.length>0?' has-value':''}${msOpen.pub?' open':''}`} onClick={e=>toggleMs('pub',e)}>
							<span>{msSel.pub.length>0 ? msSel.pub.join(', ') : '출판사'}</span>
							<span className="ms-arr"><Icon.Arrow /></span>
						</div>
						{msOpen.pub && (
						<div className="ms-panel open">
							<div className="ms-opt ms-all" onClick={()=>toggleMsOpt('pub','__all__')}><input type="checkbox" readOnly checked={msSel.pub.length===PUB_VALUES.length&&PUB_VALUES.length>0} /> 전체</div>
							{PUB_VALUES.map(v => (
							<div key={v} className="ms-opt" onClick={()=>toggleMsOpt('pub',v)}><input type="checkbox" readOnly checked={msSel.pub.includes(v)} /> {v}</div>
							))}
						</div>
						)}
					</div>

					{/* 날짜 */}
					<div className="filter-date-wrap" onClick={e=>e.stopPropagation()}>
						<div className={`filter-date${calOpen?' active':''}${dateLabel!=='전체 기간'?' has-value':''}`} onClick={e=>{e.stopPropagation();setCalOpen(o=>!o)}}>
							<Icon.Calendar /><span>{dateLabel}</span>
						</div>
						{calOpen && (
						<div className="cal-panel open" id="calPanel">
							<div className="cal-header">
								<button className="cal-nav" onClick={()=>moveCal(-1)}><Icon.calNavLeft /></button>
								<span className="cal-title">{calView.year}년 {MONTHS[calView.month]}</span>
								<button className="cal-nav" onClick={()=>moveCal(1)}><Icon.calNavRight /></button>
							</div>
							<div className="cal-hint">{calHint()}</div>
							<div className="cal-grid">{renderCalDays()}</div>
							<div className="cal-footer">
								<span className={`cal-range-display${calRangeDisplay()?' filled':''}`}>{calRangeDisplay()}</span>
								<div className="cal-btns">
									<span className="cal-clear" onClick={clearCal}>초기화</span>
									<button className="cal-apply" onClick={applyCal}>적용</button>
								</div>
							</div>
						</div>
						)}
					</div>
				</div>

				{/* 활성 필터 칩 */}
				{chips.length > 0 && (
					<div className="chip-bar" style={{display:'flex'}}>
						{chips.map((c,i) => (
						<span key={i} className="chip">
							{c.label}
							<button className="chip-x" onClick={()=>removeChip(c)}><Icon.chipX /></button>
						</span>
						))}
						<button className="chip-reset" onClick={resetAll}>전체 초기화</button>
					</div>
				)}
			</div>

			<h2 className="subPageTitle">교재 목록</h2>
			<div className="result-bar">
				<div className="result-left">
					<div className="result-count">총 <strong>284</strong>건</div>
					<div className="bar"></div>
					{['전체 284','판매중 212','검토중 38','반려 15','판매중지 19'].map(t => {
						const [label] = t.split(' ')
						return (
							<span key={t} className={`rs-tab${rsTab===label?' active':''}`} onClick={()=>setRsTab(label)}>
								{t.replace(' ', ' ')}<span className="rs-count"></span>
							</span>
						)
					})}
				</div>
				<div className="result-right">
					{effectiveView === 'card' && (
					<>
						<div className="cb-wrap" onClick={toggleAll} style={{cursor:'pointer'}}>
							<div className={`cb${isAllPagedChecked ? ' checked' : ''}${isSomePagedChecked ? ' indeterminate' : ''}`}>
								{isAllPagedChecked && <Icon.pageCheck />}
								{someChecked && !isAllPagedChecked && <Icon.pageunCheck />}
							</div>
						</div>
					</>
					)}
					<div className="per-page-wrap">표시 
						<select 
							className="per-page-sel"
							value={`${itemsPerPage}개`} 
							onChange={handlePerPageChange}
						>
							<option>12개</option>
							<option>24개</option>
							<option>48개</option>
						</select>
					</div>
					<div className="view-toggle">
						<button className={`view-btn${effectiveView === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="리스트형"><Icon.listView /></button>
						<button className={`view-btn${effectiveView === 'card' ? ' active' : ''}`} onClick={() => setViewMode('card')} title="카드형"><Icon.cardView /></button>
					</div>
				</div>
			</div>

			<div className="bookListBox" className={`bookListBox ${effectiveView === 'card' ? ' card' : 'list'}`}>
				<div className="cardListTop">
					<div className="cb-wrap">
						<div className={`cb${isAllPagedChecked ? ' checked' : ''}`} onClick={toggleAll}>{isAllPagedChecked && <Icon.pageCheck />}</div>
					</div>
					<div className="list-th ls1"><span>교재명</span></div>
					<div className="list-th ls2"><span>출판사</span></div>
					<div className="list-th ls3"><span>과목</span></div>
					<div className="list-th ls4"><span>학년</span></div>
					<div className="list-th ls5"><span>저자</span></div>
					<div className="list-th ls6"><span>가격</span></div>
					<div className="list-th ls7"><span>판매량</span></div>
					<div className="list-th ls8"><span>승인</span></div>
					<div className="list-th ls9"><span>판매</span></div>
					<div className="list-th ls10"><span>등록일</span></div>
				</div>
				<ul>
					{pagedBooks.map(b => {
						const origPrice = b.disc ? Math.round(b.price/(1-b.disc/100)/100)*100 : null
						const isSel = selected.has(b.id)
						return (
							<li key={b.id} className={`${isSel ? ' selected' : ''}`} onClick={() => handleBookOpen(b)} style={{cursor: isEditable(b) ? 'pointer' : 'default'}}>
								<div className="cb-wrap">
									<div className={`cb${isSel?' checked':''}`} onClick={e=>{e.stopPropagation();toggleRow(b.id)}}>										
										{isSel && <Icon.pageCheck />}
									</div>
								</div>
								<div className="book-cell">									
									{b.thumbnailUrl ? (
										<div className="book-thumb"><img src={b.thumbnailUrl} alt={b.name} className="book-thumb-img" /></div>
									) : (
										<div className="book-thumb" style={{background:`${b.color}18`, borderColor:`${b.color}30`}}><svg width="20" height="24" viewBox="0 0 22 26" fill="none" stroke={b.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1" width="18" height="24" rx="2"/><path d="M6 8h10M6 12h10M6 16h6"/></svg></div>
									)}										
									
									<div className="book-info">
										<div className="book-name">{b.name}</div>
										<div className="book-id">{b.id}</div>
									</div>
								</div>
								<div className="book-meta">
									<div className="meta1"><span>{b.pub}</span></div>
									<div className="meta2"><span>{b.subj}</span></div>
									<div className="meta3"><span>{b.grade}</span></div>
								</div>
								<div className="book-author"><span>{b.author}</span></div>
								<div className="book-price">
									<div className="price-val">{b.price.toLocaleString()}원</div>
									{b.disc > 0 && <div className="price-disc">−{b.disc}% <span className="price-orig">{origPrice.toLocaleString()}원</span></div>}
								</div>
								<div className="book-sellnum">
									{effectiveView === 'list' ? <span>{b.sales !== null ? b.sales.toLocaleString() : '—'}</span>
										: <span>{b.sales !== null ? `판매 ${b.sales.toLocaleString()}권` : '—'}</span>}
								</div>
								<div className="book-dotbox">								
									<div className="book-dot dot1">
										<span className={`sbadge ${b.appr}`}><span className="sbadge-dot"></span>{APPR[b.appr]}</span>
									</div>
									<div className="book-dot dot2" className={`book-dot dot2 ${b.sell ? '' : 'no'}`}>
										{b.sell ? <span className={`sbadge ${b.sell}`}><span className="sbadge-dot"></span>{SELL[b.sell]}</span>
											: ''}
									</div>
								</div>
								<div className="book-date">
									<span className="date">{b.date}</span>
									{b.updates && b.updates.length > 0 && (
										<span className="upd-trigger">업데이트 이력
											<div className="upd-tooltip">
												{b.updates.map((u,i) => (
													<div key={i} className="upd-entry">
														<span className="upd-edate">{u.date}</span>
														<span className="upd-eitem">{u.item}</span>
													</div>
												))}
											</div>
										</span>
								      )}
								</div>
							</li>
						)
					})}
				</ul>
			</div>

			<div className="pagination">
				<span 
					className={`btn prev ${currentPage === 1 ? 'disabled' : ''}`}
					onClick={() => handlePageChange(currentPage - 1)}
				><Icon.pageArwLeft /></span>

				{getPageNumbers().map((p, idx) => (
					p === '...' ? (
						<em key={`ell-${idx}`} className="pg-ellipsis">···</em>
					) : (
						<span 
							key={p} 
							className={currentPage === p ? 'active' : ''}
							onClick={() => handlePageChange(p)}
						>
							{p}
						</span>
					)
				))}

				<span 
					className={`btn next ${currentPage === totalPages ? 'disabled' : ''}`}
					onClick={() => handlePageChange(currentPage + 1)}
				><Icon.pageArwRight /></span>
			</div>

			{/* float info pop */}
			<div className={`bulk-float ${selected.size > 0 ? 'show' : ''}`}>
				<div className="count">{selected.size}건 선택됨</div>
				<span className="bar"></span>
				<div className="bkb" onClick={handleBulkApprove}><Icon.floatApprove />승인</div>
				<div className="bkb" onClick={handleBulkStopSale}><Icon.floatStopSale />판매중지</div>
				<span className="bar"></span>
				<div className="bkb danger" onClick={handleBulkDelete}><Icon.floatDelete />삭제</div>
				<span className="bar"></span>
				<div className="bkb cancel" onClick={clearAll}><Icon.floatClearAll />취소</div>
			</div>
		</>
	)
}


