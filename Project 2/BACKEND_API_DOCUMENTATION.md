# Backend API Documentation

## Overview
This document describes the Flask backend API for the Course Scheduling application. The backend provides endpoints for course search and schedule generation based on user preferences.

## Base URL
```
http://localhost:5000
```

## CORS Configuration
The backend allows cross-origin requests from any origin with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Endpoints

### 1. Health Check

**Endpoint:** `GET /ping`

**Description:** Checks if the server is running

**Response:**
```
"hello this server is working yeah"
```

---

### 2. Search Courses by Department

**Endpoint:** `GET /search/<department>`

**Description:** Retrieves all courses for a given department code

**URL Parameters:**
- `department` (string): Department code (e.g., "CS", "MATH", "ECE")

**Example Request:**
```bash
curl http://localhost:5000/search/CS
```

**Response Format:**
```json
{
  "success": true,
  "result": [
    {
      "number": "124",
      "name": "Introduction to Computer Science I"
    },
    {
      "number": "128",
      "name": "Introduction to Computer Science II"
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Indicates if the request was successful
- `result` (array): List of course objects
  - `number` (string): Course number
  - `name` (string): Full course name

---

### 3. Generate Schedules

**Endpoint:** `POST /preferences`

**Description:** Generates top 10 schedules based on user preferences

**Request Body:**
```json
{
  "course_list": ["CS 124", "MATH 221", "ECE 120"],
  "CRN_list": [71578, 34123],
  "hard_breaks": [[0, 0, ...], [0, 2, ...], ...],
  "soft_preferences": [3, 4, 3, 2, 3, 4, 3, "B+", 4]
}
```

**Request Body Fields:**

#### `course_list` (array of strings)
- List of courses in format "DEPT NUMBER" (e.g., "CS 124", "MATH 221")
- Example: `["CS 124", "MATH 241", "ECE 120"]`

#### `CRN_list` (array of integers)
- List of Course Registration Numbers (CRNs) for required sections
- Use this when you want to force specific sections into the schedule
- Example: `[71578, 34123]`

#### `hard_breaks` (2D array: 5x90)
- Represents time constraints for 5 days (M, T, W, R, F) and 90 time slots (7:00 AM - 10:00 PM in 10-minute intervals)
- Format: Array of 5 arrays, each with 90 elements
- Values:
  - `0`: No restriction (available time)
  - `1`: Soft break (preference to avoid)
  - `2`: Hard break (must avoid)
- Example:
  ```json
  [
    [0, 0, 0, 2, 2, 2, 0, ...],  // Monday (90 elements)
    [0, 0, 0, 0, 0, 0, 0, ...],  // Tuesday (90 elements)
    [0, 0, 0, 2, 2, 2, 0, ...],  // Wednesday (90 elements)
    [0, 0, 0, 0, 0, 0, 0, ...],  // Thursday (90 elements)
    [0, 0, 0, 2, 2, 2, 0, ...]   // Friday (90 elements)
  ]
  ```

#### `soft_preferences` (array with 9 elements)
- Index 0: `professor_importance` (int 1-5) - How much professor quality matters
- Index 1: `rmp_score_weight` (int 1-5) - Weight for Rate My Professor scores
- Index 2: `professor_excellence_weight` (int 1-5) - Weight for teaching excellence ratings
- Index 3: `difficulty_importance` (int 1-5) - How much class difficulty matters
- Index 4: `professor_gpa_weight` (int 1-5) - Weight for professor's average GPA
- Index 5: `class_gpa_weight` (int 1-5) - Weight for class average GPA
- Index 6: `acceptable_gpa_weight` (int 1-5) - Weight for acceptable GPA percentage
- Index 7: `min_acceptable_gpa` (string) - Minimum acceptable grade ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F")
- Index 8: `softbreak_importance` (int 1-5) - How much soft break preferences matter

**Example Request:**
```bash
curl -X POST http://localhost:5000/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "course_list": ["CS 124", "MATH 221"],
    "CRN_list": [],
    "hard_breaks": [[0,...], [0,...], [0,...], [0,...], [0,...]],
    "soft_preferences": [3, 4, 3, 2, 3, 4, 3, "B+", 4]
  }'
