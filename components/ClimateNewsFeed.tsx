'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subDays, isSameDay } from 'date-fns'
import ClimatePapers from '@/components/ClimatePapers'
import { Button } from '@/components/ui/button'

export default function ClimateNewsFeed() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const last5Days = Array.from({ length: 5 }, (_, i) => subDays(new Date(), i))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800'>
      <div className='container mx-auto p-4'>
        <h1 className='text-4xl font-bold mb-6 text-green-800 dark:text-green-100 text-center py-4'>
          Daily Climate Research
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-2'>
            <ClimatePapers selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  )
}
