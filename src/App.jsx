import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MainContents from './components/MainContents';

function App() {
	const [isCollapsed, setIsCollapsed] = useState(true);
	const [openMenuIndex, setOpenMenuIndex] = useState(null);
	const [isAdminOpen, setIsAdminOpen] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [nowMainLabel, setNowMainLabel] = useState("관리 홈");
	const [nowSubLabel, setNowSubLabel] = useState("");
	const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1200);
	const [isRegisterPage, setIsRegisterPage] = useState(false);

	useEffect(() => {
		if (isDarkMode) { document.body.classList.add('dark'); } 
		else { document.body.classList.remove('dark'); }
	}, [isDarkMode]);

	useEffect(() => {
		const handleResize = () => setIsNarrow(window.innerWidth < 1200)
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
		setIsAdminOpen(false);
	};

	const toggleAdminOpt = () => {
		setIsAdminOpen(!isAdminOpen);
		setOpenMenuIndex(null);
	};
	const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

	const handleMenuClick = (index, item) => {
		setOpenMenuIndex(openMenuIndex === index ? null : index);
		setIsAdminOpen(false);
		if (item.sub.length === 0) {
			setNowMainLabel(item.label);
			setNowSubLabel("");
			setIsRegisterPage(false);
		}
	};

	const handleSubMenuClick = (parentLabel, subLabel) => {
		setIsAdminOpen(false);
		setNowMainLabel(parentLabel);
		setNowSubLabel(subLabel);
		setOpenMenuIndex(null);
		setIsRegisterPage(false);
	};

	const handleNavigate = (target) => {
		if (target === 'textbook-list') {
			setIsRegisterPage(false); 
			setNowMainLabel("교재");
			setNowSubLabel("교재 목록");
		} else if (target === '교재 등록' || target === 'textbook-register') {
			setIsRegisterPage(true);
		}
	};

	return (		
		<div className="app-container">
			<Sidebar 
				isCollapsed={isNarrow || isCollapsed}
				isNarrow={isNarrow}
				toggleSidebar={toggleSidebar}
				openMenuIndex={openMenuIndex}
				handleMenuClick={handleMenuClick}
				handleSubMenuClick={handleSubMenuClick}
				nowMainLabel={nowMainLabel}
				nowSubLabel={nowSubLabel}
				isAdminOpen={isAdminOpen}
				toggleAdminOpt={toggleAdminOpt}
				isDarkMode={isDarkMode}
				toggleDarkMode={toggleDarkMode}
			/>

			<div className={`main-layout ${isCollapsed || isNarrow ? 'full' : ''}`}>
				<header className="top-bar">
					<div className="tb-left">
						<span className="nav-main">{nowMainLabel}</span>
						{nowSubLabel && (
							<>
								<span className="nav-divider"></span>
								<span className="nav-sub">{nowSubLabel}</span>
							</>
						)}
						{isRegisterPage && (
							<>
								<span className="nav-divider"></span>
								<span className="nav-sub">교재 등록</span>
							</>
						)}
					</div>
					<div className="tb-right">
						<div className="tb-item">
							<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5a4.5 4.5 0 00-4.5 4.5v2.5L2 10h12l-1.5-1.5V6A4.5 4.5 0 008 1.5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>
							<em className="new-dot">3</em>
						</div>
					</div>
				</header>

				<main className="MainContents">
					<MainContents 
						nowMainLabel={nowMainLabel} 
						nowSubLabel={nowSubLabel} 
						isRegisterPage={isRegisterPage}
						onNavigate={handleNavigate}
					/>
				</main>
			</div>
		</div>
	);
}

export default App;