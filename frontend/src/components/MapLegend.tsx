/* Map legend — colour key for the map layers */

export default function MapLegend() {
  const items = [
    { color: '#ef4444', label: 'Oil Spill' },
    { color: '#f59e0b', label: 'Origin Zone' },
    { color: '#3b82f6', dashed: true, label: 'Backward Drift' },
    { color: '#22c55e', dashed: true, label: 'Forward Drift' },
    { color: '#ef4444', label: 'Rank #1 Vessel', line: true },
    { color: '#f59e0b', label: 'Rank #2 Vessel', line: true },
    { color: '#06b6d4', label: 'Rank #3 Vessel', line: true },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 16,
      zIndex: 1000,
      background: 'rgba(17, 24, 39, 0.92)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 11,
      color: '#8b97b0',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < items.length - 1 ? 4 : 0 }}>
          <div style={{
            width: item.line || item.dashed ? 20 : 12,
            height: item.line || item.dashed ? 3 : 12,
            borderRadius: item.line || item.dashed ? 1 : 2,
            background: item.color,
            opacity: 0.8,
            borderTop: item.dashed ? `2px dashed ${item.color}` : 'none',
          }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
