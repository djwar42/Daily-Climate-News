// components/ClimateNewsFeed.tsx
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

  const last4Days = Array.from({ length: 6 }, (_, i) => subDays(new Date(), i))

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800'>
      <div className='container mx-auto p-4'>
        <h1 className='text-4xl font-bold mb-1 text-green-800 dark:text-green-100 text-center py-4'>
          Daily Climate News
        </h1>
        <h3 className='text-m font-bold mb-8 text-green-800 dark:text-green-100 text-center pb-4'>
          Latest Papers From arXiv
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='md:col-span-3 order-2 md:order-1'>
            <ClimatePapers selectedDate={selectedDate} />
          </div>
          <div className='order-1 md:order-2'>
            <Card className='mb-4 bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'>
              <CardHeader>
                <h2 className='text-xl font-semibold text-green-800 dark:text-green-100'>
                  Recent Days
                </h2>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2'>
                  {last4Days.map((date) => (
                    <Button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={
                        isSameDay(date, selectedDate)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-300 dark:text-green-200 dark:border-green-600 dark:hover:bg-green-700'
                      }
                    >
                      {format(date, 'MMM d')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className='bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'>
              <CardHeader>
                <h2 className='text-xl font-semibold text-green-800 dark:text-green-100'>
                  Calendar
                </h2>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className='rounded-md border border-green-200 dark:border-green-700'
                  classNames={{
                    months:
                      'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                    month: 'space-y-4',
                    caption: 'flex justify-center pt-1 relative items-center',
                    caption_label:
                      'text-sm font-medium text-green-800 dark:text-green-100',
                    nav: 'space-x-1 flex items-center',
                    nav_button:
                      'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell:
                      'text-green-800 dark:text-green-100 rounded-md w-8 font-normal text-[0.8rem]',
                    row: 'flex w-full mt-2',
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-green-100 dark:[&:has([aria-selected])]:bg-green-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
                    day_selected:
                      'bg-green-600 text-white hover:bg-green-700 focus:bg-green-700 focus:text-white',
                    day_today:
                      'bg-green-100 text-green-900 dark:bg-green-800 dark:text-green-100',
                    day_outside:
                      'text-green-500 dark:text-green-400 opacity-50',
                    day_disabled:
                      'text-green-400 dark:text-green-500 opacity-50',
                    day_range_middle:
                      'aria-selected:bg-green-100 aria-selected:text-green-900 dark:aria-selected:bg-green-800 dark:aria-selected:text-green-50',
                    day_hidden: 'invisible'
                  }}
                  components={{
                    IconLeft: () => (
                      <ChevronLeft className='h-4 w-4 text-green-800 dark:text-green-100' />
                    ),
                    IconRight: () => (
                      <ChevronRight className='h-4 w-4 text-green-800 dark:text-green-100' />
                    )
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
