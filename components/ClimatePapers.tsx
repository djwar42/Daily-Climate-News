import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { format, subMonths, isBefore } from 'date-fns'

interface Paper {
  id: string
  title: string
  authors: string[]
  published: string
  summary: string
  link: string
  categories: string[]
}

interface ApiResponse {
  entries: Paper[]
  totalResults: number | null
  startIndex: number | null
  itemsPerPage: number | null
}

const LATEST_AVAILABLE_DATE = new Date('2023-08-19')

export default function ClimatePapers({
  selectedDate
}: {
  selectedDate: Date
}) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true)
        const queryDate = isBefore(selectedDate, LATEST_AVAILABLE_DATE)
          ? selectedDate
          : LATEST_AVAILABLE_DATE
        const startDate = format(subMonths(queryDate, 1), 'yyyy-MM-dd')
        const endDate = format(queryDate, 'yyyy-MM-dd')
        console.log('Fetching papers for date range:', startDate, 'to', endDate)
        const response = await fetch(
          `/api/fetchPapers?query=climate change&startDate=${startDate}&endDate=${endDate}&categories=physics.ao-ph,physics.geo-ph,eess.SP,q-bio.PE`
        )
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data: ApiResponse = await response.json()
        if (Array.isArray(data.entries)) {
          setPapers(data.entries)
        } else {
          console.error('Entries is not an array:', data.entries)
          setPapers([])
        }
      } catch (err) {
        setError('Failed to fetch papers')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPapers()
  }, [selectedDate])

  if (loading) return <div>Loading...</div>
  if (error) return <div className='text-red-500'>{error}</div>

  const displayDate = isBefore(selectedDate, LATEST_AVAILABLE_DATE)
    ? selectedDate
    : LATEST_AVAILABLE_DATE

  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>
        Climate Papers since {format(subMonths(displayDate, 1), 'MMMM d, yyyy')}
      </h2>
      {isBefore(LATEST_AVAILABLE_DATE, selectedDate) && (
        <p className='text-amber-600 mb-4'>
          Note: The latest available papers are from{' '}
          {format(LATEST_AVAILABLE_DATE, 'MMMM d, yyyy')}
        </p>
      )}
      {papers.length > 0 ? (
        papers.map((paper) => (
          <Card
            key={paper.id}
            className='mb-4 bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'
          >
            <CardHeader className='flex flex-row items-center gap-4'>
              <Avatar>
                <AvatarFallback className='bg-green-200 text-green-800'>
                  {paper.authors[0]?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col'>
                <h2 className='text-lg font-semibold text-green-800 dark:text-green-100'>
                  {paper.title}
                </h2>
                <p className='text-sm text-green-600 dark:text-green-300'>
                  {format(new Date(paper.published), 'MMMM d, yyyy')}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-green-700 dark:text-green-200'>
                {paper.summary}
              </p>
            </CardContent>
            <CardFooter>
              <Link href={paper.link} target='_blank' rel='noopener noreferrer'>
                <Button
                  variant='outline'
                  className='text-green-700 dark:text-green-200 border-green-300 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-700'
                >
                  View on arXiv
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))
      ) : (
        <Card className='bg-white/80 dark:bg-green-800/80 backdrop-blur-sm border-green-200 dark:border-green-700'>
          <CardContent className='p-6'>
            <p className='text-center text-green-700 dark:text-green-200'>
              No papers found for the selected period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
