import React, { useState } from 'react';
import { useAtelier } from '../../store/AtelierContext';
import { 
  getActiveAppointment, 
  getTodayAppointments 
} from '../../utils/appointmentUtils';
import { Appointment } from '../../types';

// Child components
import { ActiveSessionCard } from './ActiveSessionCard';
import { TodayTimeline } from './TodayTimeline';
import { VisualDayCalendarView } from './VisualDayCalendarView';
import { WalkInModal } from './WalkInModal';
import { QuickBookingModal } from './QuickBookingModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';

import { Calendar, LayoutGrid, ListFilter, RefreshCw, Sparkles, Globe, Clock, Scissors, User, Phone, CheckCircle2, ChevronLeft } from 'lucide-react';
import { toPersianDigits, getCurrentSolarDateInfo } from '../../utils/dateUtils';
import { useLiveClock } from '../../hooks/useLiveClock';

interface TodayViewProps {
  onOpenDossier: (customerId?: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ onOpenDossier }) => {
  const { 
    appointments, 
    activeChair,
    startAppointment, 
    completeAppointment,
    setSelectedClientForDossier,
    customers,
    refreshDatabaseData,
    isRefreshing
  } = useAtelier();

  const liveClock = useLiveClock(1000);
  const currentDay = liveClock.dayNumber;
  const todayInfo = getCurrentSolarDateInfo();

  // Mode and Modals state
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [quickBookingTime, setQuickBookingTime] = useState('15:30');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ startTime: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Derive today's schedule dynamically from real-time today
  const todayAppointments = getTodayAppointments(appointments, currentDay);
  const activeAppointment = getActiveAppointment(appointments, currentDay);

  const handleStartAppointment = (aptId: string) => {
    startAppointment(aptId);
  };

  const handleCompleteAppointment = (aptId: string) => {
    completeAppointment(aptId);
  };

  const handleOpenClientDossier = (customerId?: string) => {
    if (customerId) {
      const client = customers.find((c) => c.id === customerId);
      if (client) {
        setSelectedClientForDossier(client);
      }
    }
    onOpenDossier(customerId);
  };

  const handleEmptySlotClick = (slotStartTime: string) => {
    setQuickBookingTime(slotStartTime);
    setShowQuickBooking(true);
  };

  return (
    <div className="space-y-4 w-full" dir="rtl">
      {/* 1. Active Session Card (Hero Top) */}
      <ActiveSessionCard
        activeAppointment={activeAppointment}
        onCompleteAppointment={handleCompleteAppointment}
        onOpenCustomerDossier={handleOpenClientDossier}
        onQuickWalkIn={() => setIsWalkInOpen(true)}
      />

      {/* 2. Today's Continuous Schedule */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-900/10 text-stone-800 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              برنامه زمانی و نوبت‌های امروز
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* 5-Min Sync Button */}
            <button
              type="button"
              onClick={() => refreshDatabaseData()}
              disabled={isRefreshing}
              className={`p-1 px-2 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-2xs ${
                isRefreshing
                  ? 'bg-purple-50 text-[#4e3b6e] border-purple-200 animate-pulse'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200/80'
              }`}
              title="همگام‌سازی خودکار هر ۵ دقیقه. کلیک برای به‌روزرسانی فوری"
            >
              <RefreshCw className={`w-3 h-3 text-[#4e3b6e] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'همگام‌سازی...' : 'به‌روزرسانی'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-200/70 p-0.5 rounded-xl border border-stone-300/40">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`p-1 px-2 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="نمای لیست"
              >
                <ListFilter className="w-3 h-3" />
                <span>لیست</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1 px-2 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="تقویم بصری گوگل"
              >
                <LayoutGrid className="w-3 h-3 text-[#4e3b6e]" />
                <span>تقویم بصری</span>
              </button>
            </div>

            <span className="text-xs text-stone-600 font-mono font-bold bg-white/70 px-2.5 py-0.5 rounded-full border border-stone-200/60 shadow-2xs">
              {toPersianDigits(todayAppointments.length)} نوبت
            </span>
          </div>
        </div>

        {viewMode === 'timeline' ? (
          <TodayTimeline
            appointments={todayAppointments}
            onSelectAppointment={(apt) => setSelectedAppointment(apt)}
            onStartAppointment={handleStartAppointment}
            onCompleteAppointment={handleCompleteAppointment}
          />
        ) : (
          <VisualDayCalendarView
            dayNumber={currentDay}
            dateString={todayInfo.dateString}
            appointments={todayAppointments}
            activeChair={activeChair}
            onSelectAppointment={(apt) => setSelectedAppointment(apt)}
          />
        )}
      </div>

      {/* 3. All Studio Bookings (Server-Authoritative Source of Truth) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-900/10 text-emerald-800 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                تمام نوبت‌های استودیو در سرور
              </h3>
              <p className="text-[10px] text-stone-500 font-mono">
                رزروهای سراسر سالن (پایگاه داده Firestore)
              </p>
            </div>
          </div>
          <span className="text-xs text-stone-700 font-mono font-bold bg-white/70 px-2.5 py-0.5 rounded-full border border-stone-200/60 shadow-2xs">
            {toPersianDigits(appointments.length)} رزرو ثبت‌شده
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="clay-card rounded-2xl p-6 text-center border border-white/60 bg-white/40 backdrop-blur-md">
            <Clock className="w-6 h-6 text-stone-400 mx-auto mb-1.5 opacity-70" />
            <p className="text-xs font-bold text-stone-700">هیچ رزروی در سرور ثبت نشده است.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 10).map((apt) => {
              const isToday = apt.dayNumber === currentDay;
              const isOnline = apt.bookingSource === 'online';

              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className="rounded-2xl p-3 bg-white/70 hover:bg-white/95 border border-white/80 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                      isOnline ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {isOnline ? <Globe className="w-4 h-4 text-amber-700" /> : <Scissors className="w-4 h-4 text-stone-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {apt.customerName || 'مشتری'}
                        </span>
                        {isToday && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                            امروز
                          </span>
                        )}
                        {isOnline && (
                          <span className="text-[8px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">
                            آنلاین
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">
                        {apt.service?.name || 'پیرایش'} · {apt.date || `روز ${toPersianDigits(apt.dayNumber)}`} ساعت {toPersianDigits(apt.startTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {apt.customerPhone && (
                      <span className="text-[10px] text-stone-600 font-mono hidden xs:inline" dir="ltr">
                        {apt.customerPhone}
                      </span>
                    )}
                    <ChevronLeft className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals Styled to Match Customer Panel Glass/Slide-up */}
      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => {
          setIsWalkInOpen(false);
          setSelectedSlotForBooking(null);
        }}
        initialStartTime={selectedSlotForBooking?.startTime}
      />

      <QuickBookingModal
        isOpen={showQuickBooking}
        onClose={() => setShowQuickBooking(false)}
        initialStartTime={quickBookingTime}
        initialDayNumber={currentDay}
        initialDate={todayInfo.dateString}
      />

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onOpenDossier={handleOpenClientDossier}
      />
    </div>
  );
};

