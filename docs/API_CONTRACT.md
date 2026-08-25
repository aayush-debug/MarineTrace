# SlickTrace API Contract

> Interface specification between the ML component and the backend system.
> All geometry uses GeoJSON-compatible structures.

---

## 1. ML Output — `SpillDetection`

The ML component must return this exact schema.

```json
{
  "spill_detected": true,
  "confidence": 0.92,
  "area_km2": 18.4,
  "centroid": {
    "latitude": 18.721,
    "longitude": 72.914
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[72.89, 18.70], [72.92, 18.705], ...]]
  },
  "observation_time": "2026-08-25T10:30:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spill_detected` | boolean | ✅ | Whether oil was detected |
| `confidence` | float (0–1) | ✅ | Detection confidence |
| `area_km2` | float | ✅ | Estimated area in km² |
| `centroid` | object | ✅ | `{latitude, longitude}` |
| `geometry` | GeoJSON Polygon | ✅ | Spill boundary |
| `observation_time` | ISO 8601 | ✅ | Satellite observation time |

---

## 2. Drift Output — `DriftResult`

```json
{
  "origin": {
    "latitude": 18.915,
    "longitude": 73.203,
    "confidence": 0.84,
    "geometry": { "type": "Polygon", "coordinates": [...] }
  },
  "origin_time_window": {
    "start": "2026-08-24T10:30:00Z",
    "end": "2026-08-24T16:30:00Z"
  },
  "backward_trajectory": {
    "direction": "backward",
    "points": [[72.914, 18.721], [72.917, 18.724], ...],
    "timestamps": ["2026-08-25T10:30:00Z", ...],
    "geometry": { "type": "LineString", "coordinates": [...] }
  },
  "forward_trajectory": {
    "direction": "forward",
    "points": [[72.914, 18.721], [72.911, 18.718], ...],
    "timestamps": ["2026-08-25T10:30:00Z", ...],
    "geometry": { "type": "LineString", "coordinates": [...] }
  }
}
```

---

## 3. AIS Output — `VesselTrack`

```json
{
  "mmsi": "419001234",
  "name": "MV Ocean Star",
  "vessel_type": "Oil Tanker",
  "flag": "PA",
  "positions": [
    {
      "timestamp": "2026-08-24T08:00:00Z",
      "latitude": 18.92,
      "longitude": 73.18,
      "speed": 8.5,
      "heading": 215.0,
      "course": 218.0
    }
  ],
  "trajectory": {
    "type": "LineString",
    "coordinates": [[73.18, 18.92], ...]
  }
}
```

---

## 4. Attribution Output — `VesselAttribution`

```json
{
  "rank": 1,
  "vessel_name": "MV Ocean Star",
  "mmsi": "419001234",
  "score": 47.9,
  "confidence": "low",
  "feature_scores": {
    "spatial": 40.9,
    "temporal": 80.8,
    "trajectory": 13.9,
    "behaviour": 21.3,
    "vessel_relevance": 95.0
  },
  "reasons": [
    "Approached to 8.9 km of estimated origin",
    "Present during estimated spill window",
    "Sudden speed change of 7.1 knots detected"
  ],
  "investigative_priority": "LOW",
  "vessel_type": "Oil Tanker",
  "flag": "PA"
}
```

### Attribution Weights

| Feature | Weight | Description |
|---------|--------|-------------|
| Spatial | 30% | Geodesic distance to origin zone |
| Temporal | 25% | Overlap with spill-origin time window |
| Trajectory | 20% | Track intersection with origin zone |
| Behaviour | 15% | Speed/heading anomalies |
| Vessel Relevance | 10% | Vessel type relevance |

### Investigative Priority

| Score | Priority |
|-------|----------|
| ≥ 80 | HIGH |
| 50–79 | MEDIUM |
| < 50 | LOW |

---

## 5. API Endpoints

| Method | Path | Request | Response |
|--------|------|---------|----------|
| `GET` | `/ping` | — | `{"status": "ok"}` |
| `POST` | `/investigate` | `InvestigationRequest` | `InvestigationResponse` |
| `POST` | `/demo/investigation` | — | `InvestigationResponse` |
| `GET` | `/investigation/{id}` | — | `InvestigationResponse` |
| `POST` | `/drift/backward` | `DriftRequest` | `DriftResult` |
| `POST` | `/drift/forward` | `DriftRequest` | `DriftTrajectory` |
| `GET` | `/vessels/search` | query params | `VesselTrack[]` |

### `InvestigationRequest`

```json
{
  "image": "base64_or_null",
  "observation_time": "2026-08-25T10:30:00Z",
  "backward_hours": 24,
  "forward_hours": 24
}
```

### `InvestigationResponse`

```json
{
  "investigation_id": "INC-ABC123",
  "status": "COMPLETE",
  "observation_time": "2026-08-25T10:30:00Z",
  "spill": { ... },
  "drift": { ... },
  "vessels": [ ... ],
  "pipeline_duration_seconds": 0.1,
  "is_demo": true,
  "disclaimer": "This analysis provides potential vessel attribution..."
}
```
