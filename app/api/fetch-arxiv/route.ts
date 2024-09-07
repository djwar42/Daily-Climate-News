import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout, stderr } = await execAsync('python api/fetch-arxiv.py')

    if (stderr) {
      console.error('Error running Python script:', stderr)
      return NextResponse.json(
        { error: 'Error running Python script' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: stdout.trim() })
  } catch (error) {
    console.error('Failed to execute Python script:', error)
    return NextResponse.json(
      { error: 'Failed to execute Python script' },
      { status: 500 }
    )
  }
}
