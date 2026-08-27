/* Side panel — summary stats, vessel cards with score bars, reasons */

import type { InvestigationResponse, VesselAttribution } from '../types/investigation';

interface PanelProps {
  data: InvestigationResponse;
  selectedVessel: string | null;
  onSelectVessel: (mmsi: string | null) => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function InvestigationPanel({ data, selectedVessel, onSelectVessel }: PanelProps) {
  return (
    <div className="side-panel">
      <div className="side-panel__header">
        <div className="side-panel__title">
          Investigation {data.investigation_id}
        </div>
      </div>

      <div className="side-panel__body">
        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Spill Confidence</div>
            <div className="stat-card__value stat-card__value--confidence">
              {(data.spill.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Spill Area</div>
            <div className="stat-card__value stat-card__value--area">
              {data.spill.area_km2.toFixed(1)} km²
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Origin Confidence</div>
            <div className="stat-card__value stat-card__value--confidence">
              {(data.drift.origin.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Candidates</div>
            <div className="stat-card__value stat-card__value--vessels">
              {data.vessels.length}
            </div>
          </div>
        </div>

        {/* Origin Info */}
        <div className="stat-card" style={{ marginBottom: 16 }}>
          <div className="stat-card__label">Estimated Origin</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {data.drift.origin.latitude.toFixed(4)}°N, {data.drift.origin.longitude.toFixed(4)}°E
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Time window: {new Date(data.drift.origin_time_window.start).toLocaleTimeString()} – {new Date(data.drift.origin_time_window.end).toLocaleTimeString()} UTC
          </div>
        </div>

        {/* Vessel Rankings */}
        <div className="section-header">Potential Vessel Attribution</div>

        {data.vessels.map((vessel) => (
          <VesselCard
            key={vessel.mmsi}
            vessel={vessel}
            isSelected={selectedVessel === vessel.mmsi}
            onSelect={() => onSelectVessel(
              selectedVessel === vessel.mmsi ? null : vessel.mmsi
            )}
          />
        ))}

        {/* Disclaimer */}
        <div className="disclaimer">
          ⚠️ {data.disclaimer}
        </div>

        {data.pipeline_duration_seconds && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            Pipeline completed in {data.pipeline_duration_seconds.toFixed(1)}s
            {data.is_demo && ' • Demo Mode'}
          </div>
        )}
      </div>
    </div>
  );
}


function VesselCard({
  vessel,
  isSelected,
  onSelect,
}: {
  vessel: VesselAttribution;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const medal = vessel.rank <= 3 ? MEDALS[vessel.rank - 1] : `#${vessel.rank}`;
  const scoreClass = vessel.score >= 80 ? 'high' : vessel.score >= 50 ? 'medium' : 'low';

  const featureBars = [
    { label: 'Spatial', value: vessel.feature_scores.spatial },
    { label: 'Temporal', value: vessel.feature_scores.temporal },
    { label: 'Trajectory', value: vessel.feature_scores.trajectory },
    { label: 'Behaviour', value: vessel.feature_scores.behaviour },
    { label: 'Relevance', value: vessel.feature_scores.vessel_relevance },
  ];

  return (
    <div
      className={`vessel-card ${isSelected ? 'vessel-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="vessel-card__header">
        <div className="vessel-card__rank">
          <span className="vessel-card__medal">{medal}</span>
          <span className="vessel-card__name">{vessel.vessel_name}</span>
        </div>
        <span className={`vessel-card__score vessel-card__score--${scoreClass}`}>
          {vessel.score.toFixed(0)}
        </span>
      </div>

      <div className="vessel-card__meta">
        <span>MMSI: {vessel.mmsi}</span>
        <span>{vessel.vessel_type}</span>
        {vessel.flag && <span>🏴 {vessel.flag}</span>}
        <span className={`vessel-card__priority vessel-card__priority--${vessel.investigative_priority}`}>
          {vessel.investigative_priority}
        </span>
      </div>

      {/* Score breakdown bars */}
      {isSelected && (
        <>
          <div className="score-bars">
            {featureBars.map((bar) => (
              <div className="score-bar" key={bar.label}>
                <span className="score-bar__label">{bar.label}</span>
                <div className="score-bar__track">
                  <div
                    className="score-bar__fill"
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
                <span className="score-bar__value">{bar.value.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Reasons */}
          {vessel.reasons.length > 0 && (
            <div className="reasons">
              {vessel.reasons.map((reason, i) => (
                <div className="reasons__item" key={i}>
                  <span className="reasons__bullet">›</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
