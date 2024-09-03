import { NextRequest, NextResponse } from 'next/server'
import { parseString } from 'xml2js'

const API_ENDPOINT = 'https://export.arxiv.org/api/query'

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
  const query = searchParams.get('query') || 'electron'
  const start = parseInt(searchParams.get('start') || '0', 10)
  const maxResults = parseInt(searchParams.get('max_results') || '10', 10)

  try {
    const response = await fetch(
      `${API_ENDPOINT}?search_query=all:${query}&start=${start}&max_results=${maxResults}`
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
