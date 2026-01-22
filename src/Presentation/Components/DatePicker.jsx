import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePicker() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years'
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const dropdownRef = useRef(null);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDayClick = (day) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);
        setIsOpen(false);
    };

    const handleMonthClick = (monthIndex) => {
        setCurrentMonth(monthIndex);
        setViewMode('days');
    };

    const handleYearClick = (year) => {
        setCurrentYear(year);
        setViewMode('months');
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // Empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

            days.push(
                <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-8 w-8 rounded-lg text-sm transition-colors ${isSelected
                            ? 'bg-[#44B16F] text-white font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    const renderMonths = () => {
        return months.map((month, index) => (
            <button
                key={month}
                onClick={() => handleMonthClick(index)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${currentMonth === index
                        ? 'bg-[#44B16F] text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
            >
                {month.substr(0, 3)}
            </button>
        ));
    };

    const renderYears = () => {
        const years = [];
        const startYear = Math.floor(currentYear / 10) * 10;

        for (let i = startYear; i < startYear + 12; i++) {
            years.push(
                <button
                    key={i}
                    onClick={() => handleYearClick(i)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${currentYear === i
                            ? 'bg-[#44B16F] text-white font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return years;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Calendar size={20} className="text-gray-600" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[320px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => {
                                if (viewMode === 'days') handlePrevMonth();
                                else if (viewMode === 'months') setCurrentYear(currentYear - 1);
                                else if (viewMode === 'years') setCurrentYear(currentYear - 10);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>

                        <button
                            onClick={() => {
                                if (viewMode === 'days') setViewMode('months');
                                else if (viewMode === 'months') setViewMode('years');
                            }}
                            className="font-semibold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded transition-colors"
                        >
                            {viewMode === 'days' && `${months[currentMonth]} ${currentYear}`}
                            {viewMode === 'months' && currentYear}
                            {viewMode === 'years' && `${Math.floor(currentYear / 10) * 10} - ${Math.floor(currentYear / 10) * 10 + 11}`}
                        </button>

                        <button
                            onClick={() => {
                                if (viewMode === 'days') handleNextMonth();
                                else if (viewMode === 'months') setCurrentYear(currentYear + 1);
                                else if (viewMode === 'years') setCurrentYear(currentYear + 10);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <ChevronRight size={20} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Calendar Content */}
                    {viewMode === 'days' && (
                        <>
                            {/* Days of week */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {/* Days */}
                            <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
                        </>
                    )}

                    {viewMode === 'months' && (
                        <div className="grid grid-cols-3 gap-2">{renderMonths()}</div>
                    )}

                    {viewMode === 'years' && (
                        <div className="grid grid-cols-3 gap-2">{renderYears()}</div>
                    )}

                    {/* Today button */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <button
                            onClick={() => {
                                const today = new Date();
                                setSelectedDate(today);
                                setCurrentYear(today.getFullYear());
                                setCurrentMonth(today.getMonth());
                                setViewMode('days');
                                setIsOpen(false);
                            }}
                            className="w-full py-2 text-sm text-[#44B16F] hover:bg-[#44B16F]/5 rounded-lg transition-colors font-medium"
                        >
                            Hoje
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
