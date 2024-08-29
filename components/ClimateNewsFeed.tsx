'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Twitter, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format, subDays, isSameDay } from 'date-fns'

// Mock data for demonstration
const mockPosts = [
  {
    id: 1,
    user: 'ClimateExpert',
    userIcon: '/placeholder.svg?height=40&width=40',
    content:
      'New study shows significant increase in global temperatures over the past decade.',
    source: 'twitter',
    link: 'https://twitter.com/ClimateExpert/status/1234567890',
    date: new Date()
  },
  {
    id: 2,
    user: 'EcoWarrior',
    userIcon: '/placeholder.svg?height=40&width=40',
    content: '5 simple ways you can reduce your carbon footprint today!',
    source: 'reddit',
    link: 'https://reddit.com/r/climateaction/comments/abcdef',
    date: subDays(new Date(), 1)
  },
  {
    id: 3,
    user: 'GreenTech',
    userIcon: '/placeholder.svg?height=40&width=40',
    content:
      'Breakthrough in solar panel efficiency could revolutionize renewable energy.',
    source: 'twitter',
    link: 'https://twitter.com/GreenTech/status/2345678901',
    date: subDays(new Date(), 2)
  },
  {
    id: 4,
    user: 'OceanAdvocate',
    userIcon: '/placeholder.svg?height=40&width=40',
    content:
      'Alarming new data on ocean acidification and its impact on marine ecosystems.',
    source: 'reddit',
    link: 'https://reddit.com/r/marinebiology/comments/ghijkl',
    date: subDays(new Date(), 3)
  },
  {
    id: 5,
    user: 'SustainableLiving',
    userIcon: '/placeholder.svg?height=40&width=40',
    content:
      'Urban farming initiatives are transforming food deserts in major cities.',
    source: 'twitter',
    link: 'https://twitter.com/SustainableLiving/status/3456789012',
    date: subDays(new Date(), 4)
  }
]

const RedditIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    className='h-4 w-4 text-orange-600'
    fill='currentColor'
  >
    <path d='M10 0C4.478 0 0 4.478 0 10c0 5.523 4.478 10 10 10 5.523 0 10-4.477 10-10 0-5.522-4.477-10-10-10zm5.266 11.86c-.043.043-.107.063-.168.063-.064 0-.127-.02-.17-.063-.085-.085-.085-.224 0-.31.51-.51.79-1.19.79-1.91 0-1.48-1.2-2.68-2.68-2.68-.72 0-1.4.28-1.91.79-.086.085-.224.085-.31 0-.085-.086-.085-.224 0-.31.6-.6 1.4-.93 2.25-.93 1.74 0 3.16 1.42 3.16 3.16 0 .85-.33 1.65-.93 2.25zm-9.42-1.84c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2-.66 0-1.2-.54-1.2-1.2zm6.31 3.84c-.74.74-1.72 1.15-2.77 1.15s-2.03-.41-2.77-1.15c-.085-.085-.085-.224 0-.31.085-.085.224-.085.31 0 .62.62 1.45.97 2.33.97.88 0 1.71-.35 2.33-.97.085-.085.224-.085.31 0 .085.086.085.224 0 .31zm-.31-2.64c-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2z' />
  </svg>
)

export default function ClimateNewsFeed() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const last5Days = Array.from({ length: 5 }, (_, i) => subDays(new Date(), i))

  const filteredPosts = mockPosts.filter(
    (post) => post.date.toDateString() === selectedDate.toDateString()
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800'>
      <div className='container mx-auto p-4'>
        <h1 className='text-4xl font-bold mb-6 text-green-800 dark:text-green-100 text-center py-4'>
          Daily Climate News
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='md:col-span-2'>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className='mb-4 bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'
                >
                  <CardHeader className='flex flex-row items-center gap-4'>
                    <Avatar>
                      <AvatarImage src={post.userIcon} alt={post.user} />
                      <AvatarFallback className='bg-green-200 text-green-800'>
                        {post.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                      <div className='flex items-center gap-2'>
                        <h2 className='text-lg font-semibold text-green-800 dark:text-green-100'>
                          {post.user}
                        </h2>
                        {post.source === 'twitter' ? (
                          <Twitter className='h-4 w-4 text-blue-400' />
                        ) : (
                          <RedditIcon />
                        )}
                      </div>
                      <p className='text-sm text-green-600 dark:text-green-300'>
                        {format(post.date, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className='text-green-700 dark:text-green-200'>
                      {post.content}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={post.link}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Button
                        variant='outline'
                        className='text-green-700 dark:text-green-200 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-700'
                      >
                        View on {post.source === 'twitter' ? 'X' : 'Reddit'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className='bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'>
                <CardContent className='p-6'>
                  <p className='text-center text-green-700 dark:text-green-200'>
                    No posts for the selected date.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <div>
            <Card className='mb-4 bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'>
              <CardHeader>
                <h2 className='text-xl font-semibold text-green-800 dark:text-green-100'>
                  Recent Days
                </h2>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2'>
                  {last5Days.map((date) => (
                    <Button
                      key={date.toISOString()}
                      variant={
                        isSameDay(date, selectedDate) ? 'default' : 'outline'
                      }
                      onClick={() => setSelectedDate(date)}
                      className={
                        isSameDay(date, selectedDate)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'text-green-700 border-green-300 hover:bg-green-100 dark:text-green-200 dark:border-green-600 dark:hover:bg-green-700'
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
                  onSelect={setSelectedDate}
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
                    IconLeft: ({ ...props }) => (
                      <ChevronLeft className='h-4 w-4 text-green-800 dark:text-green-100' />
                    ),
                    IconRight: ({ ...props }) => (
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
