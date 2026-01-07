import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimeSlotSelector from "@/components/TimeSlotSelector";
import { useAppStore } from "@/lib/store";

interface SliderConfig {
  id: string;
  label: string;
  min?: number;
  max?: number;
  initial?: number;
  type?: "slider" | "dropdown";
  options?: string[];
}

interface Category {
  id: string;
  title: string;
  sliders: SliderConfig[];
}

interface StepSliderProps {
  categoriesLeft: Category[];
  categoriesRight: Category[];
}

// Map slider IDs to store preference keys
const sliderToStoreMap: Record<string, string> = {
  'prof_main': 'professorImportance',
  'rate_my_prof': 'rmpScoreWeight',
  'excellent_rating': 'professorExcellenceWeight',
  'class_diff': 'difficultyImportance',
  'prof_avg_gpa': 'professorGpaWeight',
  'class_avg_gpa': 'classGpaWeight',
  'min_grade': 'acceptableGpaWeight',
  'grade_dropdown': 'minAcceptableGpa',
  'passing_period_main': 'walkingDistance',
  'late_tolerance': 'latenessTolerance',
  'preferred_area': 'preferredArea',
  'num_blocks': 'maxBlockDistance',
};

const StepSlider: React.FC<StepSliderProps> = ({ categoriesLeft, categoriesRight }) => {
  const { updatePreference, setTimeBreaks } = useAppStore();

  // State to track values for all inputs (sliders and dropdowns)
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const initialValues: Record<string, string | number> = {};
    const allCategories = [...categoriesLeft, ...categoriesRight];

    allCategories.forEach(cat => {
      cat.sliders.forEach(slider => {
        if (slider.type === "dropdown" && slider.options && slider.options.length > 0) {
          // Default to first option for dropdowns if no initial value
          initialValues[slider.id] = slider.options[0];
        } else {
          initialValues[slider.id] = slider.initial || 0;
        }
      });
    });

    return initialValues;
  });

  const handleValueChange = (id: string, value: string | number) => {
    setValues(prev => ({
      ...prev,
      [id]: value
    }));

    // Sync with store
    const storeKey = sliderToStoreMap[id];
    if (storeKey) {
      updatePreference(storeKey as any, value as any);
    }
  };

  const handleTimeBreaksChange = (breaks: number[][]) => {
    setTimeBreaks(breaks);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {categoriesLeft.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              values={values} 
              onValueChange={handleValueChange} 
            />
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {categoriesRight.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              values={values}
              onValueChange={handleValueChange}
              onTimeBreaksChange={handleTimeBreaksChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
  values: Record<string, string | number>;
  onValueChange: (id: string, value: string | number) => void;
  onTimeBreaksChange?: (breaks: number[][]) => void;
}

const CategoryCard = ({ category, values, onValueChange, onTimeBreaksChange }: CategoryCardProps) => {
  if (category.sliders.length === 0) return null;

  // Extract the first slider as the "Main" slider for this category
  const mainSlider = category.sliders[0];
  const subSliders = category.sliders.slice(1);

  // Check if this is the "Logistics & Timing" category to add the TimeSlotSelector
  const isLogisticsCategory = category.id === "logistics";

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4 bg-secondary/20">
        <CardTitle className="text-3xl font-heading text-primary">{category.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-8">
        {/* Main Emphasized Slider */}
        <div className="space-y-5 pb-2">
          <div className="flex justify-between items-end">
            <Label htmlFor={mainSlider.id} className="text-xl font-bold text-primary/90">
              {mainSlider.label}
            </Label>
            {mainSlider.type !== "dropdown" && (
              <span className="text-lg font-bold font-mono text-primary">
                {values[mainSlider.id]}
              </span>
            )}
          </div>

          {mainSlider.type === "dropdown" ? (
             <Select 
               value={values[mainSlider.id] as string} 
               onValueChange={(val) => onValueChange(mainSlider.id, val)}
             >
                <SelectTrigger id={mainSlider.id} className="w-full h-14 text-lg border-primary/20 bg-background/50 shadow-sm">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {mainSlider.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          ) : (
            <div className="px-1 py-2">
              <Slider
                id={mainSlider.id}
                value={[values[mainSlider.id] as number]}
                onValueChange={(vals) => onValueChange(mainSlider.id, vals[0])}
                max={mainSlider.max || 10}
                min={mainSlider.min || 0}
                step={1}
                className="w-full [&>span:first-child]:h-4 [&>span:first-child]:bg-blue-100 dark:[&>span:first-child]:bg-blue-900/30 [&>span:first-child_span]:bg-blue-600 [&_span[role=slider]]:h-8 [&_span[role=slider]]:w-8 [&_span[role=slider]]:border-blue-600 [&_span[role=slider]]:bg-white [&_span[role=slider]]:border-4 [&_span[role=slider]]:shadow-lg [&_span[role=slider]]:rounded-sm hover:[&_span[role=slider]]:scale-110 transition-all"
              />
            </div>
          )}
        </div>

        {/* Sub Sliders */}
        {subSliders.length > 0 && (
          <div className="space-y-8 pt-6 border-t border-dashed border-primary/10">
            {subSliders.map((slider) => (
              <div key={slider.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor={slider.id} className="text-base font-medium text-muted-foreground">
                    {slider.label}
                  </Label>
                  {slider.type !== "dropdown" && (
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {values[slider.id]}
                    </span>
                  )}
                </div>

                {slider.type === "dropdown" ? (
                  <Select
                    value={values[slider.id] as string}
                    onValueChange={(val) => onValueChange(slider.id, val)}
                  >
                    <SelectTrigger id={slider.id} className="w-full h-8 text-sm">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {slider.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Slider
                    id={slider.id}
                    value={[values[slider.id] as number]}
                    onValueChange={(vals) => onValueChange(slider.id, vals[0])}
                    max={slider.max || 10}
                    min={slider.min || 0}
                    step={1}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Time Slot Selector Integration */}
        {isLogisticsCategory && (
          <div className="pt-8 border-t-2 border-primary/10 mt-8">
            <div className="mb-4">
              <Label className="text-xl font-bold text-primary/90">Break Preferences</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Visually select your preferred break times.
              </p>
            </div>
            <TimeSlotSelector onChange={onTimeBreaksChange} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StepSlider;
