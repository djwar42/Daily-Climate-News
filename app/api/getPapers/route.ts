import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter is required' },
      { status: 400 }
    )
  }

  try {
    const keys = await kv.keys(`climate_article:${date}*`)
    const papers = await Promise.all(keys.map((key) => kv.get(key)))

    return NextResponse.json(papers)
  } catch (error) {
    console.error('Error fetching papers from KV:', error)
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    )
  }
}
