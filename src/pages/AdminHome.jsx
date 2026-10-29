import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminHome.css';
import { buildDonut, buildLine, legendHtml, donutLegendHtml } from '../data/charts';
import { todos, SDATA, TDATA, TY, TM, WIN, MIN_DM, MON, mData, topData, learnData } from '../data/chartsData';
import { qAll, qIcons } from '../data/quickMenu';


const AdminHome = () => {

	// ── 인사말 및 날짜 ──
	const now = new Date();
	const h = now.getHours();
	const greeting = h < 12 ? '좋은 아침이에요,<br/><strong>관리자</strong>님.' : h < 18 ? '안녕하세요,<br/><strong>관리자</strong>님.' : '수고 많으셨어요,<br/><strong>관리자</strong>님.';
	const days = ['일', '월', '화', '수', '목', '금', '토'];
	const datestr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;


	// ── 날씨 ──
	const [weather, setWeather] = useState(() => {
		try {
			const c = localStorage.getItem('pdep-weather');
			return c ? JSON.parse(c) : null;
		} catch { return null; }
	});

	useEffect(() => {
		const fallback = { temp: '--', code: 0, isDay: h >= 6 && h < 20 };
		const ctrl = new AbortController();
		const timer = setTimeout(() => { ctrl.abort(); setWeather(w => w || fallback); }, 4000);
		fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code,is_day&timezone=Asia%2FSeoul', { signal: ctrl.signal })
		.then(r => r.json())
		.then(data => {
			clearTimeout(timer);
			const w = {
				temp: parseFloat(data.current.temperature_2m).toFixed(1),
				code: data.current.weather_code,
				isDay: data.current.is_day === 1
			};
			setWeather(w);
			try { localStorage.setItem('pdep-weather', JSON.stringify(w)); } catch { }
		})
		.catch(() => { clearTimeout(timer); setWeather(w => w || fallback); });
	}, [h]);


	// ── Todo ──
	const [todoCur, setTodoCur] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const todoTimerRef = useRef(null);
	const todoTrackRef = useRef(null);
	const TH = 20; // 리스트 한 칸의 높이 (CSS에 맞춰 조절)

	const setTPos = useCallback((idx, animate) => {
		const track = todoTrackRef.current;
		if (!track) return;
		track.style.transition = animate ? 'transform .42s cubic-bezier(.4,0,.2,1)' : 'none';
		track.style.transform = `translateY(-${idx * TH}px)`;
	}, []);

	const todoNext = useCallback(() => {
		setTodoCur(cur => {
			const next = (cur + 1) % todos.length;
			setTPos(next + 1, true);
			if (next === 0) setTimeout(() => setTPos(1, false), 450);
			return next;
		});
	}, [setTPos]);

	useEffect(() => {
		if (isOpen) return;
		const timer = setInterval(() => {
			setTodoCur((prev) => (prev + 1) % todos.length);
		}, 4000);
		return () => clearInterval(timer);
	}, [isOpen]);

	const handleToggleTodo = () => {
		setIsOpen(!isOpen);
	};


	// ── 바로가기 설정(Quick Menu) ──
	const [isSet, setIsSet] = useState(false);	
	const [myMenu, setMyMenu] = useState(() => {
		const saved = localStorage.getItem('pdep-quick');
		return saved ? JSON.parse(saved) : qAll.slice(0, 4).map(m => m.id);
	});

	const [tempMenu, setTempMenu] = useState([]);
	const handleSetBtnClick = () => {
		if (!isSet) {
			setTempMenu([...myMenu]);
		}
		setIsSet(!isSet);
	};

	const [showGuide, setShowGuide] = useState('');
	const toastTimer = useRef(null)
	const showToast = (msg) => {
	    setShowGuide(msg)
	    clearTimeout(toastTimer.current)
	    toastTimer.current = setTimeout(() => setShowGuide(''), 2500)
	}

	const toggleMenu = (id) => {
		setTempMenu(prev => {
			if (prev.includes(id)) {
				return prev.filter(m => m !== id);
			} else {
				if (prev.length < 4) {
					return [...prev, id];
				} else {
					showToast('바로가기는 4개까지만 설정이 가능해요.')
					return prev;
				}
			}
		});
	};

	const handleSave = () => {
		setMyMenu([...tempMenu]);
		localStorage.setItem('pdep-quick', JSON.stringify(tempMenu));
		setIsSet(false);
	};


	// ── 회원 현황 ──
	const liveVals = useRef({ 
		'stat-new': 247, 
		'stat-dau': 7843, 
		'stat-mau': 60847, 
		'stat-conv': 108 
	});
	const CONV_REF = 117; // 전월 대비 기준값

	const initLiveNum = useCallback((id) => {
		const el = document.getElementById(id);
		if(!el) return;
		const v = liveVals.current[id];
		// 구독 전환율은 소수점 처리, 나머지는 콤마(,) 처리
		el.innerHTML = id === 'stat-conv' 
		    ? buildDigits((v / 10).toFixed(1)) 
		    : buildDigits(v.toLocaleString('ko-KR'));
	}, []);

	const updateLive = useCallback((id, delta, limit) => {
		const oldVal = liveVals.current[id];
		if(limit !== undefined && oldVal >= limit) return false;
		const newVal = limit !== undefined ? Math.min(oldVal + delta, limit) : oldVal + delta;
		
		liveVals.current[id] = newVal;
		const el = document.getElementById(id);
		if(!el) return true;

		applySlots(el, oldVal.toLocaleString('ko-KR'), newVal.toLocaleString('ko-KR'), ',');
		return limit === undefined || newVal < limit;
	}, []);

	const updateConv = useCallback((delta) => {
		const oldT = liveVals.current['stat-conv'];
		const newT = Math.max(90, Math.min(145, oldT + delta));
		liveVals.current['stat-conv'] = newT
		const el = document.getElementById('stat-conv');
		if(!el) return;

		applySlots(el, (oldT / 10).toFixed(1), (newT / 10).toFixed(1), '.');
		
		// 하단 증감 표시 업데이트
		const diff = newT - CONV_REF;
		const sign = diff >= 0 ? '▲' : '▼';
		const cls = diff >= 0 ? 'up' : 'down';
		const sub = el.closest('.stat-card').querySelector('.st-diff');
		if(sub) {
		    sub.className = `st-diff ${cls}`;
		    sub.textContent = `${sign} ${(Math.abs(diff) / 10).toFixed(1)}% 전월 대비`;
		}
	}, []);

	useEffect(() => {
		// 요소가 렌더링된 후 초기화
		initLiveNum('stat-new');
		initLiveNum('stat-dau');
		initLiveNum('stat-mau');
		initLiveNum('stat-conv');

		let active = true;

		// 신규 가입자 업데이트 (3~7초 간격)
		const tickNew = () => {
		    if(!active) return;
		    updateLive('stat-new', 1);
		    setTimeout(tickNew, 3000 + Math.random() * 4000);
		};
		
		// DAU 업데이트 (1.5~4초 간격)
		const tickDau = () => {
		    if(!active) return;
		    updateLive('stat-dau', Math.random() < 0.3 ? 2 : 1);
		    setTimeout(tickDau, 1500 + Math.random() * 2500);
		};

		// 전환율 업데이트 (14~30초 간격)
		const tickConv = () => {
		    if(!active) return;
		    const cur = liveVals.current['stat-conv'];
		    const upProb = cur < 110 ? 0.7 : cur > 125 ? 0.3 : 0.5;
		    updateConv(Math.random() < upProb ? 1 : -1);
		    setTimeout(tickConv, 14000 + Math.random() * 16000);
		};

		tickNew();
		tickDau();
		tickConv();

		return () => { active = false; };
	}, [initLiveNum, updateLive, updateConv]);



	// ── 회원 차트 ──
	const [memberTab, setMemberTab] = useState('student');
	const [memberState, setMemberState] = useState({ student: { dMonth: TM }, teacher: { dMonth: TM } });
	const donutRef = useRef(null);
	const lineRef = useRef(null);

	const donutMonthStr = (dm) => {
		const y = TY; 
		const m = dm + 1;
		return `${y}년 ${m}월`;
	};

	const navDonut = (type, dir) => {
		const next = memberState[type].dMonth + dir;
		if (next < MIN_DM || next > TM) return;		
		const data = type === 'student' ? SDATA : TDATA;
		if (!data.donut[next]) return;		
		setMemberState(s => ({
			...s,
			[type]: { ...s[type], dMonth: next }
		}));
	};

	const getMemberMeta = () => {
		const st = memberState[memberTab];
		if (memberTab === 'teacher' && st.dMonth === TM) {
			const dData = TDATA.donut[TM] || { uncert: 0 };
			return (<>미인증 <span className="num-link">{dData.uncert.toLocaleString()}</span> 명</>);
		}
		return null;
	};

	// 차트 렌더링 함수 (useCallback)
	const renderMemberCharts = useCallback((animateDonut = false, animateLine = false) => {
		const type = memberTab;
		const data = type === 'student' ? SDATA : TDATA;
		const st = memberState[type];
		const dData = data.donut[st.dMonth] || { total: 0, segs: [] };

		const isDarkNow = document.body.classList.contains('dark');
	    
		if (donutRef.current) buildDonut(donutRef.current, data, dData.segs, animateDonut, false, isDarkNow); 
		if (lineRef.current) {
			const parent = lineRef.current.parentElement;
			const pw = parent.clientWidth;
			const ph = parent.clientHeight;
			lineRef.current.setAttribute('viewBox', `0 0 ${pw} ${ph}`);
			buildLine(lineRef.current, data, TM, WIN, MON, TY, animateLine, false, pw, isDarkNow);
		}		
	}, [memberTab, memberState]);

	// 탭 변경 시 차트 다시 그리기
	useEffect(() => {
		renderMemberCharts(true, true);
		const observer = new MutationObserver(() => { renderMemberCharts(false, false); });
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		const handleResize = () => renderMemberCharts(false, false);
		window.addEventListener('resize', handleResize);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', handleResize);
		};
	}, [renderMemberCharts]);

	 // tooltip mousemove
	useEffect(() => {
		const onMove = e => {
			const tooltip = document.getElementById('tooltip')
			if(tooltip && tooltip.style.opacity === '1') {
				const tw = tooltip.offsetWidth || 120
				const left = e.clientX+6+tw > window.innerWidth ? e.clientX-tw-6 : e.clientX+6
				tooltip.style.left = left+'px'
				tooltip.style.top = (e.clientY-22)+'px'
			}
		}
		document.addEventListener('mousemove', onMove)
		return () => document.removeEventListener('mousemove', onMove)
	}, [])


	// ── 교재 ──
	const [topKey, setTopKey] = useState('sub');

	// ── 구독 · 결제 ──
	const [learnTab, setLearnTab] = useState('today');


	// ── 매출  ──
	const [revYear, setRevYear] = useState(TY)
	const [revMonth, setRevMonth] = useState(TM)
	const [revDrawerOpen, setRevDrawerOpen] = useState(false)
	const [revTab, setRevTab] = useState('pct')
	const [goalPct, setGoalPct] = useState(10)
	const [goalAmount, setGoalAmount] = useState(200)
	const [revData, setRevData] = useState(() => JSON.parse(JSON.stringify(mData)))

	const rKey = (y,m) => `${y}-${m}`
	const fmt = v => (Math.round(v*100)*10000).toLocaleString() + ' 원'
	const getPrev = (y,m) => { const d=new Date(y,m-1,1); return revData[rKey(d.getFullYear(),d.getMonth())] }
	const now2 = new Date()

	const getRevInfo = () => {
		const d = revData[rKey(revYear,revMonth)]
		if(!d) return null
		const dIM = new Date(d.year,d.month+1,0).getDate()
		const rem = d.isCurrent ? dIM-now2.getDate() : 0
		const pct = Math.round((d.current/d.goal)*100)
		const prev = getPrev(d.year,d.month)
		const mom = prev ? Math.round(((d.goal-prev.goal)/prev.goal)*100) : null
		return {d, pct, rem, mom}
	}

	const revInfo = getRevInfo();

	const saveRevGoal = () => {
	    const d = revData[rKey(revYear,revMonth)]
	    if(!d) return
	    if(revTab==='pct') {
	      const prev = getPrev(revYear,revMonth)
	      if(!prev) return
	      d.goal = Math.round(prev.goal*(1+goalPct/100))
	    } else {
	      if(!goalAmount || goalAmount<=0) return
	      d.goal = goalAmount
	    }
	    setRevData({...revData})
	    setRevDrawerOpen(false)
	}

	const getPctHint = () => {
	    const prev = getPrev(revYear,revMonth)
	    if(!prev) return ''
	    return `전월 목표 ${fmt(prev.goal)} 기준 → 목표 ${fmt(Math.round(prev.goal*(1+goalPct/100)))}`
	}

	const minRevDate = new Date(TY, TM-11, 1)
	const isPrevDisabled = revYear===minRevDate.getFullYear() && revMonth===minRevDate.getMonth()
	const isNextDisabled = revYear===TY && revMonth===TM

	const changeMonth = (dir) => {
		const d = new Date(revYear, revMonth+dir, 1)
		const minDate = new Date(TY, TM - 11, 1);
		const maxDate = new Date(TY, TM, 1);    
		if (d < minDate || d > maxDate) return;

		setRevYear(d.getFullYear())
		setRevMonth(d.getMonth())
		setRevDrawerOpen(false)
	}


	return (
	<>
		{/* hero */}
		<div className="boxSection st1">
			<div className={`home-hero ${isOpen ? 'open' : ''}`}>
				<div className="hero-txt">
					<span className="ht-date">{datestr}</span>
					<h2 className="ht-tit" dangerouslySetInnerHTML={{ __html: greeting }}></h2>
				</div>
				<div className="hero-weather" id="heroWeather">
					{weather && (
						<>
						<span className="hw-icon" dangerouslySetInnerHTML={{ __html: getWmoIcon(weather.code, weather.isDay) }}></span>
						<div className="hw-info">
							<span className="hw-temp">{weather.temp}<em className="hw-deg">°</em></span>
							<span className="hw-label">{wmoLabel(weather.code)}</span>
						</div>
						</>
					)}
				</div>
				<div className="hrTodobox">
					<div className="hrTodoTit">
						<span className="label">오늘 할 일</span>
						<span className="counter"><span>{todoCur + 1}</span><em>/</em><span>{todos.length}</span></span>
						<div className="hrTodoBtn" onClick={handleToggleTodo}></div>
					</div>
					<div className="hrTodoList">
						<ul>
							{todos.map((t, i) => (
								<li 
								  key={i} 
								  className={`todo-item ${i === todoCur ? 'active' : ''} ${i === (todoCur === 0 ? todos.length - 1 : todoCur - 1) ? 'prev' : ''}`}
								>
									<span>{t.label} <strong>{t.n} 건</strong> 이 있어요.</span>
									<div className="expitem">{t.dest}</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			<div className={`home-quick ${isSet ? 'is-edit' : ''}`}>
				<div className="quickTit">
					<span>바로가기 <em>설정</em></span>
					<div className="rightbox">
						<span className="info">최대 4개 선택</span>
						<span className="quickSetBtn" onClick={handleSetBtnClick}>{isSet ? '닫기' : '설정'}</span>
					</div>
				</div>				
				<div className="quickSetBox">
					{!isSet && myMenu.length === 0 ? (
					<div className="empty-quick">
						<p>자주 쓰는 메뉴를 설정할 수 있어요.</p>
						<button className="go-set-btn" onClick={() => setIsSet(true)}>바로가기 설정</button>
					</div>
					) : (
					<ul className="quickList">
						{(isSet ? qAll : qAll.filter(m => myMenu.includes(m.id))).map((menu) => (
						<li 
							key={menu.id} 
							className={isSet && tempMenu.includes(menu.id) ? 'on' : ''} 
							onClick={() => isSet ? toggleMenu(menu.id) : console.log(`${menu.label} 이동`)}
						>
							<span className="q-icon" dangerouslySetInnerHTML={{ __html: qIcons[menu.id] }}></span>
							<span className="q-label">{menu.label}</span>
						</li>
						))}
					</ul>
					)}
					<div className="quickSetSave" onClick={handleSave}>설정 완료</div>
				</div>
			</div>
		</div>

		{/* 회원 */}
		<div className="sectionTit">회원</div>
		<div className="boxSection st2">
			<div className="bdbox home-stats">
				<div className="stat-card">
					<div className="st-label">오늘 신규 가입</div>
					<div className="st-val"><div className="live-num" id="stat-new">247</div><em className="unit">명</em></div>
					<div className="st-diff up">▲ 12% 어제 대비</div>
				</div>
				<div className="stat-card">
					<div className="st-label">DAU</div>
					<div className="st-val"><div className="live-num" id="stat-dau">247</div><em className="unit">명</em></div>
					<div className="st-diff up">▲ 3% 어제 대비</div>
				</div>
				<div className="stat-card">
					<div className="st-label">MAU</div>
					<div className="st-val"><div className="live-num" id="stat-mau">247</div><em className="unit">명</em></div>
					<div className="st-diff up">▲ 8% 전월 대비</div>
				</div>
				<div className="stat-card">
					<div className="st-label">구독 전환율</div>
					<div className="st-val"><div className="live-num" id="stat-conv">247</div><em className="per">%</em></div>
					<div className="st-diff down">▼ 0.9% 전월 대비</div>
				</div>
			</div>

			<div className="bdbox home-chart">
				<div className="member-tabbar">
					<div>
						<div className={`member-tab ${memberTab === 'student' ? 'now' : ''}`} onClick={() => setMemberTab('student')}>학생</div>
						<div className={`member-tab ${memberTab === 'teacher' ? 'now' : ''}`} onClick={() => setMemberTab('teacher')}>교사 · 강사</div>
					</div>
					<div className="member-meta">{getMemberMeta()}</div>
				</div>

				<div className="member-body">
					{/* 도넛 차트 영역 */}
					<div className="chartBox donut">
						<div className="donut-date">
							<div className="donut-label">{donutMonthStr(memberState[memberTab].dMonth)}</div>
							<div className="donut-nav">
								<span 
									className={`dnav-btn ${memberState[memberTab].dMonth <= MIN_DM ? 'disabled' : ''}`}
									onClick={() => navDonut(memberTab, -1)}
								>‹</span>
								<span 
									className={`dnav-btn ${memberState[memberTab].dMonth >= TM ? 'disabled' : ''}`}
									onClick={() => navDonut(memberTab, 1)}
								>›</span>
							</div>
						</div>
						<div className="donut-wrap">
							<svg ref={donutRef} width="180" height="180" viewBox="0 0 120 120" id="member-dsvg"></svg>
							<div className="donut-legend" dangerouslySetInnerHTML={{__html: donutLegendHtml(memberTab === 'student' ? SDATA : TDATA, (memberTab === 'student' ? SDATA : TDATA).donut[memberState[memberTab].dMonth]?.segs || []) }}></div>
						</div>
					</div>
					
					{/* 라인 차트 영역 */}
					<div className="chartBox trend">
						<div className="trend-date">
							<div className="trend-label">3개월 추이</div>
							<div className="trend-range">2026년 2월 - 2026년 4월</div>
						</div>
						<div className="trend-wrap">
							<svg ref={lineRef} width="100%" id="member-lsvg"></svg>
							<div className="line-legend" dangerouslySetInnerHTML={{__html: legendHtml(memberTab === 'student' ? SDATA : TDATA) }}></div>
						</div>
					</div>
				</div>
			</div>
		</div>

		{/* 교재 */}
		<div className="sectionTit">교재</div>
		<div className="boxSection st3">
			<div className="bdbox txtbook_rg">
				<div className="tbTitle">
					<span className="tit">교재 등록 현황</span>
					<span className="meta">전체 1,248 권</span>
				</div>
				<ul className="tbSource">
					<li><div className="source-val bk">398</div><div className="source-label">자체 등록</div></li>
					<li><div className="source-val red">850</div><div className="source-label">CP사 등록</div></li>
					<li><div className="source-val gre">+34</div><div className="source-label">이번 달 신규</div></li>
				</ul>
				<div className="tbSmTitle">학교급별 비중</div>
				<ul className="tbGrade">
					<li><div className="grade-label">초등</div><div className="grade-track"><span></span></div><div className="grade-val">38%</div></li>
					<li><div className="grade-label">중등</div><div className="grade-track"><span></span></div><div className="grade-val">32%</div></li>
					<li><div className="grade-label">고등</div><div className="grade-track"><span></span></div><div className="grade-val">22%</div></li>
					<li><div className="grade-label">N수</div><div className="grade-track"><span></span></div><div className="grade-val">8%</div></li>
				</ul>
			</div>
			
			<div className="bdbox txtbook_rk">
				<div className="tbTitle">
					<span className="tit">교재 TOP 5</span>
					<div className="tbTab">
						<span
							className={topKey === 'sub' ? 'on' : ''} 
							onClick={() => setTopKey('sub')}
						>구독순</span>
						<span
							className={topKey === 'note' ? 'on' : ''} 
							onClick={() => setTopKey('note')}
						>오답노트순</span>
						<span
							className={topKey === 'new' ? 'on' : ''} 
							onClick={() => setTopKey('new')}
						>신규순</span>
					</div>
				</div>
				<ul className="tbList">
					{topData[topKey]?.map((item, idx) => (
					<li key={idx}>
						<div className="list-rank">{idx + 1}</div>
						<div className="list-info">
							<div className="list-info-name">{item.name}</div>
							<div className="list-info-cp">{item.cp}</div>
						</div>
						<div className="list-val">{item.val}<span>{item.unit}</span></div>
					</li>
					))}
				</ul>
			</div>
		</div>

		{/* CP사 */}
		<div className="sectionTit">CP사</div>
		<div className="boxSection st4">
			<div className="bdbox">
				<div className="cpTitle">
					<span className="tit">CP사 현황</span>
					<span className="subtit">이번 달 기준</span>
				</div>
				<ul className="cpSource">
					<li><div className="source-val bk">12</div><div className="source-label">등록 CP사</div></li>
					<li><div className="source-val red">14</div><div className="source-label">승인 대기</div></li>
					<li><div className="source-val red">182,450,000 원</div><div className="source-label">정산 예정</div></li>
				</ul>
				<div className="cpTablebox">
					<table>
						<colgroup>
							<col width="*" />
							<col width="60px" />
							<col width="132px" />
							<col width="112px" />
						</colgroup>
						<thead>
							<tr>
								<th><span>출판사</span></th>
								<th>교재 수</th>
								<th>정산 예정액</th>
								<th>상태</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><span className="nico">능률</span>NE능률</td>
								<td>234 권</td>
								<td>62,400,000 원</td>
								<td>정산 예정</td>
							</tr>
							<tr>
								<td><span className="nico">미래</span>미래엔</td>
								<td>187 권</td>
								<td>48,100,000 원</td>
								<td><span className="pending">승인 대기 5 건 →</span></td>
							</tr>
							<tr>
								<td><span className="nico">천재</span>천재교육</td>
								<td>156 권</td>
								<td>39,200,000 원</td>
								<td>정산 예정</td>
							</tr>
							<tr>
								<td><span className="nico">동아</span>동아출판</td>
								<td>124 권</td>
								<td>26,400,000 원</td>
								<td>정산 예정</td>
							</tr>
							<tr>
								<td><span className="nico">EBS</span>EBS</td>
								<td>99 권</td>
								<td>18,900,000 원</td>
								<td><span className="pending">승인 대기 9 건 →</span></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		{/* 구독 · 결제 */}
		<div className="sectionTit">구독 · 결제</div>
		<div className="boxSection st5">
			<div className="bdbox payBox">
				<div className="svcTitle"><span className="tit">결제 상태별 현황</span></div>
				<ul className="svcList">
					<li>
						<span className="pyico">구독</span><div className="svcLabel">구독 중</div>
						<div className="svcRight">
							<span className="svc-num">28,412 명</span>
							<span className="svc-diff up">▲ 2.4%</span>
						</div>
					</li>
					<li>
						<span className="pyico">구매</span><div className="svcLabel">단권구매</div>
						<div className="svcRight">
							<span className="svc-num">9,340 명</span>
							<span className="svc-diff down">▲ 0.8%</span>
						</div>
					</li>
					<li>
						<span className="pyico">체험</span><div className="svcLabel">무료 체험 중</div>
						<div className="svcRight">
							<span className="svc-num">4,208 명</span>
							<span className="svc-diff">— 0%</span>
						</div>
					</li>
				</ul>
			</div>
			<div className="bdbox learnBox">
				<div className="svcTitle">
					<span className="tit">학습 · 콘텐츠 지표</span>
					<div className="svcTab">
						<span
							className={learnTab === 'today' ? 'on' : ''} 
							onClick={() => setLearnTab('today')}
						>오늘</span>
						<span
							className={learnTab === 'yesterday' ? 'on' : ''} 
							onClick={() => setLearnTab('yesterday')}
						>전일</span>
					</div>
				</div>
				<ul className="svcList">
					{learnData[learnTab]?.map((item, idx) => (
					<li key={idx}>
						<div className="svcLabel">{item.label}</div>
						<div className="svcRight">
							<span className="svc-num">{item.num} {item.unit}</span>
							{learnTab==='today' && item.diff ? <span className={`svc-diff ${item.cls}`}>{item.diff}</span> : '' }
						</div>
					</li>
					))}
				</ul>
			</div>
		</div>

		{/* 매출 */}
		<div className="sectionTit">매출</div>
		<div className="boxSection st6">
			<div className="bdbox">
				<div className="revTop">
					<div className="revLeft">
						<div className="rev-date">
							<span className="date">{revYear}년 {revMonth + 1}월</span>
							<div className="rev-nav">
								<span 
									className={`mnav-btn${isPrevDisabled ? ' disabled' : ''}`}
									onClick={() => !isPrevDisabled && changeMonth(-1)}					
								>‹</span>
								<span 
									className={`mnav-btn${isNextDisabled ? ' disabled' : ''}`}
									onClick={() => !isNextDisabled && changeMonth(1)}
								>›</span>

							</div>
						</div>
						<div className="rev-sub"onClick={() => setRevDrawerOpen(true)}>{revInfo.d.isCurrent ? '월 목표 대비 달성률' : '월 매출 결산'}</div>
					</div>
					{revInfo && (
					<div className="revRight">
						<div className="rev-amount">{fmt(revInfo.d.current)}</div>
						<div className="rev-meta">
							{revInfo.mom !== null && (
								<>
									{!revInfo.d.isCurrent && (
										<span className="info-tip">?<span className="tip-text">과거 데이터는 목표 설정을 변경할 수 없습니다.</span></span>
									)}
									<span>목표 전월 대비 {revInfo.mom>0?'+':''}{revInfo.mom}% · </span>
								</>
							)}							
							<span className={`rev-hi ${revInfo.pct >=70 ? 'hi' : 'lo'}`}>목표의 {revInfo.pct}% 달성</span>
							{revInfo.d.isCurrent && (
							    <><span> · 남은 기간 {revInfo.rem}일 · </span><span className="set-link" onClick={() => setRevDrawerOpen(prev => !prev)}>설정</span></>
							)}							
						</div>
					</div>
					)}
				</div>
				<div className="revBar">
					<div className="rev-track"><span className="rev-fill" style={{width:Math.min(revInfo.pct,100)+'%'}}></span></div>
					<div className="rev-meta"><span>0</span><span>{fmt(revInfo.d.goal)}</span></div>
				</div>
				<div className={`revDrawer ${revDrawerOpen ? 'open' : ''}`}>
					<div className="rev-dwTop">
						<div className="rev-dwTit">매출 목표 설정</div>
						<div className="rev-dwTab">
							<span className={`tab-pill${revTab==='pct' ? ' on' : ''}`} onClick={() => setRevTab('pct')}>성장률로 설정</span>
							<span className={`tab-pill${revTab==='amount' ? ' on' : ''}`} onClick={() => setRevTab('amount')}>금액으로 설정</span>
						</div>
					</div>
					<div className={`revMeta ${revTab==='pct' ? 'pct' : 'amount'}`}>
						{revTab==='pct' && (
							<>
								<div className="input-row">
									<span className="input-label">성장률</span>
									<input className="rev-input" type="text" value={goalPct} onChange={e=>setGoalPct(parseInt(e.target.value)||0)} />
									<span className="input-unit">% 상향</span>
								</div>
								<div className="input-hint" id="pctHint">{getPctHint()}</div>
								<div className="preset-row">
									{[5,10,15,20,30].map(v => <div key={v} className="preset-btn" onClick={()=>setGoalPct(v)}>+{v}%</div>)}
								</div>
							</>
						)}
						{revTab==='amount' && (
							<>
								<div className="input-row">
									<span className="input-label">목표 금액</span>
									<input className="rev-input" type="text" value={goalAmount} onChange={e=>setGoalAmount(parseInt(e.target.value)||0)} />
									<span className="input-unit">백만원</span>
								</div>
								<div className="preset-row">
									{[[100,'1억'],[150,'1.5억'],[200,'2억'],[300,'3억'],[500,'5억']].map(([v,l]) =>
										<div key={v} className="preset-btn" onClick={()=>setGoalAmount(v)}>{l}</div>
									)}
								</div>
							</>
						)}

						<div className="drawer-actions">
							<span className="btn-cancel" onClick={() => setRevDrawerOpen(false)}>취소</span>
							<span className="btn-save" onClick={saveRevGoal}>저장</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		{showGuide && (
			<div className="toastBox"><div className="toastMsg">{showGuide}</div></div>
		)}

		<div className="tooltip" id="tooltip"></div>
	</>
	);
};


//── chart ──
function buildDigits(str) {
	return str.split('').map(ch => {
		if(ch===',' || ch==='.') return `<span class="dg-sep">${ch}</span>`;
		return `<span class="dg-slot"><span class="dg-track"><span class="dg-char">${ch}</span></span></span>`;
	}).join('');
}

function animateSlot(slot, from, to) {
	const track = slot.querySelector('.dg-track')
	track.style.transition = 'none'
	track.style.transform = 'translateY(0)'
	track.innerHTML = `<span class="dg-char">${from}</span><span class="dg-char">${to}</span>`
	void track.offsetHeight
	track.style.transition = 'transform 0.38s cubic-bezier(0.16,1,0.3,1)'
	track.style.transform = 'translateY(-1.2em)'
	setTimeout(() => {
		track.style.transition = 'none'
		track.innerHTML = `<span class="dg-char">${to}</span>`
		track.style.transform = 'translateY(0)'
	}, 420)
}
function applySlots(el, oldStr, newStr, sepChar) {
	const oldDigits = oldStr.replace(new RegExp('['+sepChar+']','g'),'')
	const newDigits = newStr.replace(new RegExp('['+sepChar+']','g'),'')
	if(oldDigits.length !== newDigits.length) { el.innerHTML = buildDigits(newStr); return }
	const slots = el.querySelectorAll('.dg-slot')
	let si = 0
	for(let i=0; i<newStr.length; i++) {
		if(newStr[i] === sepChar) continue
		if(si < slots.length && oldDigits[si] !== newDigits[si]) animateSlot(slots[si], oldDigits[si], newDigits[si])
		si++
	}
}

//── weather ──
function wmoLabel(code) {
	if(code===0) return '맑음'
	if(code===1) return '대체로 맑음'
	if(code===2) return '약간 흐림'
	if(code===3) return '흐림'
	if(code>=45&&code<=48) return '안개'
	if(code>=51&&code<=55) return '이슬비'
	if(code>=61&&code<=65) return '비'
	if(code>=71&&code<=77) return '눈'
	if(code>=80&&code<=82) return '소나기'
	if(code>=85&&code<=86) return '눈 소나기'
	if(code>=95) return '뇌우'
	return '흐림'
}
function getWmoIcon(code, isDay) {
	const s = c => `<svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">${c}</svg>`
	const CP = `M11.5 0C14.5779 0 17.1534 2.13992 17.8262 5.0127C20.1592 5.17984 22 7.12443 22 9.5C22 11.9853 19.9853 14 17.5 14H4.5C2.01472 14 0 11.9853 0 9.5C0 7.01472 2.01472 5 4.5 5H5.17578C5.8531 2.13351 8.42657 0 11.5 0Z`
	const cld = (tx, ty, sc, op='.92') => `<g transform="translate(${tx},${ty}) scale(${sc})"><path d="${CP}" fill="white" opacity="${op}"/></g>`
	if(!isDay && code<=2) {
		return s(`<defs><mask id="hwmoon"><circle cx="20" cy="19" r="10" fill="white"/><circle cx="14" cy="13" r="8.5" fill="black"/></mask></defs><circle cx="20" cy="19" r="10" fill="#FFE066" mask="url(#hwmoon)"/><polygon fill="#FFE066" points="8,3 9.1,6.9 13,8 9.1,9.1 8,13 6.9,9.1 3,8 6.9,6.9"/>`)
	}
	if(code===0) return s(`<circle cx="17" cy="17" r="10" fill="#FFE066"/>`)
	if(code===1||code===2) return s(`<g transform="translate(2,6) scale(1.4)"><circle cx="15.5217" cy="5.47826" r="5.47826" fill="#FFDF4A"/><path d="M10.5 1.82611C13.3101 1.82611 15.6619 3.77958 16.2764 6.40228C18.4063 6.55501 20.0869 8.33105 20.0869 10.4999C20.0869 12.769 18.2476 14.6082 15.9785 14.6083H4.1084C1.83936 14.6082 0 12.769 0 10.4999C3.29845e-05 8.2309 1.83939 6.3917 4.1084 6.39154H4.72559C5.34391 3.77418 7.69373 1.82611 10.5 1.82611Z" fill="white"/></g>`)
	if(code===3) return s(cld(3,9,1.27))
	if(code>=45&&code<=48) return s(`<rect x="4" y="11" width="26" height="3" rx="1.5" fill="white" opacity=".85"/><rect x="4" y="17" width="26" height="3" rx="1.5" fill="white" opacity=".65"/><rect x="4" y="23" width="20" height="3" rx="1.5" fill="white" opacity=".45"/>`)
	if((code>=51&&code<=65)||(code>=80&&code<=82)) return s(`<g transform="translate(2.75,2.75) scale(1.5)"><path d="M9.85742 0C12.4957 0 14.7037 1.83432 15.2803 4.29688C17.2797 4.44035 18.8573 6.10665 18.8574 8.14258C18.8574 10.2728 17.1302 12 15 12H3.85742C1.72718 12 0 10.2728 0 8.14258C0.000150738 6.01247 1.72727 4.28613 3.85742 4.28613H4.43652C5.01692 1.82892 7.2229 0 9.85742 0Z" fill="white"/><line x1="5.85845" y1="13.817" x2="3.99652" y2="17.1296" stroke="#A1E0FD" stroke-width="1.2" stroke-linecap="round"/><line x1="8.85845" y1="13.817" x2="6.67467" y2="17.7022" stroke="#A1E0FD" stroke-width="1.2" stroke-linecap="round"/><line x1="11.8584" y1="13.817" x2="10.4865" y2="16.2579" stroke="#A1E0FD" stroke-width="1.2" stroke-linecap="round"/></g>`)
	if((code>=71&&code<=77)||(code>=85&&code<=86)) return s(`<g transform="translate(2.75,3.5) scale(1.5)"><path d="M9.85742 0C12.4957 0 14.7037 1.83432 15.2803 4.29688C17.2797 4.44035 18.8573 6.10665 18.8574 8.14258C18.8574 10.2728 17.1302 12 15 12H3.85742C1.72718 12 0 10.2728 0 8.14258C0.000150738 6.01247 1.72727 4.28613 3.85742 4.28613H4.43652C5.01692 1.82892 7.2229 0 9.85742 0Z" fill="white"/><circle cx="5" cy="14" r="1" fill="white" opacity=".8"/><circle cx="9" cy="14" r="1" fill="white" opacity=".8"/><circle cx="13" cy="14" r="1" fill="white" opacity=".8"/><circle cx="11" cy="17" r="1" fill="white" opacity=".8"/><circle cx="7" cy="17" r="1" fill="white" opacity=".8"/></g>`)
	if(code>=95) return s(`<g transform="translate(2.75,2) scale(1.5)"><line x1="5.85845" y1="13.817" x2="3.99652" y2="17.1296" stroke="#A1E0FD" stroke-width="1.2" stroke-linecap="round"/><line x1="8.85845" y1="13.817" x2="7.4865" y2="16.2579" stroke="#A1E0FD" stroke-width="1.2" stroke-linecap="round"/><path d="M10 16L13 11L12.5 14.5H14.5L11 20L12 16H10Z" fill="#FFD500"/><path d="M9.85742 0C12.4957 0 14.7037 1.83432 15.2803 4.29688C17.2797 4.44035 18.8573 6.10665 18.8574 8.14258C18.8574 10.2728 17.1302 12 15 12H3.85742C1.72718 12 0 10.2728 0 8.14258C0.000150738 6.01247 1.72727 4.28613 3.85742 4.28613H4.43652C5.01692 1.82892 7.2229 0 9.85742 0Z" fill="white"/></g>`)
	return s(cld(3,9,1.27))
}


export default AdminHome;