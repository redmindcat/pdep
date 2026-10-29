const now = new Date()
export const TY = now.getFullYear()
export const TM = now.getMonth()
export const CHART_C = ['#008D40','#14B5A5','#83B807','#FFC300']
export const SDATA = {
  labels:['초등','중등','고등','재수·N수생'],
  colors:CHART_C,
  donut:{
    [TM]:{total:54210,segs:[{l:'초등',v:20599},{l:'중등',v:17889},{l:'고등',v:11926},{l:'재수·N수생',v:3796}]},
    [TM-1]:{total:52320,segs:[{l:'초등',v:19800},{l:'중등',v:17400},{l:'고등',v:11600},{l:'재수·N수생',v:3520}]},
    [TM-2]:{total:51080,segs:[{l:'초등',v:19200},{l:'중등',v:17100},{l:'고등',v:11500},{l:'재수·N수생',v:3280}]},
    [TM-3]:{total:49500,segs:[{l:'초등',v:18500},{l:'중등',v:16700},{l:'고등',v:11200},{l:'재수·N수생',v:3100}]}
  },
  monthly:{
    [TM-9]:[9200,10500,6800,1600],[TM-8]:[10500,11400,7400,1900],[TM-7]:[11800,12200,8000,2100],
    [TM-6]:[12800,12800,8500,2400],[TM-5]:[13600,13200,9000,2600],[TM-4]:[14000,13600,9400,2800],
    [TM-3]:[15200,14000,9800,3000],[TM-2]:[16800,14200,10200,3200],[TM-1]:[19000,15800,10800,3500],
    [TM]:[20599,17889,11926,3796]
  }
}

export const TDATA = {
  labels:['학교','학원','공부방','과외'],
  colors:CHART_C,
  donut:{
    [TM]:{total:5824,uncert:1722,segs:[{l:'학교',v:1397},{l:'학원',v:3378},{l:'공부방',v:699},{l:'과외',v:350}]},
    [TM-1]:{total:5530,uncert:1640,segs:[{l:'학교',v:1320},{l:'학원',v:3200},{l:'공부방',v:670},{l:'과외',v:340}]},
    [TM-2]:{total:5240,uncert:1560,segs:[{l:'학교',v:1280},{l:'학원',v:3100},{l:'공부방',v:640},{l:'과외',v:320}]},
    [TM-3]:{total:5050,uncert:1530,segs:[{l:'학교',v:1200},{l:'학원',v:2950},{l:'공부방',v:600},{l:'과외',v:300}]}
  },
  monthly:{
    [TM-9]:[900,1200,350,180],[TM-8]:[950,1600,390,200],[TM-7]:[1000,2100,430,215],
    [TM-6]:[1010,2500,470,230],[TM-5]:[1020,2700,510,248],[TM-4]:[1030,2850,560,265],
    [TM-3]:[1050,2950,600,285],[TM-2]:[1100,3000,630,305],[TM-1]:[1250,3180,665,328],
    [TM]:[1397,3378,699,350]
  }
}

export const WIN = 3
export const MIN_DM = TM - 3
export const MON = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const _REV = [248,256,263,271,280,291,302,313,322,334,344,355]
const _GOAL = [295,303,311,319,328,338,349,360,369,381,390,400]

export const mData = {}
for (let i=11; i>=0; i--) {
  const d = new Date(TY, TM-i, 1)
  const k = `${d.getFullYear()}-${d.getMonth()}`
  const idx = 11-i
  const n = (Math.random()-0.5)*16
  mData[k] = {
    year: d.getFullYear(),
    month: d.getMonth(),
    current: i===0 ? 357 : Math.round((_REV[idx]+n)*10)/10,
    goal: i===0 ? 400 : Math.round((_GOAL[idx]+(Math.random()-0.5)*12)*10)/10,
    isCurrent: i===0
  }
}

export const learnData = {
  today:[
    {label:'총 학습 세션',  num:'24,108', unit:'건', diff:'▲ 12%', cls:'up'},
    {label:'평균 세션 시간', num:'38',     unit:'분', diff:'▼ 3%',  cls:'down'},
    {label:'오답노트 생성', num:'3,241',  unit:'건', diff:'— 0%',  cls:''}
  ],
  yesterday:[
    {label:'총 학습 세션',  num:'21,524', unit:'건'},
    {label:'평균 세션 시간', num:'39',     unit:'분'},
    {label:'오답노트 생성', num:'3,238',  unit:'건'}
  ]
}

export const topData = {
  sub:[
    {name:'수능특강 영어',cp:'EBS',val:'12,840',unit:'명'},
    {name:'자이스토리 수학1',cp:'수경출판사',val:'9,320',unit:'명'},
    {name:'마더텅 영어독해',cp:'마더텅',val:'8,104',unit:'명'},
    {name:'개념원리 수학',cp:'이룸이앤비',val:'7,230',unit:'명'},
    {name:'Grammar Zone',cp:'NE능률',val:'6,890',unit:'명'}
  ],
  note:[
    {name:'수능특강 영어',cp:'EBS',val:'48,204',unit:'건'},
    {name:'개념원리 수학',cp:'이룸이앤비',val:'41,820',unit:'건'},
    {name:'자이스토리 수학1',cp:'수경출판사',val:'38,910',unit:'건'},
    {name:'마더텅 영어독해',cp:'마더텅',val:'29,340',unit:'건'},
    {name:'EBS 수학의왕도',cp:'EBS',val:'24,108',unit:'건'}
  ],
  new:[
    {name:'2026 수능완성 국어',cp:'EBS',val:'3일 전',unit:''},
    {name:'하이탑 물리학2',cp:'동아출판',val:'5일 전',unit:''},
    {name:'킬러문항 수학 시즌2',cp:'수경출판사',val:'8일 전',unit:''},
    {name:'올림포스 영어',cp:'EBS',val:'11일 전',unit:''},
    {name:'수학의 정석 미적분',cp:'성문출판사',val:'14일 전',unit:''}
  ]
}

export const todos = [
  {dot:'td-red',cls:'tc-red',label:'결제 오류',n:2,dest:'구독 · 결제'},
  {dot:'td-amber',cls:'tc-amber',label:'교재 발행 대기',n:7,dest:'콘텐츠'},
  {dot:'td-amber',cls:'tc-amber',label:'교사 인증 대기',n:14,dest:'사용자'},
  {dot:'td-blue',cls:'tc-blue',label:'커뮤니티 신고',n:5,dest:'커뮤니티'},
  {dot:'td-amber',cls:'tc-amber',label:'CP사 승인 대기',n:3,dest:'CP사'}
]
