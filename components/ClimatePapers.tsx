import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { format } from 'date-fns'

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
        const formattedDate = format(selectedDate, 'yyyy-MM')
        console.log('Fetching papers for date:', formattedDate)
        const response = await axios.get<ApiResponse>('/api/fetchPapers', {
          params: {
            query: 'climate change',
            date: formattedDate,
            categories: 'physics.ao-ph,physics.geo-ph,eess.SP,q-bio.PE'
          }
        })
        console.log('API Response:', response.data)
        if (Array.isArray(response.data.entries)) {
          setPapers(response.data.entries)
        } else {
          console.error('Entries is not an array:', response.data.entries)
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

  console.log('Papers state:', papers)

  if (loading) return <div>Loading...</div>
  if (error) return <div className='text-red-500'>{error}</div>

  return (
    <div>
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
              No papers found for the selected date.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
