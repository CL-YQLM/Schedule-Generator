"""
Location scoring: rewards schedules that keep back-to-back classes within a
comfortable walking distance, and penalizes ones that would make you sprint (or
be late) across campus between consecutive classes.

Building coordinates live in buildings_coords.json (real OpenStreetMap data for
UIUC buildings). Buildings without coordinates (rare annexes / off-campus /
remote sites) are treated as neutral and skipped, never guessed.
"""
import json
import math
import os
import re

import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "../../datasets/11-7-2025-sp.csv")
coords_path = os.path.join(script_dir, "buildings_coords.json")

df = pd.read_csv(csv_path)

with open(coords_path, encoding="utf-8") as f:
    BUILDING_COORDS = {name: tuple(latlon) for name, latlon in json.load(f).items()}

# Average walking speed ~1.4 m/s -> 84 m/min (standard pedestrian model).
WALK_SPEED_M_PER_MIN = 84.0


def _parse_time(time_str):
    """'02:00 PM' / '9:30:00 am' -> minutes since midnight. None if unparseable."""
    m = re.match(r"(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])", str(time_str))
    if not m:
        return None
    hours = int(m.group(1)) % 12
    if m.group(3).upper() == "PM":
        hours += 12
    return hours * 60 + int(m.group(2))


def _haversine_m(a, b):
    """Great-circle distance in meters between two (lat, lon) points."""
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371000.0 * math.asin(math.sqrt(h))


def _transition_score(dist_m, gap_min, walking_distance, lateness_tolerance):
    """Score a single back-to-back transition (0-100).

    Two components:
      - feasibility: can you physically get there given the time gap and how much
        lateness you tolerate?
      - comfort: is the required walk within the distance you're willing to walk?
    """
    required = dist_m / WALK_SPEED_M_PER_MIN  # minutes needed to walk

    if gap_min >= required:
        feasibility = 100.0
    else:
        late = required - gap_min
        feasibility = max(0.0, 100.0 * (1 - late / max(lateness_tolerance, 1)))

    if required <= walking_distance:
        comfort = 100.0
    else:
        comfort = max(0.0, 100.0 * (1 - (required - walking_distance) / max(walking_distance, 1)))

    return 0.7 * feasibility + 0.3 * comfort


def location_score(index_list, walking_distance, lateness_tolerance):
    """Average walking-comfort score (0-100) across all back-to-back transitions.

    Returns -1 when there is nothing to score (no consecutive classes, or the
    relevant buildings have no coordinate data) so the caller treats it as
    neutral instead of penalizing.
    """
    meetings_by_day = {d: [] for d in "MTWRF"}
    for idx in index_list:
        start = df.loc[idx, "Start Time"]
        end = df.loc[idx, "End Time"]
        days = df.loc[idx, "Days of Week"]
        building = df.loc[idx, "Building"]

        if pd.isna(start) or str(start).strip() == "ARRANGED" or pd.isna(days) or pd.isna(building):
            continue
        start_min = _parse_time(start)
        end_min = _parse_time(end)
        if start_min is None or end_min is None:
            continue

        for day in str(days):
            if day in meetings_by_day:
                meetings_by_day[day].append((start_min, end_min, building))

    scores = []
    for meetings in meetings_by_day.values():
        meetings.sort()
        for i in range(len(meetings) - 1):
            end_a, building_a = meetings[i][1], meetings[i][2]
            start_b, building_b = meetings[i + 1][0], meetings[i + 1][2]

            if building_a == building_b:
                scores.append(100.0)  # same building, no walk
                continue

            coord_a = BUILDING_COORDS.get(building_a)
            coord_b = BUILDING_COORDS.get(building_b)
            if coord_a is None or coord_b is None:
                continue  # no data -> neutral, don't guess

            dist_m = _haversine_m(coord_a, coord_b)
            gap_min = start_b - end_a
            scores.append(_transition_score(dist_m, gap_min, walking_distance, lateness_tolerance))

    if not scores:
        return -1
    return sum(scores) / len(scores)
