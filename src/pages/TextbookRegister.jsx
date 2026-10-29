import { useState, useEffect, useRef } from 'react'
import './TextbookRegister.css';
import PdfEditModal from '../components/PdfEditModal'
import { API_BASE_URL } from '../config'

const Icon = {
	listBack: () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 3L5.5 7.5l4 4.5"/></svg>),
	pdfUpload: () => (<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M26 5H13a4 4 0 00-4 4v26a4 4 0 004 4h18a4 4 0 004-4V16z"/><polyline points="26 5 26 16 37 16"/><line x1="17" y1="24" x2="27" y2="24"/><line x1="17" y1="29" x2="27" y2="29"/><line x1="17" y1="19" x2="20" y2="19"/></svg>),
	pdfUploading: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10V3M4 6l3-3 3 3"/><path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>),
	pdfUploadInfo: () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><path d="M5.5 9l2.5 2.5 4.5-5"/></svg>),
	pdfUploadThumb: () => (<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--t3)'}}><rect x="1" y="3" width="20" height="16" rx="2"/><circle cx="7" cy="9" r="1.8"/><path d="M1 17l6-6 4 4 3-4 7 6"/></svg>),
	floatSave: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4.5V7l1.8 1.8"/></svg>),
	floatPrimary: () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5"/><path d="M4.5 7l2 2 3-3"/></svg>),
}

