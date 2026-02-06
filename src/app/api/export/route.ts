import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateIcsForDeadline, generateIcsForDeadlines } from '@/lib/ics-generator';

export async function GET(request: NextRequest) {
  try {
    const deadlineIdParam = request.nextUrl.searchParams.get('deadlineId');

    if (deadlineIdParam) {
      return await exportSingle(deadlineIdParam);
    }

    return await exportBulk();
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate calendar export' },
      { status: 500 }
    );
  }
}

async function exportSingle(deadlineIdParam: string) {
  const id = parseInt(deadlineIdParam, 10);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid deadline ID' },
      { status: 400 }
    );
  }

  const deadline = await prisma.deadline.findUnique({
    where: { id },
    include: { rfp: true },
  });

  if (!deadline) {
    return NextResponse.json(
      { error: 'Deadline not found' },
      { status: 404 }
    );
  }

  const icsString = generateIcsForDeadline({
    date: deadline.date,
    time: deadline.time,
    label: deadline.label,
    context: deadline.context,
    rfpName: deadline.rfp.name,
  });

  const slug = deadline.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return new Response(icsString, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}

async function exportBulk() {
  const deadlines = await prisma.deadline.findMany({
    where: {
      completed: false,
      rfp: { status: 'Active' },
    },
    include: { rfp: true },
    orderBy: { date: 'asc' },
  });

  if (deadlines.length === 0) {
    return NextResponse.json(
      { error: 'No active incomplete deadlines to export' },
      { status: 404 }
    );
  }

  const icsString = generateIcsForDeadlines(
    deadlines.map((d) => ({
      date: d.date,
      time: d.time,
      label: d.label,
      context: d.context,
      rfpName: d.rfp.name,
    }))
  );

  const today = new Date().toISOString().split('T')[0];

  return new Response(icsString, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="rfp-deadlines-${today}.ics"`,
    },
  });
}
