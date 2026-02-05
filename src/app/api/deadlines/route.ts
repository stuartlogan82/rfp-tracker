import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/deadlines
 * Create a new deadline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfpId, date, time, label, context, completed } = body;

    // Validate required fields
    if (!rfpId || !date || !label) {
      return NextResponse.json(
        { error: 'RFP ID, date, and label are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if RFP exists
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 400 });
    }

    // Create deadline
    const deadline = await prisma.deadline.create({
      data: {
        rfpId,
        date: parsedDate,
        time: time || null,
        label,
        context: context || null,
        completed: completed ?? false,
      },
    });

    return NextResponse.json({ deadline }, { status: 201 });
  } catch (error) {
    console.error('Error creating deadline:', error);
    return NextResponse.json(
      { error: 'Failed to create deadline' },
      { status: 500 }
    );
  }
}
