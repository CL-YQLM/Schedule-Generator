import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { searchCourses, Course } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CourseSearch = () => {
  const [department, setDepartment] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { state, addCourse, removeCourse } = useAppStore();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!department.trim()) {
      toast({
        title: "Error",
        description: "Please enter a department code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchCourses(department);
      setCourses(results);
      if (results.length === 0) {
        toast({
          title: "No courses found",
          description: `No courses found for department ${department.toUpperCase()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search courses",
        variant: "destructive",
      });
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourse = (course: Course) => {
    const courseCode = `${department.toUpperCase()} ${course.number}`;
    if (state.selectedCourses.includes(courseCode)) {
      removeCourse(courseCode);
    } else {
      addCourse(courseCode);
    }
  };

  const isCourseSelected = (course: Course) => {
    const courseCode = `${department.toUpperCase()} ${course.number}`;
    return state.selectedCourses.includes(courseCode);
  };

  return (
    <Card className="h-full border-none shadow-lg bg-primary/5 overflow-hidden flex flex-col">
      <CardHeader className="bg-primary/10 border-b border-primary/10 pb-6">
        <CardTitle className="font-heading text-2xl text-primary mb-4">Course Search</CardTitle>
        <div className="space-y-2">
          <Label htmlFor="course-code" className="text-xs font-medium text-muted-foreground">Department Code</Label>
          <Input
            id="course-code"
            placeholder="e.g. CS, MATH, ECE"
            className="bg-background/80 border-primary/20 focus-visible:ring-primary uppercase"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value.toUpperCase());
              setCourses([]); // Clear results when changing department
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          className="w-full mt-4 shadow-sm"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>

        {state.selectedCourses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Selected Courses ({state.selectedCourses.length})
            </Label>
            <div className="flex flex-wrap gap-1">
              {state.selectedCourses.map((course) => (
                <Badge
                  key={course}
                  variant="default"
                  className="text-xs pr-1 gap-1 cursor-pointer hover:bg-primary/80 transition-colors"
                >
                  <span>{course}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCourse(course);
                    }}
                    className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${course}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {courses.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div>
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Search for courses by department code
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {courses.map((course) => {
              const selected = isCourseSelected(course);
              return (
                <div
                  key={`${course.number}`}
                  className="p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                  onClick={() => handleAddCourse(course)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors flex-1">
                      {department.toUpperCase()} {course.number}: {course.name}
                    </h4>
                    <Button
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      className="ml-2 h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddCourse(course);
                      }}
                    >
                      {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseSearch;
