import { getImageForItem } from '../../utils/imageMap'

export function IntroSection() {
  return (
    <div className="info-section">
      <p className="info-description">
        Dig up rupees to earn money, but avoid bombs and rupoors. The value of each rupee tells you how many hazards are in the 8 adjacent squares. Use this information strategically to avoid losing money and hitting the house fee.
      </p>
    </div>
  )
}

export function PlayModeSection() {
  return (
    <div className="info-section">
      <h3 className="info-section-title">Play Mode</h3>
      <p className="info-description">
        Dig cells one at a time to reveal rupees. Click a cell to dig it. If you hit a bomb or rupoor, you lose money. Keep digging until you're satisfied with your earnings, then reveal remaining cells or start a new game. Remember: the house takes a fee just for playing!
      </p>
    </div>
  )
}

export function SolveModeSection() {
  return (
    <div className="info-section">
      <h3 className="info-section-title">Solve Mode</h3>
      <p className="info-description">
        Manually place rupees and hazards on the board. The solver analyzes your constraints and shows probability heatmaps (green = safe, red = dangerous) for unrevealed cells. Use this to find the optimal placement or solve puzzles.
      </p>
    </div>
  )
}

interface DifficultyLevel {
  name: string
  fee: string
  bombs: string
  rupoors: string
}

function DifficultyCard({ level }: { level: DifficultyLevel }) {
  return (
    <div className="difficulty-card">
      <h4 className="difficulty-title">{level.name}</h4>
      <div className="difficulty-info">
        <span className="difficulty-label">Fee:</span>
        <span className="difficulty-value">{level.fee}</span>
      </div>
      <div className="difficulty-info">
        <span className="difficulty-hazards">
          <img src={getImageForItem('bomb')} alt="bomb" className="difficulty-icon" />
          {level.bombs}
        </span>
        <span className="difficulty-hazards">
          <img src={getImageForItem('rupoor')} alt="rupoor" className="difficulty-icon" />
          {level.rupoors}
        </span>
      </div>
    </div>
  )
}

export function DifficultyLevelsSection() {
  const levels: DifficultyLevel[] = [
    { name: 'Beginner', fee: '-30', bombs: '4', rupoors: '0' },
    { name: 'Intermediate', fee: '-50', bombs: '4', rupoors: '4' },
    { name: 'Expert', fee: '-70', bombs: '8', rupoors: '8' },
  ]

  return (
    <div className="info-section">
      <h3 className="info-section-title">Difficulty Levels</h3>
      <div className="difficulty-grid">
        {levels.map((level) => (
          <DifficultyCard key={level.name} level={level} />
        ))}
      </div>
    </div>
  )
}

interface RupeeInfo {
  image: string
  alt: string
  value: string
  hazards: string
  className?: string
}

function RupeeCard({ rupee }: { rupee: RupeeInfo }) {
  return (
    <div className={`info-card ${rupee.className || ''}`}>
      <img src={rupee.image} alt={rupee.alt} className="info-card-icon" />
      <div className="info-card-content">
        <p className="info-card-detail">{rupee.value}</p>
        <p className="info-card-detail-secondary">{rupee.hazards}</p>
      </div>
    </div>
  )
}

export function RupeeValuesSection() {
  const rupees: RupeeInfo[] = [
    {
      image: getImageForItem('greenrupee'),
      alt: 'Green Rupee',
      value: 'Value: +1 rupee',
      hazards: 'Nearby hazards: 0',
    },
    {
      image: getImageForItem('bluerupee'),
      alt: 'Blue Rupee',
      value: 'Value: +5 rupees',
      hazards: 'Nearby hazards: 1-2',
    },
    {
      image: getImageForItem('redrupee'),
      alt: 'Red Rupee',
      value: 'Value: +20 rupees',
      hazards: 'Nearby hazards: 3-4',
    },
    {
      image: getImageForItem('silverrupee'),
      alt: 'Silver Rupee',
      value: 'Value: +100 rupees',
      hazards: 'Nearby hazards: 5-6',
    },
    {
      image: getImageForItem('goldrupee'),
      alt: 'Gold Rupee',
      value: 'Value: +300 rupees',
      hazards: 'Nearby hazards: 7-8',
    },
    {
      image: getImageForItem('rupoor'),
      alt: 'Rupoor',
      value: 'Value: -10 rupees',
      hazards: 'Lose money when dug',
      className: 'info-card-rupoor',
    },
  ]

  return (
    <div className="info-section">
      <h3 className="info-section-title">Rupee Values</h3>
      <p className="info-description">
        The rupee you dig up tells you how many bombs or rupoors are in the 8 adjacent squares:
      </p>
      <div className="info-cards-grid">
        {rupees.map((rupee) => (
          <RupeeCard key={rupee.alt} rupee={rupee} />
        ))}
      </div>
    </div>
  )
}
