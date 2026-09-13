// API client for backend communication

// Override with VITE_API_URL (.env) to point at a deployed backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

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

export interface LocationPreferences {
  importance: number;
  walking_distance: number;
  lateness_tolerance: number;
}

export interface GenerateScheduleRequest {
  course_list: string[];
  CRN_list: number[];
  hard_breaks: number[][];
  soft_preferences: (number | string)[];
  location_preferences: LocationPreferences;
}

export interface SearchCoursesResponse {
  success: boolean;
  result: Course[];
}

export interface GenerateScheduleResponse {
  success: boolean;
  schedules: Schedule[];
  message?: string;
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

  const data: GenerateScheduleResponse = await response
    .json()
    .catch(() => ({ success: false, schedules: [] }));

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Failed to generate schedules: ${response.statusText}`);
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
