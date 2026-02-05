import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/deadlines/[id]
 * Update a deadline
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deadlineId = parseInt(id, 10);

    if (isNaN(deadlineId)) {
      return NextResponse.json(
        { error: 'Invalid deadline ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { date, time, label, context: deadlineContext, completed } = body;

    // Validate date format if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }

    // Check if deadline exists
    const existingDeadline = await prisma.deadline.findUnique({
      where: { id: deadlineId },
    });

    if (!existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: {
      date?: Date;
      time?: string | null;
      label?: string;
      context?: string | null;
      completed?: boolean;
    } = {};

    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (label !== undefined) updateData.label = label;
    if (deadlineContext !== undefined)
      updateData.context = deadlineContext;
    if (completed !== undefined) updateData.completed = completed;

    // Update deadline
    const deadline = await prisma.deadline.update({
      where: { id: deadlineId },
      data: updateData,
    });

    return NextResponse.json({ deadline }, { status: 200 });
  } catch (error) {
    console.error('Error updating deadline:', error);
    return NextResponse.json(
      { error: 'Failed to update deadline' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deadlines/[id]
 * Delete a deadline
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deadlineId = parseInt(id, 10);

    if (isNaN(deadlineId)) {
      return NextResponse.json(
        { error: 'Invalid deadline ID' },
        { status: 400 }
      );
    }

    // Check if deadline exists
    const existingDeadline = await prisma.deadline.findUnique({
      where: { id: deadlineId },
    });

    if (!existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      );
    }

    // Delete deadline
    await prisma.deadline.delete({
      where: { id: deadlineId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Failed to delete deadline' },
      { status: 500 }
    );
  }
}
