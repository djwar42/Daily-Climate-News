// app/api/fetchPapers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseString } from 'xml2js'
import { parse, format } from 'date-fns'

const API_ENDPOINT = 'https://export.arxiv.org/api/query'
const EARLY_START_DATE = '19990101000000' // January 1, 1999 at 00:00:00

interface ArxivEntry {
  id: string[]
  title: string[]
  summary: string[]
  author: Array<{ name: string[] }>
  published: string[]
  link: Array<{ $: { rel: string; href: string } }>
  category?: Array<{ $: { term: string } }>
}

interface ArxivResponse {
  feed: {
    entry: ArxivEntry[]
    'opensearch:totalResults': string[]
    'opensearch:startIndex': string[]
    'opensearch:itemsPerPage': string[]
  }
}

interface Paper {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  link: string
  categories: string[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || 'climate change'
  const maxResults = parseInt(searchParams.get('max_results') || '10', 10)
  const endDate = searchParams.get('endDate')

  let dateQuery = ''
  if (endDate) {
    const endDateTime = parse(endDate, 'yyyy-MM-dd', new Date())
    const formattedEndDate = format(endDateTime, 'yyyyMMddHHmm')
    dateQuery = `+AND+submittedDate:[${EARLY_START_DATE}+TO+${formattedEndDate}]`
  }

  try {
    const response = await fetch(
      `${API_ENDPOINT}?search_query=all:"${query}"${dateQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from arXiv API')
    }

    const responseText = await response.text()

    const parsedData = await new Promise<ArxivResponse>((resolve, reject) => {
      parseString(responseText, (err, result) => {
        if (err) reject(err)
        else resolve(result as ArxivResponse)
      })
    })

    const entries: Paper[] = parsedData.feed.entry
      .filter((entry) => {
        const entryCategories = entry.category?.map((cat) => cat.$.term) || []
        return (
          entryCategories.length === 0 ||
          entryCategories.some((cat) => entryCategories.includes(cat))
        )
      })
      .map((entry) => ({
        id: entry.id[0],
        title: entry.title[0],
        summary: entry.summary[0],
        authors: entry.author.map((author) => author.name[0]),
        published: entry.published[0],
        link:
          entry.link.find((link) => link.$.rel === 'alternate')?.$.href || '',
        categories: entry.category?.map((cat) => cat.$.term) || []
      }))

    return NextResponse.json({
      entries,
      totalResults: parseInt(parsedData.feed['opensearch:totalResults'][0], 10),
      startIndex: parseInt(parsedData.feed['opensearch:startIndex'][0], 10),
      itemsPerPage: parseInt(parsedData.feed['opensearch:itemsPerPage'][0], 10)
    })
  } catch (error) {
    console.error('Error fetching papers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    )
  }
}