export default function TextbookRegister({ onNavigate, editingBook }) {
	const [pdfUploaded, setPdfUploaded] = useState(false)
	const [pdfFilename, setPdfFilename] = useState('') // 서버 저장명 (sanitize됨)
	const [pdfDisplayName, setPdfDisplayName] = useState('') // 사용자에게 보이는 원본 파일명
	const [pdfUploading, setPdfUploading] = useState(false)
	const [, setPdfBaseName] = useState('')
	const [pdfModalOpen, setPdfModalOpen] = useState(false)
	const [pdfModalMode, setPdfModalMode] = useState('new') // 'new' | 'edit'
	const [pdfPageCount, setPdfPageCount] = useState(0)
	const [pdfProblemCount, setPdfProblemCount] = useState(0)
	const [editedPdfData, setEditedPdfData] = useState(null)
	const [pdfConfirmed, setPdfConfirmed] = useState(false)
	const [choiceOffsetX, setChoiceOffsetX] = useState(0)
	const [choiceOffsetY, setChoiceOffsetY] = useState(0)
	const [thumbMode, setThumbMode] = useState('auto')
	const [thumbSrc, setThumbSrc] = useState('')
	const [price, setPrice] = useState('')
	const [disc, setDisc] = useState('')
	const [title, setTitle] = useState('')
	const [author, setAuthor] = useState('')
	const [isbn, setIsbn] = useState('')
	const [publisher, setPublisher] = useState('')
	const [subject, setSubject] = useState('')
	const [grade, setGrade] = useState('')
	const [description, setDescription] = useState('')
	const [showFloatBar, setShowFloatBar] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [submitResult, setSubmitResult] = useState(null) // { type:'success'|'fail', message }
	const topbarRef = useRef(null)
	const pdfFileRef = useRef(null)
	const thumbFileRef = useRef(null)

	// editingBook이 주어지면 input 초기화
	useEffect(() => {
		if (!editingBook) return
		const m = editingBook.metadata || {}
		const p = editingBook.price || {}
		setTitle(m.title || '')
		setAuthor(m.author || '')
		setIsbn(m.isbn || '')
		setPublisher(m.publisher || '')
		setSubject(m.subject || '')
		setGrade(m.grade || '')
		setDescription(m.description || '')
		setPrice(p.price != null ? String(p.price) : '')
		setDisc(p.discount != null ? String(p.discount) : '')

		// 썸네일 모드 복원
		if (editingBook.thumbnail?.mode === 'upload' && editingBook.thumbnailUrl) {
			setThumbMode('upload')
			setThumbSrc(editingBook.thumbnailUrl)
		} else {
			setThumbMode('auto')
			setThumbSrc('')
		}

		// PDF 정보 복원 (편집 완료 상태)
		const pdfName = editingBook.pdfName || (editingBook.baseName ? `${editingBook.baseName}.pdf` : '')
		if (!pdfName) return
		{
			setPdfFilename(pdfName)
			setPdfDisplayName(editingBook.originalPdfName || pdfName)
			setPdfBaseName(pdfName.replace(/\.pdf$/i, ''))
			setPdfUploaded(true)
			setPdfConfirmed(true)
			setPdfPageCount(Number(editingBook.pageCount) || 0)
			setPdfProblemCount(Number(editingBook.problemCount) || 0)
			setEditedPdfData(null)

			// 기존 problems.json 로드 (편집 모달 없이 등록 요청 가능하도록)
			let cancelled = false
			;(async () => {
				try {
					const res = await fetch(`${API_BASE_URL}/admin/extract`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ pdfName }),
					})
					const data = await res.json()
					if (cancelled || !data.success) return
					setEditedPdfData({
						pdf: data.pdf || pdfName,
						images: data.images || [],
						problems: data.problems || [],
						pageConfig: data.pageConfig || {},
						pageSymbols: data.pageSymbols || {},
						pageTextItems: data.pageTextItems || {},
					})
				} catch (err) {
					console.warn('기존 PDF 데이터 로드 실패:', err.message)
				}
			})()
			return () => { cancelled = true }
		}
	}, [editingBook])

	// 플로팅 바: topbar-right가 안 보이면 표시
	useEffect(() => {
		const trigger = topbarRef.current
		if(!trigger) return
		const obs = new IntersectionObserver(entries => {
			setShowFloatBar(!entries[0].isIntersecting)
		}, {threshold:0})
		obs.observe(trigger)
		return () => obs.disconnect()
	}, [])

	const calcDiscPrice = () => {
		const p = parseFloat(price)||0
		const d = parseFloat(disc)||0
		if(p>0 && d>0) return Math.round(p*(1-d/100)).toLocaleString()
		if(p>0) return p.toLocaleString()
		return ''
	}

	const handlePdfFile = async (file) => {
		if(!file || file.type !== 'application/pdf') return
		if(pdfUploading) return
		// 이전 드래프트가 있으면 정리
		if(pdfFilename) cleanupDraft(pdfFilename)
		setPdfUploading(true)
		try {
			const formData = new FormData()
			formData.append('pdf', file)
			const res = await fetch(`${API_BASE_URL}/admin/upload-pdf`, {
				method: 'POST',
				headers: { 'X-File-Name': encodeURIComponent(file.name) },
				body: formData,
			})
			const data = await res.json()
			if(!data.success) throw new Error(data.message || 'PDF 업로드 실패')

			setPdfFilename(data.fileName) // sanitize된 서버 저장명
			setPdfDisplayName(file.name)  // 사용자 표시용 원본 파일명
			setPdfBaseName(data.fileName.replace(/\.pdf$/i,''))
			setEditedPdfData(null)
			setPdfConfirmed(false)
			setPdfModalMode('new')
			setPdfModalOpen(true)
		} catch (err) {
			setSubmitResult({ type:'fail', message: err.message || 'PDF 업로드에 실패했습니다.' })
		} finally {
			setPdfUploading(false)
		}
	}

	const handlePdfConfirm = (result) => {
		if(!result || typeof result !== 'object') { setPdfModalOpen(false); return }
		const { filename: fname, baseName, pageCount = 0, problemCount = 0, pdfData, choiceOffsetX: cx, choiceOffsetY: cy } = result
		setPdfUploaded(true)
		if(fname) setPdfFilename(fname)
		if(baseName) setPdfBaseName(baseName)
		setPdfPageCount(pageCount)
		setPdfProblemCount(problemCount)
		if(pdfData) setEditedPdfData(pdfData)
		setPdfConfirmed(true)
		if(typeof cx === 'number') setChoiceOffsetX(cx)
		if(typeof cy === 'number') setChoiceOffsetY(cy)
		if(!title && (pdfDisplayName || fname)) setTitle((pdfDisplayName || fname).replace(/\.pdf$/i,''))
		setPdfModalOpen(false)
	}

	const handlePdfClose = (pdfData) => {
		if(pdfData) {
			setEditedPdfData(pdfData)
			setPdfUploaded(true)
			setPdfPageCount(pdfData.images?.length ?? 0)
			setPdfProblemCount(pdfData.problems?.length ?? 0)
			if(!title && pdfFilename) setTitle(pdfFilename.replace(/\.pdf$/i,''))
		}
		setPdfModalOpen(false)
	}

	const handleThumbFile = (file) => {
		if(!file) return
		const reader = new FileReader()
		reader.onload = e => setThumbSrc(e.target.result)
		reader.readAsDataURL(file)
	}

	const handleThumbModeChange = (mode) => {
		setThumbMode(mode)
		if(mode === 'auto') setThumbSrc('')
	}

	const thumbnailAutoUrl = editedPdfData?.images?.[0] || ''

	// 등록되지 않은 드래프트 폴더 정리 (textbook.json이 있으면 서버가 거부 → 안전)
	const cleanupDraft = (pdfNameToClean) => {
		if(!pdfNameToClean) return
		const baseName = pdfNameToClean.replace(/\.pdf$/i, '')
		if(!baseName) return
		fetch(`${API_BASE_URL}/admin/textbook-draft/${encodeURIComponent(baseName)}`, { method: 'DELETE' })
		.catch((err) => { console.warn('드래프트 정리 실패:', err.message) })
	}

	// 현재 baseName을 ref로 추적 (unmount cleanup에서 사용)
	const currentDraftRef = useRef('')
	useEffect(() => { currentDraftRef.current = pdfFilename }, [pdfFilename])

	// 페이지 이탈 시 드래프트 정리 (등록되었다면 서버가 거부)
	useEffect(() => {
		return () => { cleanupDraft(currentDraftRef.current) }
	}, [])

	const handleSubmit = async () => {
		if(submitting) return

		// PDF 관련 검증 (별도 메시지)
		if(!pdfUploaded || !pdfFilename) { setSubmitResult({ type:'fail', message:'PDF를 업로드해주세요.' }); return }
		if(!pdfConfirmed || !editedPdfData?.problems?.length) {
			setSubmitResult({ type:'fail', message:'PDF 편집을 완료해주세요. (편집 완료 버튼을 눌러야 등록할 수 있습니다.)' })
			return
		}

		// 필수 입력 필드 일괄 검증
		const missing = []
		if(!title.trim()) missing.push('교재명')
		if(!author.trim()) missing.push('저자')
		if(!publisher) missing.push('출판사')
		if(!subject) missing.push('과목')
		if(!grade) missing.push('과정/학년')
		if(!price || Number(price) <= 0) missing.push('정가')
		if(missing.length > 0) {
			setSubmitResult({ type:'fail', message:`다음 항목을 입력해주세요: ${missing.join(', ')}` })
			return
		}

		if(thumbMode === 'upload' && !thumbSrc) {
			setSubmitResult({ type:'fail', message:'썸네일 이미지를 업로드하거나 자동 모드를 선택해주세요.' })
			return
		}

		setSubmitting(true)
		try {
			const payload = {
				pdfName: pdfFilename,
				metadata: { title: title.trim(), author, isbn, publisher, subject, grade, description },
				price: { price: Number(price)||0, discount: Number(disc)||0 },
				problems: editedPdfData.problems,
				thumbnail: thumbMode === 'upload'
				  ? { mode: 'upload', dataUrl: thumbSrc }
				  : { mode: 'auto' },
				modifiedBy: 'admin',
				choiceOffsetX,
				choiceOffsetY,
				editingBaseName: editingBook?.baseName || '',
			}
			const res = await fetch(`${API_BASE_URL}/admin/register-textbook`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const data = await res.json()
			if(data.success) {
				setSubmitResult({ type:'success', message:'교재가 성공적으로 등록되었습니다.' })
			} else {
				setSubmitResult({ type:'fail', message: data.message || '등록에 실패했습니다.' })
			}
			} catch (err) {
		      setSubmitResult({ type:'fail', message: err.message || '서버 연결에 실패했습니다.' })
		} finally {
			setSubmitting(false)
		}
	}

	const handleSubmitResultClose = () => {
		const wasSuccess = submitResult?.type === 'success'
		setSubmitResult(null)
		if(wasSuccess) onNavigate('textbook-list')
	}



	return (
		<>
			<div className="rstTop">
				<div className="rstTop-backbtn" onClick={()=>onNavigate('textbook-list')} title="교재 목록으로"><Icon.listBack /></div>
				<div className="rstTop-right" ref={topbarRef}>
					<div className="btn-reg-secondary" disabled={submitting}>임시저장</div>
					<div className="btn-reg-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? '등록 중...' : '등록 요청'}</div>
				</div>
			</div>

			<h2 className="subPageTitle">교재 등록</h2>
			<div className="conSection">
				<div className="rndbox sec1">
					<div className="spCardTitle">PDF</div>
					<input
						ref={pdfFileRef}
						type="file"
						accept=".pdf"
						style={{display:'none'}}
						onChange={e => { if(e.target.files[0]) handlePdfFile(e.target.files[0]); e.target.value='' }}
					/>
					{!pdfUploaded ? (
					<div
						className="pdf-upload-area"
						onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('drag-over')}}
						onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.classList.remove('drag-over')}}
						onDrop={e=>{
							e.preventDefault();e.currentTarget.classList.remove('drag-over')
							const file=e.dataTransfer.files[0]
							if(file&&file.type==='application/pdf') handlePdfFile(file)
						}}
					>
						<div className="pdf-upload-area-icon"><Icon.pdfUpload /></div>
						<div className="pdf-upload-area-text">{pdfUploading ? 'PDF 업로드 중...' : 'PDF를 업로드하면 문제가 자동 추출됩니다'}</div>
						<div className="pdf-upload-btn" onClick={()=>pdfFileRef.current?.click()} disabled={pdfUploading}>
							<Icon.pdfUploading />	{pdfUploading ? '업로드 중' : 'PDF 업로드'}
						</div>
					</div>
					) : (
					<div className="pdf-uploaded-state" style={{display:'flex'}}>
						<div className="pdf-uploaded-info">
							<Icon.pdfUploadInfo />							
							<span>{pdfDisplayName || pdfFilename}</span>
							<span className={`pdf-status-badge ${pdfConfirmed ? 'confirmed' : 'pending'}`}>{pdfConfirmed ? '편집 완료' : '편집 미완료'}</span>
							<span className="pdf-uploaded-meta">총 {pdfPageCount}페이지 · 문제 {pdfProblemCount}개 추출됨</span>
						</div>
						<div className="pdf-uploaded-btns">
							<button className="btn-pdf-edit" onClick={()=>{setPdfModalMode('edit');setPdfModalOpen(true)}}>편집</button>
							<button className="btn-pdf-remove" onClick={()=>{cleanupDraft(pdfFilename);setPdfUploaded(false);setPdfFilename('');setPdfDisplayName('');setPdfBaseName('');setEditedPdfData(null);setPdfConfirmed(false);setPdfPageCount(0);setPdfProblemCount(0)}}>삭제</button>
						</div>
					</div>
					)}
				</div>

				<div className="rndbox sec2">
					<div className="leftbox">
						<div className="spCardTitle">기본 정보</div>
						<div className="form-groups-stack">
							<div className="form-group">
								<label className="form-label">교재명 <span className="form-required">*</span></label>
								<input type="text" className="form-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="교재명을 입력하세요" />
							</div>
							<div className="form-grid2">
								<div className="form-group">
									<label className="form-label">저자 <span className="form-required">*</span></label>
									<input type="text" className="form-input" value={author} onChange={e=>setAuthor(e.target.value)} placeholder="저자명" />
								</div>
								<div className="form-group">
									<label className="form-label">ISBN</label>
									<input type="text" className="form-input" value={isbn} onChange={e=>setIsbn(e.target.value)} placeholder="979-11-XXXXXXXXX" />
								</div>
							</div>
							<div className="form-group">
								<label className="form-label">출판사 <span className="form-required">*</span></label>
								<select className="form-select" value={publisher} onChange={e=>setPublisher(e.target.value)}>
									<option value="">출판사 선택</option>
									<option>미래엔</option><option>비상교육</option><option>천재교육</option>
									<option>EBS</option><option>좋은책신사고</option><option>금성출판사</option><option>동아출판</option>
								</select>
							</div>
							<div className="form-grid2">
								<div className="form-group">
									<label className="form-label">과목 <span className="form-required">*</span></label>
									<select className="form-select" value={subject} onChange={e=>setSubject(e.target.value)}>
										<option value="">과목 선택</option>
										<option>국어</option><option>영어</option><option>수학</option><option>과학</option>
										<option>사회</option><option>한국사</option><option>도덕</option><option>물리학</option>
										<option>화학</option><option>생명과학</option><option>지구과학</option>
									</select>
								</div>
								<div className="form-group">
									<label className="form-label">과정/학년 <span className="form-required">*</span></label>
									<select className="form-select" value={grade} onChange={e=>setGrade(e.target.value)}>
										<option value="">과정/학년 선택</option>
										<optgroup label="초등">
											<option>초등 1학년</option><option>초등 2학년</option><option>초등 3학년</option>
											<option>초등 4학년</option><option>초등 5학년</option><option>초등 6학년</option>
										</optgroup>
										<optgroup label="중등">
											<option>중등 1학년</option><option>중등 2학년</option><option>중등 3학년</option>
										</optgroup>
										<optgroup label="고등">
											<option>고등 1학년</option><option>고등 2학년</option><option>고등 3학년</option>
										</optgroup>
										<option>N수반</option>
									</select>
								</div>
							</div>
							<div className="form-group">
								<label className="form-label">교재 설명</label>
								<textarea className="form-textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="교재에 대한 설명을 입력하세요" rows="4"></textarea>
							</div>
						</div>
					</div>
					<div className="rightbox">
						<div className="spCardTitle">섬네일</div>
						<div
							className={`thumb-preview${thumbMode==='upload'?' upload-mode':''}`}
							onClick={()=>{ if(thumbMode==='upload') thumbFileRef.current?.click() }}
						>
							{thumbMode === 'auto' && (
								thumbnailAutoUrl ? (
									<img src={thumbnailAutoUrl} alt="PDF 첫 페이지" style={{display:'block',width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} />
								) : (
									<div id="thumbAutoContent">
										<div className="thumb-preview-placeholder">PDF 첫 페이지가<br/>자동 추출됩니다</div>
									</div>
								)
							)}
							{thumbMode === 'upload' && !thumbSrc && (
								<div className="thumb-upload-mode-inner" style={{display:'flex'}}><Icon.pdfUploadThumb /><div className="thumb-upload-mode-text">클릭하여<br/>이미지 선택</div></div>
							)}
							{thumbSrc && (
								<img src={thumbSrc} alt="섬네일 미리보기" style={{display:'block',width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} />
							)}
						</div>
						<div className="thumb-radio-group">
							<label className="thumb-radio-item">
								<input type="radio" name="thumbMode" value="auto" checked={thumbMode==='auto'} onChange={()=>handleThumbModeChange('auto')} />
								PDF 첫 페이지
							</label>
							<label className="thumb-radio-item">
								<input type="radio" name="thumbMode" value="upload" checked={thumbMode==='upload'} onChange={()=>handleThumbModeChange('upload')} />
								직접 업로드
							</label>
						</div>
						<input ref={thumbFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleThumbFile(e.target.files[0])}} />
					</div>
				</div>

				<div className="rndbox sec3">
					<div className="spCardTitle">가격 설정</div>
					<div className="price-row">
						<div className="form-group">
							<label className="form-label">정가 <span className="form-required">*</span></label>
							<div className="input-with-unit">
								<input type="number" className="form-input" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0" min="0" />
								<span className="input-unit-label">원</span>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label">할인율</label>
							<div className="input-with-unit">
								<input type="number" className="form-input" value={disc} onChange={e=>setDisc(e.target.value)} placeholder="0" min="0" max="100" />
								<span className="input-unit-label">%</span>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label">할인가</label>
							<div className="input-with-unit">
								<input type="text" className="form-input" readOnly value={calcDiscPrice()} placeholder="자동 계산" />
								<span className="input-unit-label">원</span>
							</div>
						</div>
					</div>
				</div>
			</div>


			{/* 플로팅 바 */}

			<div className={`reg-float-bar ${showFloatBar ? 'show' : ''}`} id="regFloatBar">
				<button className="reg-float-back" onClick={()=>onNavigate('textbook-list')} title="교재 목록으로"><Icon.listBack /></button>
				<div className="reg-float-sep"></div>
				<div className="reg-float-actions">
					<button className="reg-float-btn" disabled={submitting}><Icon.floatSave />임시저장</button>
					<div className="reg-float-sep"></div>
					<button className="reg-float-btn primary" onClick={handleSubmit} disabled={submitting}><Icon.floatPrimary />{submitting ? '등록 중...' : '등록 요청'}</button>
				</div>
			</div>


			{/* PDF 편집 모달 */}
			<PdfEditModal
				open={pdfModalOpen}
				mode={pdfModalMode}
				filename={pdfFilename}
				initialPdfData={editedPdfData}
				onConfirm={handlePdfConfirm}
				onClose={handlePdfClose}
			/>

			{/* 등록 결과 모달 */}
			{submitResult != null && (
			<div className="viewer-modal-overlay" onClick={handleSubmitResultClose} role="dialog" aria-modal="true">
				<div className="viewer-modal-box" onClick={(e) => e.stopPropagation()}>
					<p className="viewer-modal-title">{submitResult.type === 'success' ? '등록 완료' : '등록 실패'}</p>
					<p className="viewer-modal-message">{submitResult.message}</p>
					<div className="viewer-modal-actions"><button type="button" className="viewer-modal-btn viewer-modal-btn-confirm" onClick={handleSubmitResultClose}>확인</button></div>
				</div>
			</div>
			)}
		</>
	)
}
