// SVG 도넛·라인 차트 렌더링 유틸 (원본 로직 그대로 이식)
export function eio(t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t }

export function arcPath(cx,cy,ro,ri,sa,ea) {
  if(ro<0.01) return ''
  ri = Math.max(0,ri)
  const x1o=cx+ro*Math.cos(sa), y1o=cy+ro*Math.sin(sa)
  const x1i=cx+ri*Math.cos(sa), y1i=cy+ri*Math.sin(sa)
  const x2o=cx+ro*Math.cos(ea), y2o=cy+ro*Math.sin(ea)
  const x2i=cx+ri*Math.cos(ea), y2i=cy+ri*Math.sin(ea)
  const lg=(ea-sa)>Math.PI ? 1 : 0
  return `M${x1i.toFixed(2)},${y1i.toFixed(2)} L${x1o.toFixed(2)},${y1o.toFixed(2)} A${ro},${ro} 0 ${lg},1 ${x2o.toFixed(2)},${y2o.toFixed(2)} L${x2i.toFixed(2)},${y2i.toFixed(2)} A${ri},${ri} 0 ${lg},0 ${x1i.toFixed(2)},${y1i.toFixed(2)} Z`
}

export function calcSegs(segs) {
  const total = segs.reduce((s,d)=>s+d.v, 0)
  let a = -Math.PI/2
  return segs.map(d => {
    const sweep = (d.v/total)*2*Math.PI, sa = a
    a += sweep
    return {...d, total, sa, ea:a}
  })
}

export function buildDonut(svgEl, data, segs, animate=false, isResize, isDark=false) {
  if(!svgEl) return
  const cx=60, cy=60, RO=52, RI=32
  const ns='http://www.w3.org/2000/svg'
  const holeFill = isDark ? '#252528' : '#FFFFFF'
  const trackStroke = isDark ? '#3A3A3C' : '#e2e3e8'
  const textFill = isDark ? '#e2e3e8' : '#1A1A1A'
  const subFill = isDark ? '#6B6B6B' : '#999'
  const computed = calcSegs(segs)
  svgEl.innerHTML = ''
  const bgCircleColor = isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0';
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : '#1c1d24';

  const bg = document.createElementNS(ns,'circle')
  bg.setAttribute('cx',cx); bg.setAttribute('cy',cy)
  bg.setAttribute('r',(RO+RI)/2); bg.setAttribute('fill','none')
  bg.setAttribute('stroke',trackStroke); bg.setAttribute('stroke-width',RO-RI)
  bg.setAttribute('fill', bgCircleColor);
  svgEl.appendChild(bg)

  const txt = document.createElementNS('http://www.w3.org/2000/svg','text')
  txt.setAttribute('x',cx); txt.setAttribute('y',cy+5); txt.setAttribute('text-anchor','middle')
  txt.setAttribute('fill', textColor); // <= 변수 적용
  txt.style.fontSize='14px'; txt.style.fontWeight='700'

  const tooltip = document.getElementById('tooltip')
  const paths = computed.map((s,i) => {
    const color = data.colors[i]
    const path = document.createElementNS(ns,'path')
    if(!animate) path.setAttribute('d', arcPath(cx,cy,RO,RI,s.sa,s.ea))
    path.setAttribute('fill',color)
    path.style.cursor = 'pointer'
    path.style.transformOrigin = `${cx}px ${cy}px`
    path.style.transition = 'opacity .18s, transform .18s'
    if(tooltip) {
      path.addEventListener('mouseenter', e => {
        tooltip.innerHTML = `${s.l} <span style="color:#999;font-weight:400">${s.v.toLocaleString()}명</span>`
        tooltip.style.opacity = '1'
        const tw = tooltip.offsetWidth||120
        const left = e.clientX+6+tw>window.innerWidth ? e.clientX-tw-6 : e.clientX+6
        tooltip.style.left = left+'px'; tooltip.style.top = (e.clientY-22)+'px'
      })
      path.addEventListener('mouseleave', () => tooltip.style.opacity='0')
    }
    path.addEventListener('mouseover', () => { path.style.opacity='0.75'; path.style.transform='scale(1.05)' })
    path.addEventListener('mouseout',  () => { path.style.opacity='1';    path.style.transform='scale(1)' })
    svgEl.appendChild(path)
    return {path, s}
  })

  const hole = document.createElementNS(ns,'circle')
  hole.setAttribute('cx',cx); hole.setAttribute('cy',cy)
  hole.setAttribute('r',RI); hole.setAttribute('fill',holeFill)
  svgEl.appendChild(hole)

  const total = segs.reduce((s,d)=>s+d.v, 0)
  const tv = document.createElementNS(ns,'text')
  tv.setAttribute('x',cx); tv.setAttribute('y',cy+2); tv.setAttribute('text-anchor','middle')
  tv.setAttribute('font-size','14'); tv.setAttribute('font-weight','700'); tv.setAttribute('fill',textFill)
  tv.textContent = total.toLocaleString(); svgEl.appendChild(tv)

  const unitFs = window.innerWidth <= 1100 ? '11' : '8'
  const tl = document.createElementNS(ns,'text')
  tl.setAttribute('x',cx); tl.setAttribute('y',cy+15); tl.setAttribute('text-anchor','middle')
  tl.setAttribute('font-size', unitFs); tl.setAttribute('fill',subFill)
  tl.textContent = '명'; svgEl.appendChild(tl)

  if(animate) {
    const F=38, MS=13; let f=0
    const t = setInterval(() => {
      f++
      const p = eio(Math.min(f/F,1))
      const da = p*2*Math.PI
      paths.forEach(({path,s}) => {
        const ss=s.sa+Math.PI/2, se=s.ea+Math.PI/2
        const dr = Math.min(Math.max(da-ss,0), se-ss)
        if(dr<=0) path.setAttribute('d','')
        else path.setAttribute('d', arcPath(cx,cy,RO,RI,s.sa,s.sa+dr))
      })
      if(f>=F) {
        clearInterval(t)
        paths.forEach(({path,s}) => path.setAttribute('d', arcPath(cx,cy,RO,RI,s.sa,s.ea)))
      }
    }, MS)
  }
}

