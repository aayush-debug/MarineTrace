"""Geospatial utilities — geodesic distance, bbox ops, GeoJSON helpers."""

from __future__ import annotations

import math

from pyproj import Geod
from shapely.geometry import (
    LineString,
    MultiPoint,
    Point,
    Polygon,
    mapping,
    shape,
)

# WGS-84 ellipsoid for geodesic calculations
_geod = Geod(ellps="WGS84")


def geodesic_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return geodesic distance between two points in kilometres."""
    _, _, dist_m = _geod.inv(lon1, lat1, lon2, lat2)
    return abs(dist_m) / 1000.0


def point_to_polygon_distance_km(
    lat: float, lon: float, polygon_coords: list[list[float]]
) -> float:
    """
    Minimum geodesic distance from a point to a polygon boundary.

    For a rough but fast approximation we compute the Shapely planar distance
    (in degrees) then convert via a local scale.  For investigations within
    a few hundred km this is plenty accurate.
    """
    pt = Point(lon, lat)
    poly = Polygon(polygon_coords)
    if poly.contains(pt):
        return 0.0
    nearest = poly.exterior.interpolate(poly.exterior.project(pt))
    return geodesic_distance_km(lat, lon, nearest.y, nearest.x)


def line_to_polygon_min_distance_km(
    line_coords: list[list[float]], polygon_coords: list[list[float]]
) -> float:
    """Minimum distance (km) between a LineString and a Polygon."""
    line = LineString(line_coords)
    poly = Polygon(polygon_coords)
    if line.intersects(poly):
        return 0.0
    nearest_on_line = line.interpolate(line.project(poly.centroid))
    nearest_on_poly = poly.exterior.interpolate(poly.exterior.project(nearest_on_line))
    return geodesic_distance_km(
        nearest_on_line.y, nearest_on_line.x,
        nearest_on_poly.y, nearest_on_poly.x,
    )


def expand_bbox(
    min_lat: float, min_lon: float, max_lat: float, max_lon: float,
    buffer_km: float = 50.0,
) -> tuple[float, float, float, float]:
    """Expand a bounding box by approximately `buffer_km` in each direction."""
    # ~1 degree latitude ≈ 111 km
    deg_buffer = buffer_km / 111.0
    return (
        max(min_lat - deg_buffer, -90),
        max(min_lon - deg_buffer, -180),
        min(max_lat + deg_buffer, 90),
        min(max_lon + deg_buffer, 180),
    )


def polygon_from_points(points: list[tuple[float, float]], buffer_deg: float = 0.05) -> dict:
    """
    Create a GeoJSON polygon from a set of (lon, lat) points.

    Uses convex hull with an optional buffer (in degrees) to create an
    origin probability zone.  This is the MVP approximation documented in
    the plan — a proper kernel-density surface can replace it later.
    """
    if len(points) < 3:
        # Not enough points for a polygon — return a buffered centroid
        mp = MultiPoint(points)
        centroid = mp.centroid
        circle = centroid.buffer(buffer_deg)
        return mapping(circle)

    hull = MultiPoint(points).convex_hull
    buffered = hull.buffer(buffer_deg)
    return mapping(buffered)


def centroid_of_points(points: list[tuple[float, float]]) -> tuple[float, float]:
    """Return (lon, lat) centroid of a collection of (lon, lat) points."""
    mp = MultiPoint(points)
    c = mp.centroid
    return (c.x, c.y)


def make_linestring_geojson(coords: list[list[float]]) -> dict:
    """Build a GeoJSON LineString from [[lon, lat], ...]."""
    return {"type": "LineString", "coordinates": coords}


def make_polygon_geojson(coords: list[list[list[float]]]) -> dict:
    """Build a GeoJSON Polygon from [[[lon, lat], ...]]."""
    return {"type": "Polygon", "coordinates": coords}


def bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Forward azimuth (bearing) from point 1 to point 2 in degrees 0-360."""
    az, _, _ = _geod.inv(lon1, lat1, lon2, lat2)
    return az % 360
