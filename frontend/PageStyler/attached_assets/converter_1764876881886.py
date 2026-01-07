import json
import scheduleGrading
from numpy._core.numeric import nan
import pandas as pd
import numpy as np
df = pd.read_csv(r'C:\Users\kenny\Desktop\CS 124 H\1101-modified+RMP-2025-sp.csv')
def convertScheduleListToJson(scheduleList):
    returnList = []
    for schedule in scheduleList:
        scheduleList = []
        for courseIndex in schedule:
            courseDict = {
                "course": df.loc[courseIndex, 'Code'] + " " + df.loc[courseIndex, 'Number'],
                "name": df.loc[courseIndex, 'Name'],
                "description": df.loc[courseIndex, 'Description'],
                "credit": df.loc[courseIndex, 'Credit Hours'],
                "degree": df.loc[courseIndex, 'Degree Attributes'],
                "CRN": df.loc[courseIndex, 'CRN'],
                "section": df.loc[courseIndex, 'Section'],
                "term": df.loc[courseIndex, 'Part of Term'],
                "type": df.loc[courseIndex, 'Type'],
                "start": df.loc[courseIndex, 'Start Time'],
                "end": df.loc[courseIndex, 'End Time'],
                "days": df.loc[courseIndex, 'Days of Week'],
                "building": df.loc[courseIndex, 'Building'],
                "room": str(df.loc[courseIndex, 'Room']),
                "location": df.loc[courseIndex, 'Bulding'] + " " + str(df.loc[courseIndex, 'Room']),
                "instructors": df.loc[courseIndex, 'Instructors']
            }
            scheduleList.append(courseDict)
        returnList.append([scheduleGrading.grade(schedule),scheduleList])
    return json.dumps(returnList, indent=4)

sampleCourseDict = {
    "course": "CS 124",
    "name": "Introduction to Computer Science I",
    "description": "Basic concepts in computing and fundamental techniques for solving computational problems. Intended as a first course for computer science majors and others with a deep interest in computing. Credit is not given for both CS 124 and CS 125. Prerequisite: Three years of high school mathematics or MATH 112.",
    "credit": "3 hours.",
    "degree": "Quantitative Reasoning I course.",
    "CRN": 71578,
    "section": "AYF",
    "term": "1",
    "type": "Discussion/Recitation",
    "start": "11:00:00 am",
    "end": "11:50:00 am",
    "days": "T",
    "building": "Campus Instructional Facility",
    "room": "4029",
    "location": "Campus Instructional Facility 4029",
    "instructors": "Challen, G"
}
#if the section is an online one, the end, days, location will be null, while start will be "ARRANGED"