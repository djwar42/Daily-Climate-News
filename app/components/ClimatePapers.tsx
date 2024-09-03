import React from 'react'
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

async function fetchPapers(date: Date) {
  const formattedDate = format(date, 'yyyy-MM')
  const res = await fetch(
    `/api/fetchPapers?query=climate+change&date=${formattedDate}&categories=physics.ao-ph,physics.geo-ph,eess.SP,q-bio.PE`,
    {
      next: { revalidate: 3600 } // Revalidate every hour
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch papers')
  }

  const data = await res.json()
  return data.entries as Paper[]
}

export default async function ClimatePapers({
  selectedDate
}: {
  selectedDate: Date
}) {
  const papers = await fetchPapers(selectedDate)

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
