import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import StepSlider from "@/components/StepSlider";
import CourseSearch from "@/components/CourseSearch";
import { useAppStore } from "@/lib/store";
import { generateSchedules } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const { state, setGeneratedSchedules } = useAppStore();
  const { toast } = useToast();

  const handleGenerateSchedule = async () => {
    // Validate that courses are selected
    if (state.selectedCourses.length === 0) {
      toast({
        title: "No courses selected",
        description: "Please select at least one course to generate schedules",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare soft_preferences array in the correct order
      const softPreferences = [
        state.preferences.professorImportance,
        state.preferences.rmpScoreWeight,
        state.preferences.professorExcellenceWeight,
        state.preferences.difficultyImportance,
        state.preferences.professorGpaWeight,
        state.preferences.classGpaWeight,
        state.preferences.acceptableGpaWeight,
        state.preferences.minAcceptableGpa,
        state.preferences.softbreakImportance,
      ];

      const schedules = await generateSchedules({
        course_list: state.selectedCourses,
        CRN_list: state.selectedCRNs,
        hard_breaks: state.timeBreaks,
        soft_preferences: softPreferences,
      });

      setGeneratedSchedules(schedules);

      // Navigate to results page
      setLocation("/results");
    } catch (error) {
      toast({
        title: "Schedule generation failed",
        description: error instanceof Error ? error.message : "Failed to generate schedules",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            Find Your Perfect Schedule
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Adjust the sliders to filter courses based on your personal preferences, from professor ratings to class difficulty.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 mb-12">
        {/* Left-hand StepSlider */}
        <div className="flex-1 min-w-0">
          <StepSlider
            categoriesLeft={[
              {
                id: "professor",
                title: "Professor Quality",
                sliders: [
                  { id: "prof_main", label: "Overall Rating", min: 1, max: 5, initial: 3 },
                  { id: "rate_my_prof", label: "Rate My Professor Score", min: 1, max: 5, initial: 3 },
                  { id: "excellent_rating", label: "Teaching Excellence", min: 1, max: 5, initial: 3 },
                ],
              },
              {
                id: "class_difficulty",
                title: "Academic Rigor",
                sliders: [
                  { id: "class_diff", label: "Difficulty Level", min: 1, max: 5, initial: 3 },
                  { id: "prof_avg_gpa", label: "Professor Avg GPA Weight", min: 1, max: 5, initial: 3 },
                  { id: "class_avg_gpa", label: "Class Avg GPA Weight", min: 1, max: 5, initial: 3 },
                  { id: "min_grade", label: "Min Acceptable GPA Weight", min: 1, max: 5, initial: 3 },
                  {
                    id: "grade_dropdown",
                    label: "Target Grade",
                    type: "dropdown",
                    options: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
                  },
                ],
              },
            ]}
            categoriesRight={[
              {
                id: "logistics",
                title: "Logistics & Timing",
                sliders: [
                  { id: "passing_period_main", label: "Walking Distance (min)", min: 5, max: 20, initial: 10 },
                  { id: "late_tolerance", label: "Lateness Tolerance (min)", min: 0, max: 30, initial: 5 },
                ],
              },
              {
                id: "location",
                title: "Campus Location",
                sliders: [
                  {
                    id: "preferred_area",
                    label: "Preferred Zone",
                    type: "dropdown",
                    options: ["North Campus", "South Campus", "Science Quad", "Arts Block", "Engineering Center"],
                  },
                  { id: "num_blocks", label: "Maximum Block Distance", min: 1, max: 10, initial: 3 },
                ],
              },
            ]}
          />
        </div>

        {/* Right-hand Course Search */}
        <div className="xl:w-[400px] shrink-0 h-[800px] sticky top-24">
          <CourseSearch />
        </div>
      </div>

      <div className="flex justify-center pb-12">
        <Button
          size="lg"
          className="w-full max-w-2xl text-xl h-16 font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-xl"
          onClick={handleGenerateSchedule}
          disabled={isGenerating || state.selectedCourses.length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Generating Schedules...
            </>
          ) : (
            <>
              Generate Schedule <ArrowRight className="ml-3 h-6 w-6" />
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
