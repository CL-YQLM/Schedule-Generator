import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Time Slot Selector Component
// Adapted from the provided HTML/JS implementation for React

const ROWS = 90; // 7:00 AM - 10:00 PM (10-minute intervals)
const COLS = 5; // M, T, W, R, F
const START_HOUR = 7;
const END_HOUR = 22;
const INTERVAL_MINUTES = 10;
const DAYS = ['M', 'T', 'W', 'R', 'F'];

const STATES = {
  EMPTY: 0,
  SOFT_PREFERENCE: 1,
  HARD_PREFERENCE: 2
};

interface TimeSlotSelectorProps {
  onChange?: (data: number[][]) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ onChange }) => {
  const [grid, setGrid] = useState<number[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(STATES.EMPTY))
  );
  const [currentMode, setCurrentMode] = useState<number>(STATES.SOFT_PREFERENCE);
  const [isDrawing, setIsDrawing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate time labels
  const timeLabels = React.useMemo(() => {
    const labels = [];
    const totalMinutes = (END_HOUR - START_HOUR) * 60;
    const numSlots = totalMinutes / INTERVAL_MINUTES;

    for (let i = 0; i < numSlots; i++) {
      const totalMins = START_HOUR * 60 + i * INTERVAL_MINUTES;
      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;
      const isHourMark = minutes === 0;

      labels.push({
        time: `${hours}:${minutes.toString().padStart(2, '0')}`,
        isHourMark: isHourMark
      });
    }
    return labels;
  }, []);

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    updateCell(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDrawing) {
      updateCell(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (onChange) {
      // Transpose for output format (5 rows x 90 cols)
      const transposed = Array(COLS).fill(null).map((_, colIndex) => 
        grid.map(row => row[colIndex])
      );
      onChange(transposed);
    }
  };

  const updateCell = (row: number, col: number) => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid.map(r => [...r])];
      newGrid[row][col] = currentMode;
      return newGrid;
    });
  };

  const clearAll = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(STATES.EMPTY)));
    if (onChange) {
      const emptyData = Array(COLS).fill(Array(ROWS).fill(STATES.EMPTY));
      onChange(emptyData);
    }
  };

  // Handle global mouse up to stop drawing if mouse leaves grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        if (onChange) {
          const transposed = Array(COLS).fill(null).map((_, colIndex) => 
            grid.map(row => row[colIndex])
          );
          onChange(transposed);
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, grid, onChange]);

  return (
    <div className="w-full select-none">
      <div className="flex flex-col gap-4">
        
        {/* Controls & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-secondary/20 rounded-lg border border-primary/10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-muted-foreground">Mode:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={currentMode === STATES.SOFT_PREFERENCE ? "default" : "outline"}
                className={cn(
                  "gap-2 transition-all",
                  currentMode === STATES.SOFT_PREFERENCE ? "bg-amber-400 hover:bg-amber-500 text-black border-amber-500" : "text-muted-foreground"
                )}
                onClick={() => setCurrentMode(STATES.SOFT_PREFERENCE)}
              >
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-black/10" />
                Soft Break
              </Button>
              <Button 
                size="sm" 
                variant={currentMode === STATES.HARD_PREFERENCE ? "default" : "outline"}
                className={cn(
                  "gap-2 transition-all",
                  currentMode === STATES.HARD_PREFERENCE ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600" : "text-muted-foreground"
                )}
                onClick={() => setCurrentMode(STATES.HARD_PREFERENCE)}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white/20" />
                Hard Break
              </Button>
              <Button 
                size="sm" 
                variant={currentMode === STATES.EMPTY ? "secondary" : "ghost"}
                className="gap-2"
                onClick={() => setCurrentMode(STATES.EMPTY)}
              >
                <div className="w-3 h-3 rounded-full bg-background border border-border" />
                Eraser
              </Button>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAll}
            className="h-8"
          >
            Clear All
          </Button>
        </div>

        {/* Grid */}
        <div className="border rounded-md bg-background shadow-inner max-h-[500px] overflow-y-scroll overflow-x-auto relative">
          <div className="grid grid-cols-[60px_repeat(5,1fr)] min-w-[500px]">

            {/* Header */}
            <div className="sticky top-0 z-20 bg-muted border-b flex items-center justify-center h-8 text-xs font-bold text-muted-foreground">
              Time
            </div>
            {DAYS.map((day) => (
              <div key={day} className="sticky top-0 z-20 bg-primary text-primary-foreground border-b border-l border-primary-foreground/20 flex items-center justify-center h-8 text-sm font-bold">
                {day}
              </div>
            ))}

            {/* Rows */}
            {timeLabels.map((label, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {/* Time Label */}
                <div className={cn(
                  "sticky left-0 z-10 bg-background border-b border-border/50 flex items-center justify-center h-6 text-[10px] text-muted-foreground border-r",
                  label.isHourMark && "font-bold text-primary bg-secondary/30"
                )}>
                  {label.time}
                </div>

                {/* Cells */}
                {Array(COLS).fill(null).map((_, colIndex) => {
                  const cellState = grid[rowIndex][colIndex];
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={cn(
                        "h-6 border-b border-r border-border/30 cursor-pointer transition-colors",
                        cellState === STATES.SOFT_PREFERENCE && "bg-amber-400/80 hover:bg-amber-400",
                        cellState === STATES.HARD_PREFERENCE && "bg-emerald-500/80 hover:bg-emerald-500",
                        cellState === STATES.EMPTY && "hover:bg-muted/50"
                      )}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSelector;
