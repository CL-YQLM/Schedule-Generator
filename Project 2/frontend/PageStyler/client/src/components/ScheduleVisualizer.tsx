import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User, Calendar } from "lucide-react";

interface Course {
  title: string;
  description: string;
  weekdays: string[];
  time: string;
  courseData?: {
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
    building: string;
    room: string;
    location: string;
    instructors: string;
  };
}

interface ScheduleOptionProps {
  id: string;
  matchPercentage: number;
  creditHours: number;
  courses: Course[];
  timeBreaks?: number[][];
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const COLORS = [
  "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200",
  "bg-purple-100 border-purple-500 text-purple-700 hover:bg-purple-200",
  "bg-pink-100 border-pink-500 text-pink-700 hover:bg-pink-200",
  "bg-amber-100 border-amber-500 text-amber-700 hover:bg-amber-200",
  "bg-emerald-100 border-emerald-500 text-emerald-700 hover:bg-emerald-200",
  "bg-cyan-100 border-cyan-500 text-cyan-700 hover:bg-cyan-200",
];

export default function ScheduleVisualizer({ id, matchPercentage, creditHours, courses, timeBreaks }: ScheduleOptionProps) {
  // Helper to convert time string "HH:MM" to minutes from start of day (7:00 AM)
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 60 + minutes) - (7 * 60); // Offset from 7:00 AM
  };

  // Helper to get event duration in minutes
  const getDuration = (timeRange: string) => {
    const [start, end] = timeRange.split("-");
    return timeToMinutes(end) - timeToMinutes(start);
  };

  // Create a mapping of course codes to color indices
  // This ensures all sections of the same course get the same color
  const courseColorMap = React.useMemo(() => {
    const uniqueCourses = new Set<string>();
    courses.forEach(course => {
      if (course.courseData?.course) {
        uniqueCourses.add(course.courseData.course);
      }
    });
    const colorMap = new Map<string, number>();
    Array.from(uniqueCourses).forEach((courseCode, index) => {
      colorMap.set(courseCode, index);
    });
    return colorMap;
  }, [courses]);

  // Convert time breaks to displayable segments
  // timeBreaks is 5 days x 90 slots (7am-10pm in 10-min intervals)
  // Value 2 = hard break
  const hardBreakSegments = React.useMemo(() => {
    if (!timeBreaks || timeBreaks.length !== 5) return [];

    const segments: { day: number; startSlot: number; endSlot: number }[] = [];

    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      const daySlots = timeBreaks[dayIndex];
      if (!daySlots || daySlots.length !== 90) continue;

      let segmentStart: number | null = null;

      for (let slot = 0; slot < 90; slot++) {
        if (daySlots[slot] === 2) {
          // Hard break
          if (segmentStart === null) {
            segmentStart = slot;
          }
        } else {
          // Not a hard break
          if (segmentStart !== null) {
            segments.push({
              day: dayIndex,
              startSlot: segmentStart,
              endSlot: slot,
            });
            segmentStart = null;
          }
        }
      }

      // Close any open segment at end of day
      if (segmentStart !== null) {
        segments.push({
          day: dayIndex,
          startSlot: segmentStart,
          endSlot: 90,
        });
      }
    }

    return segments;
  }, [timeBreaks]);

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 border-primary/10 overflow-hidden">
      <CardHeader className="bg-secondary/30 pb-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <Badge className="bg-primary hover:bg-primary/90 text-white">Score: {matchPercentage}</Badge>
            <Badge variant="outline" className="border-primary/20 text-primary">{creditHours} Credits</Badge>
          </div>
          <Button variant="outline" size="sm" className="h-8">Save</Button>
        </div>
        <CardTitle className="font-heading text-xl mt-2">Schedule Option {id}</CardTitle>
        <CardDescription>Optimized for your preferences</CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] divide-y lg:divide-y-0 lg:divide-x divide-border/50">
          
          {/* Weekly Calendar View */}
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-2">
                <div className="text-xs font-bold text-muted-foreground text-right pr-2 py-1">Time</div>
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-xs font-bold text-center bg-secondary/50 rounded py-1">{day.substring(0, 3)}</div>
                ))}
              </div>

              <div className="flex max-h-[700px] overflow-y-auto">
                {/* Time column */}
                <div className="w-[60px] relative min-h-[900px] flex-shrink-0">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full text-[10px] text-muted-foreground text-right pr-2"
                      style={{ top: `${(i / 16) * 100}%` }}
                    >
                      {i + 7}:00
                    </div>
                  ))}
                </div>

                {/* Schedule grid */}
                <div className="relative min-h-[900px] flex-1 border rounded-md bg-background">
                  {/* Hour markers */}
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="absolute w-full border-b border-dashed border-border/30" style={{ top: `${(i / 16) * 100}%` }} />
                  ))}

                  {/* Hard Break Blocks (rendered behind courses) */}
                  <div className="absolute inset-0 grid grid-cols-5">
                    {WEEKDAYS.map((day, dayIndex) => (
                      <div key={`breaks-${day}`} className="relative border-l border-border/30 first:border-l-0" style={{ minHeight: '900px' }}>
                        {hardBreakSegments
                          .filter(segment => segment.day === dayIndex)
                          .map((segment, segmentIndex) => {
                            // Convert slot indices to time (each slot is 10 minutes)
                            const startMinutes = segment.startSlot * 10; // Minutes from 7:00 AM
                            const endMinutes = segment.endSlot * 10;
                            const duration = endMinutes - startMinutes;
                            const totalDayMinutes = 15 * 60; // 7am to 10pm (15 hours)

                            return (
                              <div
                                key={`segment-${segmentIndex}`}
                                className="absolute left-0 right-0 bg-gray-300/40 border-l-2 border-gray-500"
                                style={{
                                  top: `${(startMinutes / totalDayMinutes) * 100}%`,
                                  height: `${(duration / totalDayMinutes) * 100}%`,
                                }}
                                title="Hard Break"
                              />
                            );
                          })}
                      </div>
                    ))}
                  </div>

                  {/* Course Blocks */}
                  <div className="absolute inset-0 grid grid-cols-5">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="relative border-l border-border/30 first:border-l-0" style={{ minHeight: '900px' }}>
                        {courses.map((course, courseIndex) => {
                          // Debug: Check if course has valid days
                          if (!course.weekdays || course.weekdays.length === 0) {
                            console.warn(`Course ${course.title} has no weekdays:`, course);
                            return null;
                          }

                          if (course.weekdays.includes(day)) {
                            const [startTime, endTime] = course.time.split("-");
                            if (!startTime || !endTime) {
                              console.warn(`Course ${course.title} has invalid time:`, course.time);
                              return null;
                            }

                            const startMinutes = timeToMinutes(startTime);
                            const duration = getDuration(course.time);
                            const totalDayMinutes = 15 * 60; // 7am to 10pm
                            const crn = course.courseData?.CRN || courseIndex;

                            // Get color index based on course code, not section index
                            const courseCode = course.courseData?.course || course.title.split(":")[0];
                            const colorIndex = courseColorMap.get(courseCode) ?? courseIndex;

                            return (
                              <div
                                key={`${crn}-${day}`}
                                className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight border-l-2 shadow-sm cursor-pointer transition-all hover:z-10 hover:shadow-md ${COLORS[colorIndex % COLORS.length]}`}
                                style={{
                                  top: `${(startMinutes / totalDayMinutes) * 100}%`,
                                  height: `${Math.max((duration / totalDayMinutes) * 100, 3)}%`,
                                }}
                                title={`${course.title} - ${course.courseData?.type || 'N/A'} ${course.courseData?.section || ''}\n${course.description}\n${course.time}\nCRN: ${crn}`}
                              >
                                <div className="font-bold truncate">{course.title.split(":")[0]}</div>
                                <div className="truncate opacity-90 text-[9px]">{course.courseData?.type || 'N/A'} {course.courseData?.section || ''}</div>
                                <div className="truncate opacity-90 text-[9px]">{course.courseData?.location || "Location TBD"}</div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course List View */}
          <div className="p-4 bg-secondary/10 max-h-[500px] overflow-y-auto">
            <h4 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Included Courses
            </h4>
            <div className="space-y-3">
              {courses.map((course, i) => (
                <div key={course.courseData?.CRN || i} className="bg-background p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col gap-1">
                      <h5 className="font-bold text-sm text-primary group-hover:underline decoration-primary/50 underline-offset-2">
                        {course.title.split(":")[0]}
                      </h5>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {course.courseData?.type || "N/A"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {course.courseData?.section || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {course.courseData?.credit || "3 hrs"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {course.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="truncate">{course.courseData?.instructors || "Instructor TBA"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{course.courseData?.location || "Location TBA"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium text-primary/80">
                      <Calendar className="w-3 h-3" />
                      <span>{course.weekdays.map(d => d.substring(0,2)).join(", ")} • {course.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span className="font-semibold">CRN:</span>
                      <span>{course.courseData?.CRN || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
