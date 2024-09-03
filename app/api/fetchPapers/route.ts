import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { parseString } from 'xml2js'

const API_ENDPOINT = 'https://export.arxiv.org/api/query'

interface ArxivResponse {
  feed: {
    entry: Array<{
      id: string[]
      title: string[]
      summary: string[]
      author: Array<{ name: string[] }>
      published: string[]
      link: Array<{ $: { rel: string; href: string } }>
      category?: Array<{ $: { term: string } }>
    }>
    'opensearch:totalResults': string[]
    'opensearch:startIndex': string[]
    'opensearch:itemsPerPage': string[]
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || 'electron'
  const start = parseInt(searchParams.get('start') || '0', 10)
  const maxResults = parseInt(searchParams.get('max_results') || '10', 10)

  try {
    const response = await axios.get(API_ENDPOINT, {
      params: {
        search_query: `all:${query}`,
        start,
        max_results: maxResults
      }
    })

    console.log('Response data:', response.data)

    const parsedData = await new Promise<ArxivResponse>((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) reject(err)
        else resolve(result as ArxivResponse)
      })
    })

    const entries = parsedData.feed.entry
      .filter((entry) => {
        const entryCategories =
          entry.category?.map((cat: any) => cat.$.term) || []
        return (
          entryCategories.length === 0 ||
          entryCategories.some((cat: string) => entryCategories.includes(cat))
        )
      })
      .map((entry: any) => ({
        id: entry.id[0],
        title: entry.title[0],
        summary: entry.summary[0],
        authors: entry.author.map((author: any) => author.name[0]),
        published: entry.published[0],
        link: entry.link.find((link: any) => link.$.rel === 'alternate')?.$
          ?.href,
        categories: entry.category?.map((cat: any) => cat.$.term) || []
      }))

    // console.log('Filtered entries:', entries.length)
    return NextResponse.json({
      entries,
      totalResults: parseInt(parsedData.feed['opensearch:totalResults'][0], 10),
      startIndex: parseInt(parsedData.feed['opensearch:startIndex'][0], 10),
      itemsPerPage: parseInt(parsedData.feed['opensearch:itemsPerPage'][0], 10)
    })
  } catch (error: any) {
    console.error('Error fetching papers:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    )
  }
}
