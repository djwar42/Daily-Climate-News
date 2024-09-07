import { NextRequest, NextResponse } from 'next/server'
import { parseString } from 'xml2js'

const API_ENDPOINT = 'https://export.arxiv.org/api/query'

interface ArxivEntry {
  id: string[]
  title: string[]
  summary: string[]
  author: Array<{ name: string[]; 'arxiv:affiliation'?: string[] }>
  published: string[]
  updated: string[]
  'arxiv:primary_category': [{ $: { term: string } }]
  category: Array<{ $: { term: string } }>
  link: Array<{ $: { rel: string; href: string; type?: string } }>
  'arxiv:comment'?: string[]
  'arxiv:journal_ref'?: string[]
  'arxiv:doi'?: string[]
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
  authors: Array<{ name: string; affiliation?: string }>
  published: string
  updated: string
  primaryCategory: string
  categories: string[]
  links: { [key: string]: string }
  comment?: string
  journalRef?: string
  doi?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || 'climate+change'
  console.log('Query:', query)
  const start = parseInt(searchParams.get('start') || '0', 10)
  const maxResults = Math.min(
    parseInt(searchParams.get('max_results') || '10', 10),
    2000
  )
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const categories =
    'cat:physics.ao-ph OR cat:physics.geo-ph OR cat:eess.SP OR cat:q-bio.PE'
  const dateQuery = null
  //startDate && endDate ? `submittedDate:[${startDate} TO ${endDate}]` : ''
  const searchQuery = `${categories}${dateQuery ? ' AND ' + dateQuery : ''}${
    query ? ' AND ' + query : ''
  }`

  try {
    const url = new URL(API_ENDPOINT)
    url.searchParams.append('search_query', searchQuery)
    url.searchParams.append('start', start.toString())
    url.searchParams.append('max_results', maxResults.toString())
    url.searchParams.append('sortBy', 'submittedDate')
    url.searchParams.append('sortOrder', 'descending')

    console.log('Fetching from:', url.toString())
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`ArXiv API responded with status: ${response.status}`)
    }

    const responseText = await response.text()
    const parsedData: ArxivResponse = await new Promise((resolve, reject) => {
      parseString(responseText, (err, result) => {
        if (err) reject(err)
        else resolve(result as ArxivResponse)
      })
    })

    if (!parsedData.feed || !parsedData.feed.entry) {
      return NextResponse.json({
        entries: [],
        totalResults: 0,
        startIndex: 0,
        itemsPerPage: 0
      })
    }

    const entries: Paper[] = parsedData.feed.entry.map((entry) => ({
      id: entry.id[0],
      title: entry.title[0],
      summary: entry.summary[0],
      authors: entry.author.map((author) => ({
        name: author.name[0],
        affiliation: author['arxiv:affiliation']?.[0]
      })),
      published: entry.published[0],
      updated: entry.updated[0],
      primaryCategory: entry['arxiv:primary_category'][0].$.term,
      categories: entry.category.map((cat) => cat.$.term),
      links: entry.link.reduce((acc, link) => {
        acc[link.$.rel] = link.$.href
        return acc
      }, {} as { [key: string]: string }),
      comment: entry['arxiv:comment']?.[0],
      journalRef: entry['arxiv:journal_ref']?.[0],
      doi: entry['arxiv:doi']?.[0]
    }))

    console.log(
      'Paper titles:',
      entries.map((entry) => entry.title)
    )

    return NextResponse.json({
      entries,
      totalResults: parseInt(parsedData.feed['opensearch:totalResults'][0], 10),
      startIndex: parseInt(parsedData.feed['opensearch:startIndex'][0], 10),
      itemsPerPage: parseInt(parsedData.feed['opensearch:itemsPerPage'][0], 10)
    })
  } catch (error) {
    console.error('Error fetching papers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch papers', details: (error as Error).message },
      { status: 500 }
    )
  }
}
