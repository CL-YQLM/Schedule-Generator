import hard_filtering_code as hf
import soft_filtering_code as sf
import location_code as lc
import pandas as pd
import numpy as np
from numpy import nan
import os
import html
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "../../datasets/11-7-2025-sp.csv")
df = pd.read_csv(csv_path)

def find_courses(department):
    """
    Find all courses for a given department code (e.g., "CS")
    Returns a list of dictionaries with course number and name
    """
    # Filter dataframe for the given department
    dept_courses = df[df['Code'] == department.upper()]

    # Get unique courses (since there can be multiple sections of the same course)
    unique_courses = dept_courses.drop_duplicates(subset=['Number', 'Name'])

    # Create list of JSON objects with number and name
    course_list = []
    for _, row in unique_courses.iterrows():
        course_list.append({
            "number": str(row['Number']),
            "name": html.unescape(str(row['Name']))
        })

    return course_list


def generate_schedule(course_list, CRN_list, time_breaks, soft_preferences, location_preferences=None):
    """
    generate and rank schedules
    return top 10 schedules
    """
    #hard break: 2, soft break: 1, empty: 0
    # Convert to numpy array and ensure it's 2D (5x90)
    time_breaks = np.array(time_breaks)
    if time_breaks.size == 0 or time_breaks.shape != (5, 90):
        # Initialize empty arrays if no time breaks provided or shape is wrong
        hard_breaks = np.zeros((5, 90))
        soft_breaks = np.zeros((5, 90))
    else:
        hard_breaks = np.where(time_breaks == 2, 5, 0)
        soft_breaks = np.where(time_breaks == 1, 1, 0)

    # Ensure the arrays are the correct shape
    hard_breaks = np.asarray(hard_breaks).reshape(5, 90)
    soft_breaks = np.asarray(soft_breaks).reshape(5, 90)

    # generate all valid schedules based on hard preferences
    valid_schedules = hf.hardFilter(hard_breaks, course_list, CRN_list)
    

    # score each schedule based on soft + location preferences
    scored_schedules = score_schedules(valid_schedules, soft_preferences, soft_breaks, location_preferences)

    #return top 10
    top_schedules = sorted(scored_schedules, key=lambda x: x['score'], reverse=True)[:10]

    return top_schedules



def score_schedules(schedules, soft_prefs, soft_breaks, location_preferences=None):
    """
    1. Soft preferences (importtance of 1-5 of how much the user cares about the below two)
    rate my professor score(1-5 of how much they care
    professor excellence and oustanding rating(1-5 of how much they care

    2. class difficulty(importtance of 1-5 of how much the user cares about the below two)
    professor average GPA ((1-5 of how much they care
    class average GPA ((1-5 of how much they care
    minimum acceptable GPA (A+ to F)

    3. Locations(importtance of 1-5 of how much the user cares about the below two)
     maximum late minues(0-30minutes)
    location selected as center(out of the optioins we provided on the website)
    promixity to center point(in km)

     Expected soft_prefs structure:
  {
      "professor_importance": int (1-5),
      "rmp_score_weight": int (1-5),
      "professor_excellence_weight": int (1-5),
      "difficulty_importance": int (1-5),
      "professor_gpa_weight": int (1-5),
      "class_gpa_weight": int (1-5),
      "acceptable_gpa_weight": int (1-5),
      "min_acceptable_gpa": str ("A+" to "F"),
      "softbreak_importance": int (1-5)
  }
    """
    scored = []

    for schedule in schedules:
    
        prof_score = sf.prof_score(schedule, soft_prefs[1], soft_prefs[2])
        class_score = sf.class_score(schedule, soft_prefs[4], soft_prefs[5], soft_prefs[6], soft_prefs[7])
        softbreak_score = sf.softbreak_score(schedule, soft_breaks)

        loc = location_preferences or {}
        loc_importance = loc.get("importance", 3)
        location_val = lc.location_score(
            schedule,
            loc.get("walking_distance", 15),
            loc.get("lateness_tolerance", 10),
        )

        # All component scores are on a 0-100 scale; softbreak_score is 0-1 so scale it.
        score = 0
        total = 0
        if prof_score != -1:
            score += prof_score * soft_prefs[0]
            total += soft_prefs[0]
        if class_score != -1:
            score += class_score * soft_prefs[3]
            total += soft_prefs[3]
        if softbreak_score != -1:
            score += (softbreak_score * 100) * soft_prefs[8]
            total += soft_prefs[8]
        if location_val != -1:
            score += location_val * loc_importance
            total += loc_importance

        if total == 0:
            final_score = 0
        else:
            final_score = score / total

        returnSchedule = []
        for section in schedule:
            # Handle NaN values properly for days
            days_value = df.loc[section, 'Days of Week']
            days_str = "" if pd.isna(days_value) else str(days_value)

            returnSchedule.append({
                "course": str(df.loc[section, 'Code']) + " " + str(df.loc[section, 'Number']),
                "name": html.unescape(str(df.loc[section, 'Name'])),
                "description": html.unescape(str(df.loc[section, 'Description'])),
                "credit": str(df.loc[section, 'Credit Hours']),
                "degree": str(df.loc[section, 'Degree Attributes']),
                "CRN": int(df.loc[section, 'CRN']),
                "section": str(df.loc[section, 'Section']),
                "term": str(df.loc[section, 'Part of Term']),
                "type": str(df.loc[section, 'Type']),
                "start": str(df.loc[section, 'Start Time']),
                "end": str(df.loc[section, 'End Time']),
                "days": days_str,
                "location": (str(df.loc[section, 'Building']) + " " + str(df.loc[section, 'Room'])).strip(),
                "instructors": str(df.loc[section, 'Instructors'])
            })

        schedule_entry = {
            "score": final_score,
            "schedule": returnSchedule
        }
        scored.append(schedule_entry)

    return scored

