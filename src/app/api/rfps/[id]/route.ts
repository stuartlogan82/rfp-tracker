import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/rfps/[id]
 * Get a single RFP with its deadlines and documents
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rfpId = parseInt(id, 10);

    if (isNaN(rfpId)) {
      return NextResponse.json({ error: 'Invalid RFP ID' }, { status: 400 });
    }

    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
      include: {
        deadlines: {
          orderBy: {
            date: 'asc',
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    return NextResponse.json({ rfp }, { status: 200 });
  } catch (error) {
    console.error('Error fetching RFP:', error);
    return NextResponse.json({ error: 'Failed to fetch RFP' }, { status: 500 });
  }
}

/**
 * PUT /api/rfps/[id]
 * Update an RFP
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rfpId = parseInt(id, 10);

    if (isNaN(rfpId)) {
      return NextResponse.json({ error: 'Invalid RFP ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, agency, status } = body;

    // Validate status if provided
    const validStatuses = ['Active', 'Won', 'Lost', 'NoBid', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if RFP exists
    const existingRfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
    });

    if (!existingRfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Build update data object with only provided fields
    const updateData: {
      name?: string;
      agency?: string;
      status?: string;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (agency !== undefined) updateData.agency = agency;
    if (status !== undefined) updateData.status = status;

    // Update RFP
    const rfp = await prisma.rfp.update({
      where: { id: rfpId },
      data: updateData,
    });

    return NextResponse.json({ rfp }, { status: 200 });
  } catch (error) {
    console.error('Error updating RFP:', error);
    return NextResponse.json({ error: 'Failed to update RFP' }, { status: 500 });
  }
}

/**
 * DELETE /api/rfps/[id]
 * Delete an RFP and all associated deadlines and documents
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rfpId = parseInt(id, 10);

    if (isNaN(rfpId)) {
      return NextResponse.json({ error: 'Invalid RFP ID' }, { status: 400 });
    }

    // Check if RFP exists
    const existingRfp = await prisma.rfp.findUnique({
      where: { id: rfpId },
    });

    if (!existingRfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    // Delete RFP (cascade will handle deadlines and documents)
    await prisma.rfp.delete({
      where: { id: rfpId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting RFP:', error);
    return NextResponse.json({ error: 'Failed to delete RFP' }, { status: 500 });
  }
}
