import React from 'react';

	// 사이드바 전용 아이콘 데이터
	const mainMenuIcon = {
		adminHome: (	<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5"/></svg>),
		member: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><circle cx="9" cy="6.5" r="2.7"/><path d="M3 16c0-2.9 2.4-4.8 6-4.8s6 1.9 6 4.8Z"/></svg>),
		book: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5a1 1 0 011-1h4.3l1.5 2H15a1 1 0 011 1v5.5a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"/></svg>),
		cp: (			<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><text x="9" y="9" textAnchor="middle" dominantBaseline="central" fontSize="6.5" fontWeight="600" fill="currentColor" stroke="none">CP</text></svg>),
		shop: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h1.5l2 8h7l1.5-5.5H5"/><circle cx="7.5" cy="14" r="1"/><circle cx="12.5" cy="14" r="1"/></svg>),
		subscribe: (	<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><rect x="2" y="2" width="14" height="14" rx="2"/><path d="M6 13V9M9 13V7M12 13V5"/></svg>),
		community: (	<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><path d="M2 13h14M2 9h9M2 5h11"/></svg>),
		notice: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2C5.134 2 2 4.91 2 8.5c0 1.9.83 3.61 2.17 4.84L3.5 16l3.2-1.52A7.3 7.3 0 009 15c3.866 0 7-2.91 7-6.5S12.866 2 9 2z"/><circle cx="6.5" cy="8.5" r=".6" fill="currentColor" stroke="none"/><circle cx="9" cy="8.5" r=".6" fill="currentColor" stroke="none"/><circle cx="11.5" cy="8.5" r=".6" fill="currentColor" stroke="none"/></svg>),
		stats: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><path d="M3 14V10M7 14V6M11 14V9M15 14V4"/></svg>),
		collapse: (		<svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="14" height="14" rx="2.5"/><path d="M7 2v14"/></svg>),
		profile: (		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.0" stroke-linecap="round"><circle cx="7" cy="5" r="2.5"/><path d="M2 12c0-2.761 2.239-4.5 5-4.5s5 1.739 5 4.5"/></svg>),
		settings: (		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.0" stroke-linecap="round"><line x1="1" y1="2.5" x2="2.5" y2="2.5"/><circle cx="4" cy="2.5" r="1.5"/><line x1="5.5" y1="2.5" x2="13" y2="2.5"/><line x1="1" y1="7" x2="8.5" y2="7"/><circle cx="10" cy="7" r="1.5"/><line x1="11.5" y1="7" x2="13" y2="7"/><line x1="1" y1="11.5" x2="5.5" y2="11.5"/><circle cx="7" cy="11.5" r="1.5"/><line x1="8.5" y1="11.5" x2="13" y2="11.5"/></svg>),
		darkmode: (	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1.75a3.5 3.5 0 0 0 5.25 5.25 5.25 5.25 0 1 1-5.25-5.25Z"/></svg>),
		logout: (		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"><path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9 10l3-3-3-3M12 7H5"/></svg>),
	};

	const Sidebar = ({ 
		isCollapsed, isNarrow, toggleSidebar, 
		openMenuIndex, handleMenuClick, handleSubMenuClick, 
		nowMainLabel, nowSubLabel, 
		isAdminOpen, toggleAdminOpt, 
		isDarkMode, toggleDarkMode 
	}) => {

	const menuData = [
	    { label: "관리 홈", icon: mainMenuIcon.adminHome, sub: [] },
	    { label: "회원", icon: mainMenuIcon.member, sub: ["학생", "교사 · 강사"] },
	    { label: "교재", icon: mainMenuIcon.book, sub: ["교재 목록", "발행 대기"] },
	    { label: "CP사", icon: mainMenuIcon.cp, sub: ["계정 관리", "콘텐츠", "정산", "통계"] },
	    { label: "쇼핑몰", icon: mainMenuIcon.shop, sub: ["상품 · 전시", "운영"] },
	    { label: "구독 · 결제", icon: mainMenuIcon.subscribe, sub: ["결제 관리", "쿠폰", "요금제 설정"] },
	    { label: "커뮤니티", icon: mainMenuIcon.community, sub: ["게시물 · 댓글", "신고 처리"], update: 3 },
	    { label: "공지 · 푸시", icon: mainMenuIcon.notice, sub: ["공지", "푸시 발송"] },
	    { label: "통계", icon: mainMenuIcon.stats, sub: ["매출", "회원", "학습 · 콘텐츠"] }
	];

	return (
		<div className={`mainMenu ${isCollapsed ? 'sm' : ''}`}>
			<div className="mainLogo"><span className="logo-mark"></span></div>
			<div className="muArea">
				<ul className="menuList">
					{menuData.map((item, idx) => {
						const isNow = nowMainLabel === item.label;
						return (
							<li key={idx} className={`${openMenuIndex === idx ? 'open' : ''} ${isNow ? 'now' : ''}`}>
								<div className="mmbox" onClick={() => handleMenuClick(idx, item)}>
									<span className="ico">{item.icon}</span>
									<span className="mm-label">{item.label}</span>
									{item.update && <span className="update">{item.update}</span>}
									{item.update && <em className="dot"></em>}
								</div>
								{item.sub.length > 0 && (
									<div className="sbbox">
										<div className="sb-tit">{item.label}</div>					  
										{item.sub.map((subItem, subIdx) => (
											<div key={subIdx}  
												className={`sb-label ${isNow && nowSubLabel === subItem ? 'on' : ''}`}
												onClick={(e) => {
													e.stopPropagation();
													handleSubMenuClick(item.label, subItem);
												}}
											>
												{subItem}
											</div>
										))}
									</div>
								)}
							</li>
						);
					})}
				</ul>
				{!isNarrow && (
				<div className="muCollapse">
					<div className="mmbox" onClick={toggleSidebar}>
						<span className="ico">{mainMenuIcon.collapse}</span>
						<span className="mm-label">메뉴 접기</span>
					</div>
				</div>
				 )}
			</div>
			<div className={`mmAdmin ${isAdminOpen ? 'active' : ''}`}>
				<div className="mmbox" onClick={toggleAdminOpt}>
					<span className="ico adm">관</span>
					<div className="mm-label"><strong className="op-name">관리자</strong><span className="op-txt">수퍼 어드민</span></div>
				</div>
				<div className="optbox">
					<div className="optTop"><strong className="op-name">관리자</strong><span className="op-txt">admin@pdep.co.kr</span></div>
					<ul>
						<li><span className="ico">{mainMenuIcon.profile}</span><em>내 프로필</em></li>
						<li><span className="ico">{mainMenuIcon.settings}</span><em>시스템 설정</em></li>
						<li onClick={toggleDarkMode}>
							<span className="ico">{mainMenuIcon.darkmode}</span>
							<em>다크 모드</em>
							<div className={`dkToggle ${isDarkMode ? 'on' : ''}`}><div className="dkToggle-thumb"></div></div>
						</li>
						<li className="op-out"><span className="ico">{mainMenuIcon.logout}</span><em>로그아웃</em></li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;