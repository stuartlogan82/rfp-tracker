import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/rfps
 * List all RFPs
 */
export async function GET() {
  try {
    const rfps = await prisma.rfp.findMany({
      include: {
        deadlines: true,
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ rfps }, { status: 200 });
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    return NextResponse.json({ error: 'Failed to fetch RFPs' }, { status: 500 });
  }
}

/**
 * POST /api/rfps
 * Create a new RFP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, agency, status } = body;

    // Validate required fields
    if (!name || !agency) {
      return NextResponse.json(
        { error: 'Name and agency are required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['Active', 'Won', 'Lost', 'NoBid', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Create RFP
    const rfp = await prisma.rfp.create({
      data: {
        name,
        agency,
        status: status || 'Active',
      },
    });

    return NextResponse.json({ rfp }, { status: 201 });
  } catch (error) {
    console.error('Error creating RFP:', error);
    return NextResponse.json({ error: 'Failed to create RFP' }, { status: 500 });
  }
}
