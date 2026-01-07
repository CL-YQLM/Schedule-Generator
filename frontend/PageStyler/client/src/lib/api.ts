// API client for backend communication

const API_BASE_URL = 'http://127.0.0.1:5001';

export interface Course {
  number: string;
  name: string;
}

export interface CourseSection {
  course: string;
  name: string;
  description: string;
  credit: string;
  degree: string;
  CRN: number;
  section: string;
  term: string;
  type: string;
  start: string;
  end: string;
  days: string;
  location: string;
  instructors: string;
}

export interface Schedule {
  score: number;
  schedule: CourseSection[];
}

export interface GenerateScheduleRequest {
  course_list: string[];
  CRN_list: number[];
  hard_breaks: number[][];
  soft_preferences: (number | string)[];
}

export interface SearchCoursesResponse {
  success: boolean;
  result: Course[];
}

export interface GenerateScheduleResponse {
  success: boolean;
  schedules: Schedule[];
}

/**
 * Search for courses by department code
 */
export async function searchCourses(department: string): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/search/${department.toUpperCase()}`);

  if (!response.ok) {
    throw new Error(`Failed to search courses: ${response.statusText}`);
  }

  const data: SearchCoursesResponse = await response.json();

  if (!data.success) {
    throw new Error('Search failed');
  }

  return data.result;
}

/**
 * Generate schedules based on user preferences
 */
export async function generateSchedules(
  preferences: GenerateScheduleRequest
): Promise<Schedule[]> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate schedules: ${response.statusText}`);
  }

  const data: GenerateScheduleResponse = await response.json();

  if (!data.success) {
    throw new Error('Schedule generation failed');
  }

  return data.schedules;
}

/**
 * Ping the server to check if it's running
 */
export async function pingServer(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/ping`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
