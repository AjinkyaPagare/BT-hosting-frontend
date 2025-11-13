import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

const mockEvents = [
  {
    id: "1",
    title: "Team Meeting",
    date: new Date(),
    time: "10:00 AM",
    participants: 5,
  },
  {
    id: "2",
    title: "Project Review",
    date: new Date(Date.now() + 86400000),
    time: "2:00 PM",
    participants: 8,
  },
];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const selectedDateEvents = mockEvents.filter((event) =>
    isSameDay(event.date, selectedDate)
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-background">
      {/* Calendar */}
      <div className="flex-1 p-6 border-r border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {daysInMonth.map((day) => {
            const hasEvents = mockEvents.some((event) => isSameDay(event.date, day));
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square p-2 rounded-lg text-sm font-medium transition-colors relative",
                  !isSameMonth(day, currentDate) && "text-muted-foreground opacity-50",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && "hover:bg-accent",
                  isCurrentDay && !isSelected && "border-2 border-primary"
                )}
              >
                {format(day, "d")}
                {hasEvents && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Sidebar */}
      <div className="w-full md:w-96 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg bg-background border border-border hover:border-primary transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold mb-1">{event.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{event.time}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.participants} participants
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