export function buildLine(svgEl, data, winEnd, WIN, MON, TY, animate=false,isResize, pw, isDark=false) {
  if(!svgEl) return
  const W = svgEl.getBoundingClientRect().width || svgEl.clientWidth || 400
  const H=150, pL=34, pR=8, pT=8, pB=20, cW=W-pL-pR, cH=H-pT-pB
  const startM = winEnd-WIN+1
  const months = Array.from({length:WIN}, (_,i) => startM+i)
  const allVals = data.labels.map((_,li) => months.map(m => (data.monthly[m]||[])[li]||0)).flat()
  const minV = Math.min(...allVals)*0.92, maxV = Math.max(...allVals)*1.06
  const ns = 'http://www.w3.org/2000/svg'
  const gridColor = isDark ? '#2C2C2E' : '#e2e3e8'
  const dotStroke = isDark ? '#252528' : '#FFFFFF'
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`)
  svgEl.innerHTML = ''

  for(let i=0; i<=3; i++) {
    const y = pT+cH-(i/3)*cH
    const l = document.createElementNS(ns,'line')
    l.setAttribute('x1',pL); l.setAttribute('x2',W-pR); l.setAttribute('y1',y); l.setAttribute('y2',y)
    l.setAttribute('stroke',gridColor); l.setAttribute('stroke-width','1'); svgEl.appendChild(l)
    const val = Math.round(minV+(i/3)*(maxV-minV))
    const t2 = document.createElementNS(ns,'text')
    t2.setAttribute('x',pL-3); t2.setAttribute('y',y+3); t2.setAttribute('text-anchor','end')
    t2.setAttribute('font-size','11'); t2.setAttribute('fill','#96979f')
    t2.textContent = val>=10000 ? (val/10000).toFixed(1)+'만' : val>=1000 ? (val/1000).toFixed(1)+'천' : val
    svgEl.appendChild(t2)
  }
  months.forEach((m,i) => {
    const x = pL+i*(cW/(WIN-1))
    const t2 = document.createElementNS(ns,'text')
    t2.setAttribute('x',x); t2.setAttribute('y',H-4); t2.setAttribute('text-anchor','middle')
    t2.setAttribute('font-size','11'); t2.setAttribute('fill','#96979f')
    t2.textContent = MON[new Date(TY,m,1).getMonth()]; svgEl.appendChild(t2)
  })

  const tooltip = document.getElementById('tooltip')
  const DOT_STEP=160, DOT_DUR=180, LINE_START=WIN*DOT_STEP+60
  data.labels.forEach((label,li) => {
    const pts = months.map((m,i) => {
      const v = (data.monthly[m]||[])[li]||0
      return [pL+i*(cW/(WIN-1)), pT+cH-((v-minV)/(maxV-minV))*cH, v]
    })
    const path = document.createElementNS(ns,'path')
    path.setAttribute('d', pts.map((p,i) => (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '))
    path.setAttribute('fill','none'); path.setAttribute('stroke',data.colors[li])
    path.setAttribute('stroke-width','2'); path.setAttribute('stroke-linecap','round')
    path.setAttribute('stroke-linejoin','round')
    if(animate) {
      const len = path.getTotalLength()
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len
      requestAnimationFrame(() => requestAnimationFrame(() => {
        path.style.transition = `stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1) ${LINE_START+li*25}ms`
        path.style.strokeDashoffset = '0'
      }))
    }
    svgEl.appendChild(path)
    pts.forEach(([x,y,v],pi) => {
      const c = document.createElementNS(ns,'circle')
      c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r','3.5')
      c.setAttribute('fill',data.colors[li]); c.setAttribute('stroke',dotStroke)
      c.setAttribute('stroke-width','2'); c.style.cursor = 'pointer'
      if(animate) {
        c.style.opacity = '0'
        requestAnimationFrame(() => requestAnimationFrame(() => {
          c.style.transition = `opacity 0.18s ease ${pi*DOT_STEP}ms`
          c.style.opacity = '1'
        }))
      }
      if(tooltip) {
        c.addEventListener('mouseenter', e => {
          tooltip.innerHTML = `${label} <span style="color:#999;font-weight:400">${v.toLocaleString()}명</span>`
          tooltip.style.opacity = '1'
          const tw = tooltip.offsetWidth||120
          const left = e.clientX+6+tw>window.innerWidth ? e.clientX-tw-6 : e.clientX+6
          tooltip.style.left = left+'px'; tooltip.style.top = (e.clientY-22)+'px'
        })
        c.addEventListener('mouseleave', () => tooltip.style.opacity='0')
      }
      svgEl.appendChild(c)
    })
  })
}

export function legendHtml(data) {
  return data.labels.map((l,i) =>
    `<div class="line-legend-item"><div class="line-legend-bar" style="background:${data.colors[i]}"></div>${l}</div>`
  ).join('')
}

export function donutLegendHtml(data, segs) {
  const total = segs.reduce((s,d)=>s+d.v, 0)
  return segs.map((d,i) =>
    `<div class="legend-row"><span class="legend-dot" style="background:${data.colors[i]}"></span>${d.l}<span class="legend-val"><span class="legend-num">${d.v.toLocaleString()}</span>명</span><span class="legend-pct">${Math.round(d.v/total*100)}%</span></div>`
  ).join('')
}
