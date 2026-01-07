import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ScheduleVisualizer from "@/components/ScheduleVisualizer";
import { useAppStore } from "@/lib/store";

// Helper function to convert days string to array
function parseDaysToArray(days: string): string[] {
  if (!days || days.trim() === '') {
    console.warn('Empty days string received');
    return [];
  }

  const dayMap: Record<string, string> = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };

  const result = days.split('').map(d => dayMap[d] || d).filter(d => d !== ' ');

  if (result.some(d => !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d))) {
    console.warn(`Invalid days parsed from "${days}":`, result);
  }

  return result;
}

// Helper function to format time
function formatTime(timeString: string): string {
  // Convert "09:30 AM" or "09:30:00 AM" or "12:00 PM" to 24-hour "09:30" or "12:00"
  const match = timeString.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
  if (!match) {
    // If no AM/PM found, just extract HH:MM
    const simpleMatch = timeString.match(/(\d{1,2}:\d{2})/);
    return simpleMatch ? simpleMatch[1] : timeString;
  }

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}


export default function Results() {
  const { state } = useAppStore();

  // Transform backend schedules to match ScheduleVisualizer format
  const displaySchedules = state.generatedSchedules.map((schedule, index) => {
        // Calculate total credit hours - only count each unique course once
        // (lectures and discussions for the same course share credit hours)
        const uniqueCourses = new Map<string, number>();
        schedule.schedule.forEach(section => {
          const courseCode = section.course; // e.g., "CS 128" or "MATH 314"
          if (!uniqueCourses.has(courseCode)) {
            const creditMatch = section.credit.match(/(\d+)/);
            const credits = creditMatch ? parseInt(creditMatch[1]) : 0;
            uniqueCourses.set(courseCode, credits);
          }
        });
        const creditHours = Array.from(uniqueCourses.values()).reduce((sum, credits) => sum + credits, 0);

        // Use the raw score from backend
        const matchPercentage = Math.round(schedule.score);

        // Debug first schedule
        if (index === 0) {
          console.log('DEBUG: First schedule from backend:', schedule);
          console.log('DEBUG: Calculated score:', matchPercentage);
          console.log('DEBUG: Calculated credits:', creditHours);
          console.log('DEBUG: Number of courses:', schedule.schedule.length);
          console.log('DEBUG: All courses:', schedule.schedule.map(s => `${s.course} ${s.section} (CRN: ${s.CRN})`));
          if (schedule.schedule.length > 0) {
            console.log('DEBUG: First course time:', schedule.schedule[0].start, 'to', schedule.schedule[0].end);
            console.log('DEBUG: Formatted time:', `${formatTime(schedule.schedule[0].start)}-${formatTime(schedule.schedule[0].end)}`);
          }
        }

        const transformedCourses = schedule.schedule.map((section, sectionIdx) => {
          const weekdays = parseDaysToArray(section.days);
          const time = `${formatTime(section.start)}-${formatTime(section.end)}`;

          if (index === 0) {
            console.log(`DEBUG: Section ${sectionIdx} - ${section.course} ${section.section}:`, {
              rawDays: section.days,
              daysType: typeof section.days,
              daysValue: JSON.stringify(section.days),
              parsedWeekdays: weekdays,
              rawStart: section.start,
              rawEnd: section.end,
              formattedTime: time,
              hasValidDays: weekdays && weekdays.length > 0,
              hasValidTime: time && time.includes('-')
            });
          }

          return {
            title: `${section.course}: ${section.name}`,
            description: section.description,
            weekdays,
            time,
            courseData: section
          };
        });

        // Summary log for first schedule
        if (index === 0) {
          const lectureCount = transformedCourses.filter(c => c.courseData?.type?.toLowerCase().includes('lecture')).length;
          const discussionCount = transformedCourses.filter(c => c.courseData?.type?.toLowerCase().includes('discussion')).length;
          const labCount = transformedCourses.filter(c => c.courseData?.type?.toLowerCase().includes('lab')).length;
          const emptyDaysCount = transformedCourses.filter(c => !c.weekdays || c.weekdays.length === 0).length;

          console.log('DEBUG SUMMARY:', {
            totalSections: transformedCourses.length,
            lectures: lectureCount,
            discussions: discussionCount,
            labs: labCount,
            sectionsWithEmptyDays: emptyDaysCount
          });

          if (emptyDaysCount > 0) {
            console.warn(`WARNING: ${emptyDaysCount} section(s) have no weekdays and won't appear on calendar!`);
            transformedCourses.forEach((c, i) => {
              if (!c.weekdays || c.weekdays.length === 0) {
                console.warn(`  - ${c.title} (${c.courseData?.type} ${c.courseData?.section})`);
              }
            });
          }
        }

        return {
          id: String.fromCharCode(65 + index), // A, B, C, etc.
          matchPercentage,
          creditHours,
          courses: transformedCourses
        };
      });

  return (
    <main className="container mx-auto px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all mb-4 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Planner
          </Button>
        </Link>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Recommended Schedules
        </h1>
        <p className="text-muted-foreground mt-2">
          {state.generatedSchedules.length > 0
            ? `Found ${state.generatedSchedules.length} schedule${state.generatedSchedules.length > 1 ? 's' : ''} based on your preferences for professor quality, timing, and location.`
            : "No schedules generated yet. Please generate schedules from the planner."}
        </p>
      </div>

      <div className="space-y-8">
        {displaySchedules.length > 0 ? (
          displaySchedules.map((schedule) => (
            <ScheduleVisualizer
              key={schedule.id}
              id={schedule.id}
              matchPercentage={schedule.matchPercentage}
              creditHours={schedule.creditHours}
              courses={schedule.courses}
              timeBreaks={state.timeBreaks}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No schedules available. Please generate schedules from the planner first.</p>
          </div>
        )}
      </div>
    </main>
  );
}
