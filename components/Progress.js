import { PARTICIPATION_STEPS, STEP_SHORT } from '../lib/constants'

const cols = (steps) => ({ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` })

// 단계 이름 줄. 목록 화면에서는 맨 위에 한 번만 두고 각 행은 <Progress labels={false} />
export function StepLabels({ steps = PARTICIPATION_STEPS, current = -1 }) {
  return (
    <ol className="grid gap-[3px]" style={cols(steps)}>
      {steps.map((s, i) => (
        <li key={s} title={s} aria-current={i === current ? 'step' : undefined}
          className={`truncate text-center text-[11px] ${i === current ? 'font-semibold text-ink' : 'text-muted'}`}>
          {STEP_SHORT[s] || s}
        </li>
      ))}
    </ol>
  )
}

// 진행 막대. current는 steps 안의 위치(-1이면 시작 전·거절)
export default function Progress({ steps = PARTICIPATION_STEPS, current, labels = true }) {
  return (
    <div>
      {!labels && <span className="sr-only">{current >= 0 ? `${current + 1}/${steps.length}단계 ${steps[current]}` : '진행 전'}</span>}
      <div aria-hidden="true" className="grid gap-[3px]" style={cols(steps)}>
        {steps.map((s, i) => <span key={s} className={`h-1.5 rounded-sm ${i <= current ? 'bg-ink' : 'bg-line'}`} />)}
      </div>
      {labels && <div className="mt-1.5"><StepLabels steps={steps} current={current} /></div>}
    </div>
  )
}
