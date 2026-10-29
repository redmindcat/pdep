export const BOOKS = [
  {id:'MN-00284',name:'미래엔 고등 수학(상)',pub:'미래엔',subj:'수학',grade:'고1',price:14000,disc:0,author:'최용준·홍창섭',sales:3842,appr:'approved',sell:'selling',date:'2023.03.01',color:'#5BA89E'},
  {id:'MN-00283',name:'비상 중학영어 3',pub:'비상교육',subj:'영어',grade:'중3',price:12500,disc:0,author:'이재영',sales:2197,appr:'approved',sell:'selling',date:'2023.03.05',color:'#6B9FD4'},
  {id:'MN-00282',name:'천재교과서 초등수학 3-1',pub:'천재교육',subj:'수학',grade:'초3',price:11000,disc:0,author:'류희찬·김명수',sales:4510,appr:'approved',sell:'selling',date:'2023.03.10',color:'#84C07B'},
  {id:'MN-00281',name:'EBS 수능특강 국어독해의 기술',pub:'EBS',subj:'국어',grade:'고3',price:9500,disc:0,author:'정구영',sales:null,appr:'pending',sell:null,date:'2024.02.05',color:'#C97B5E'},
  {id:'MN-00280',name:'미래엔 중등 과학 2',pub:'미래엔',subj:'과학',grade:'중2',price:13000,disc:0,author:'김성진·이문원',sales:null,appr:'pending',sell:null,date:'2024.02.08',color:'#9B7DC8'},
  {id:'MN-00279',name:'미래엔 고등 영어',pub:'미래엔',subj:'영어',grade:'고1',price:13500,disc:10,author:'이재영',sales:2891,appr:'approved',sell:'selling',date:'2023.03.01',color:'#D4A84B',
    updates:[{date:'2025.02.01',item:'가격 변경'},{date:'2024.06.18',item:'가격 변경'}]},
  {id:'MN-00278',name:'쎈 수학 중 1',pub:'좋은책신사고',subj:'수학',grade:'중1',price:17500,disc:0,author:'홍범준',sales:5231,appr:'approved',sell:'stopped',date:'2022.11.20',color:'#7B9ED4'},
  {id:'MN-00277',name:'미래엔 초등 사회 5-1',pub:'미래엔',subj:'사회',grade:'초5',price:10000,disc:0,author:'모경환',sales:3210,appr:'approved',sell:'selling',date:'2023.03.15',color:'#E89A7E'},
  {id:'MN-00276',name:'미래엔 한국사',pub:'미래엔',subj:'한국사',grade:'고2',price:12000,disc:0,author:'최병택·이근호',sales:null,appr:'rejected',sell:null,date:'2024.03.01',color:'#8BAE8F'},
  {id:'MN-00275',name:'미래엔 지구과학 I',pub:'미래엔',subj:'과학',grade:'고2',price:13000,disc:5,author:'이기영',sales:1543,appr:'approved',sell:'selling',date:'2023.09.05',color:'#B07BB0',
    updates:[{date:'2025.01.15',item:'가격 변경'}]},
  {id:'MN-00274',name:'동아출판 고등 물리학 I',pub:'동아출판',subj:'과학',grade:'고2',price:14500,disc:0,author:'박찬범·류근정',sales:987,appr:'approved',sell:'selling',date:'2023.08.20',color:'#5B8FBF'},
  {id:'MN-00273',name:'금성출판사 중등 국어 2-2',pub:'금성출판사',subj:'국어',grade:'중2',price:11500,disc:0,author:'류수열',sales:null,appr:'pending',sell:null,date:'2024.04.12',color:'#C8A060'},
]

export const APPR = {approved:'승인',pending:'검토중',rejected:'반려'}
export const SELL = {selling:'판매중',stopped:'판매중지'}

export const GRADE_MAP = {
  '초등':['1학년','2학년','3학년','4학년','5학년','6학년'],
  '중등':['1학년','2학년','3학년'],
  '고등':['1학년','2학년','3학년'],
  'N수':['N수반']
}
export const LG_LEVELS = ['초등','중등','고등','N수']
export const PUB_VALUES = ['미래엔','비상교육','천재교육','EBS','좋은책신사고','금성출판사','동아출판']