```

**Response Format:**
```json
{
  "success": true,
  "schedules": [
    {
      "score": 87.5,
      "schedule": [
        {
          "course": "CS 124",
          "name": "Introduction to Computer Science I",
          "description": "Basic concepts in computing and fundamental techniques...",
          "credit": "3 hours",
          "degree": "Quant I",
          "CRN": 71578,
          "section": "AL1",
          "term": "1",
          "type": "Lecture",
          "start": "09:00:00 am",
          "end": "09:50:00 am",
          "days": "MWF",
          "location": "Siebel Center 1404",
          "instructors": "Challen, G"
        },
        {
          "course": "MATH 221",
          "name": "Calculus I",
          "description": "First course in calculus and analytic geometry...",
          "credit": "4 hours",
          "degree": "Quant I",
          "CRN": 34123,
          "section": "BL2",
          "term": "1",
          "type": "Lecture",
          "start": "11:00:00 am",
          "end": "12:20:00 pm",
          "days": "TR",
          "location": "Altgeld Hall 314",
          "instructors": "Smith, A"
        }
      ]
    }
  ]
}
```

**Response Fields:**
- `success` (boolean): Indicates if the request was successful
- `schedules` (array): Top 10 schedules, sorted by score (highest first)
  - `score` (float): Overall score for the schedule based on preferences
  - `schedule` (array): List of course sections in this schedule
    - `course` (string): Course code (e.g., "CS 124")
    - `name` (string): Full course name
    - `description` (string): Course description
    - `credit` (string): Credit hours (e.g., "3 hours")
    - `degree` (string): Degree attributes/requirements fulfilled
    - `CRN` (integer): Course Registration Number
    - `section` (string): Section identifier
    - `term` (string): Part of term ("1", "A", "B", "", "LF")
    - `type` (string): Class type (e.g., "Lecture", "Lab", "Discussion")
    - `start` (string): Start time (format: "HH:MM:SS am/pm")
    - `end` (string): End time (format: "HH:MM:SS am/pm")
    - `days` (string): Days of week (e.g., "MWF", "TR", "MTWRF")
    - `location` (string): Building and room (e.g., "Siebel Center 1404")
    - `instructors` (string): Instructor name(s)

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "no data can be provided"
}
```

---

## Data Structures

### Time Slot Grid
The time slot grid represents a week's schedule:
- **Dimensions:** 5 rows (days) × 90 columns (time slots)
- **Days:** Monday (0), Tuesday (1), Wednesday (2), Thursday (3), Friday (4)
- **Time Slots:** 7:00 AM to 10:00 PM in 10-minute intervals
  - Slot 0 = 7:00 AM
  - Slot 6 = 8:00 AM
  - Slot 90 = 10:00 PM
- **Values:**
  - `0` = Available
  - `1` = Soft preference (prefer not to schedule)
  - `2` = Hard constraint (must not schedule)

### Course Format
Courses are specified as strings in the format: `"DEPARTMENT NUMBER"`
- Department: 2-4 letter code (e.g., "CS", "MATH", "ECE")
- Number: 3 digit course number (e.g., "124", "241")
- Example: `"CS 124"`, `"MATH 241"`

### Days of Week Encoding
- "M" = Monday
- "T" = Tuesday
- "W" = Wednesday
- "R" = Thursday (R for Thursday to avoid confusion with T for Tuesday)
- "F" = Friday

---

## Backend Implementation Details

### Key Functions

#### `find_courses(department)`
- Located in: `scheduler.py`
- Searches the course dataset for all courses in a given department
- Returns unique courses (removes duplicate sections)

#### `generate_schedule(course_list, CRN_list, time_breaks, soft_preferences)`
- Located in: `scheduler.py`
- Main scheduling algorithm
- Steps:
  1. Converts time_breaks array (0,1,2) to hard_breaks (0,5) and soft_breaks (0,1)
  2. Calls `hardfilter()` to generate valid schedules based on hard constraints
  3. Scores each valid schedule using soft preferences
  4. Returns top 10 schedules sorted by score

#### `hardfilter(inputTimespace, courses, CRNs)`
- Located in: `hard_filtering_code.py`
- Generates all valid schedules that satisfy hard constraints
- Uses DFS (Depth-First Search) to explore combinations
- Respects CRN requirements and time conflicts

#### `score_schedules(schedules, soft_prefs, soft_breaks)`
- Located in: `scheduler.py`
- Scores each schedule based on:
  - Professor quality (RMP scores, excellence ratings)
  - Class difficulty (GPA data)
  - Soft break preferences
- Returns schedules with calculated scores

---

## Running the Backend

### Prerequisites
```bash
pip install flask pandas numpy
```

### Start the Server
```bash
cd "Project 2/data_processing/filter"
python app.py
```

The server will run on `http://localhost:5000` in debug mode.

---

## Notes

- The backend loads course data from `../../datasets/11-7-2025-sp.csv`
- All course data is for Spring 2025 semester
- The hard filtering algorithm has a limit of 30,000 possible schedules to prevent excessive computation
- Schedules are scored and ranked, with only the top 10 returned
