import pandas as pd
import hard_filtering_code as hf
import numpy as np
from numpy import nan
import os
import ast
script_dir = os.path.dirname(os.path.abspath(__file__))
print(script_dir)
csv_path = os.path.join(script_dir, "../../datasets/11-7-2025-sp.csv")
df = pd.read_csv(csv_path)

#prof_score(indexList, weight_eo: Int (1-5) , weight_RMP: Int (1-5) )
#class_score(indexList, weight_prof: Int (1-5), weight_class: Int (1-5), weight_percentage: Int (1-5), min_gpa: Str ('A'))
#softbreak_score(indexList, timespace)


#/////////////////////////////////////////////////////////////////////////////////////////////

#/////////////////////////////////////////////////////////////////////////////////////////////

prof_weight_excellent = 0.7
prof_weight_oustanding = 1.0

def prof_eo(index):
    if np.isnan(df.loc[index, 'Excellent']) or np.isnan(df.loc[index, 'Outstanding']):
        return -1
    value = df.loc[index, 'Excellent'] * prof_weight_excellent + df.loc[index, 'Outstanding'] * prof_weight_oustanding + 1
    result = np.log(value) / np.log(21)  # log base 21
    return result

def prof_RMP(index):
    if np.isnan(df.loc[index, 'RMP']):
        return -1
    return df.loc[index, 'RMP'] * 20

def prof_score_index(index, weight_eo, weight_RMP):
    weight = 0
    total = 0
    if prof_eo(index) != -1:
        weight += weight_eo * prof_eo(index)
        total += weight_eo
    if prof_RMP(index) != -1:
        weight += weight_RMP * prof_RMP(index)
        total += weight_RMP
    if total == 0:
        return -1
    return weight / total

def prof_score(indexList, weight_eo, weight_RMP):
    count = 0
    sum = 0
    for index in indexList:
        if prof_score_index(index, weight_eo, weight_RMP) != -1:
            count += 1
            sum += prof_score_index(index, weight_eo, weight_RMP)
    if count == 0:
        return -1
    return sum / count

#/////////////////////////////////////////////////////////////////////////////////////////////

#/////////////////////////////////////////////////////////////////////////////////////////////

gpa_map = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'W': 0.0
}

def parse_grade_list(grades):
    """Convert CSV string to list of floats if needed."""
    if pd.isna(grades) or grades is None:
        return None
    if isinstance(grades, str):
        grades = ast.literal_eval(grades)
    if isinstance(grades, (int, float)):
        return None
    return [float(x) for x in grades]

def avg_gpa_from_list(grades):
    """Calculate GPA from a grade list (last element = total students)."""
    grades = parse_grade_list(grades)
    if grades is None or len(grades) == 0:
        return -1
    total_students = grades[-1]
    grade_counts = grades[:-1]
    weighted_sum = sum(gpa * count for gpa, count in zip(gpa_map.values(), grade_counts))
    return weighted_sum / total_students if total_students > 0 else -1

def gpa_score(index, weight_prof, weight_class):
    """Return (professor + class GPA)  for a given CRN."""
    if pd.isna(df.loc[index, 'CRN']):
        return -1

    prof_grades = df.loc[index, "Mean Grade By Professor (A+..F,W,Students)"]
    class_grades = df.loc[index, "Mean Grade By Class (A+..F,W,Students)"]

    prof_gpa = avg_gpa_from_list(prof_grades)
    class_gpa = avg_gpa_from_list(class_grades)

    if prof_gpa == -1 and class_gpa == -1:
        return -1
    elif prof_gpa == -1:
        return class_gpa
    elif class_gpa == -1:
        return prof_gpa
    else:
        return (prof_gpa * weight_prof + class_gpa * weight_class) / (weight_prof + weight_class)

def percent_ge_from_list(grades, min_gpa):
    """Calculate percentage of students with GPA >= threshold."""
    grades = parse_grade_list(grades)
    if grades is None or len(grades) == 0:
        return -1
    total_students = grades[-1]
    grade_counts = grades[:-1]
    above_count = sum(count for gpa, count in zip(gpa_map.values(), grade_counts) if gpa >= gpa_map[min_gpa])
    return (above_count / total_students) * 100 if total_students > 0 else -1

def percent_ge(index, min_gpa):
    prof_grades = df.loc[index, 'Mean Grade By Professor (A+..F,W,Students)']
    class_grades = df.loc[index, 'Mean Grade By Class (A+..F,W,Students)']

    if pd.isna(prof_grades) and pd.isna(class_grades):
        return -1
    grades = prof_grades if not pd.isna(prof_grades) else class_grades
    return percent_ge_from_list(grades, min_gpa)

def class_score_index(index, weight_prof, weight_class, weight_percentage, min_gpa):
    """Sum RMP sum + GPA score + %prof >= min_gpa1 + %class >= min_gpa2."""
    gpa_val = gpa_score(index, weight_prof, weight_class)
    percentage = percent_ge(index, min_gpa)
    weight = 0
    total = 0
    weight_average = (weight_prof + weight_class) / 2.0
    if gpa_val != -1:
        # Scale GPA from 0-4 to 0-100 to match percentage scale
        gpa_scaled = (gpa_val / 4.0) * 100
        weight += weight_average * gpa_scaled
        total += weight_average
    if percentage != -1:
        weight += weight_percentage * percentage
        total += weight_percentage
    if total == 0:
        return -1
    return weight / total

def class_score(indexList, weight_prof, weight_class, weight_percentage, min_gpa):
    count = 0
    sum = 0
    for index in indexList:
        if class_score_index(index, weight_prof, weight_class, weight_percentage, min_gpa) != -1:
            count += 1
            sum += class_score_index(index, weight_prof, weight_class, weight_percentage, min_gpa)
    if count == 0:
        return -1
    return sum / count

#/////////////////////////////////////////////////////////////////////////////////////////////

#/////////////////////////////////////////////////////////////////////////////////////////////

def softbreak_time(timespace):
    number = 0
    for i in range(0, 5):
        for j in range(0, 90):
            if timespace[i][j] != 0:
                number += 1
    return number

def softbreak_conflict(index, timespace):
    number = 0
    newTimespace = hf.hardFilter_toTimespace(index)
    for i in range(0, 5):
        for j in range(0, 90):
            if timespace[i][j] != 0 and newTimespace[i][j] != 0:
                number += 1
    return number

def softbreak_score(indexList, timespace):
    totalTime = softbreak_time(timespace)
    if totalTime == 0:
        return 1.0
    countTime = 0
    for index in indexList:
        countTime += softbreak_conflict(index, timespace)
    return 1.0 - countTime * 1.0 / totalTime

#/////////////////////////////////////////////////////////////////////////////////////////////

#/////////////////////////////////////////////////////////////////////////////////////////////

def distance_score(index):
    return 1