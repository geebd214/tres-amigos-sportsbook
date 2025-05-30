import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useEffect } from "react";

export default function CalendarSidebar({ selectedDate, setSelectedDate }) {
  useEffect(() => {
    const calendarEl = document.querySelector(".react-calendar");
    if (calendarEl) {
      calendarEl.classList.add("bg-gray-700", "text-white", "rounded", "p-2", "border-none");
    }
  }, []);

  return (
    <div className="text-white">
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileClassName={() => "hover:bg-gray-600"}
      />
    </div>
  );
}
