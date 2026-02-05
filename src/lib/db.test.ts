/**
 * @jest-environment node
 */
import { prisma } from './db';

describe('Database Models', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.deadline.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rfp.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Rfp model', () => {
    it('creates an RFP with all required fields', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      expect(rfp.id).toBeDefined();
      expect(rfp.name).toBe('Test RFP');
      expect(rfp.agency).toBe('Test Agency');
      expect(rfp.status).toBe('Active');
      expect(rfp.createdAt).toBeInstanceOf(Date);
      expect(rfp.updatedAt).toBeInstanceOf(Date);
    });

    it('accepts all valid status values', async () => {
      const statuses = ['Active', 'Won', 'Lost', 'NoBid', 'Archived'];

      for (const status of statuses) {
        const rfp = await prisma.rfp.create({
          data: {
            name: `RFP ${status}`,
            agency: 'Test Agency',
            status,
          },
        });

        expect(rfp.status).toBe(status);
      }
    });
  });

  describe('Deadline model', () => {
    it('creates a deadline linked to an RFP', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      const deadline = await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15'),
          time: '14:00',
          label: 'Proposal Submission',
          context: 'Final deadline for submission',
          completed: false,
        },
      });

      expect(deadline.id).toBeDefined();
      expect(deadline.rfpId).toBe(rfp.id);
      expect(deadline.date).toBeInstanceOf(Date);
      expect(deadline.time).toBe('14:00');
      expect(deadline.label).toBe('Proposal Submission');
      expect(deadline.context).toBe('Final deadline for submission');
      expect(deadline.completed).toBe(false);
      expect(deadline.createdAt).toBeInstanceOf(Date);
      expect(deadline.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a deadline with nullable time and context', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      const deadline = await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15'),
          label: 'Proposal Submission',
        },
      });

      expect(deadline.time).toBeNull();
      expect(deadline.context).toBeNull();
      expect(deadline.completed).toBe(false); // default value
    });

    it('retrieves deadline with related RFP', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15'),
          label: 'Proposal Submission',
        },
      });

      const deadlineWithRfp = await prisma.deadline.findFirst({
        include: {
          rfp: true,
        },
      });

      expect(deadlineWithRfp?.rfp.name).toBe('Test RFP');
      expect(deadlineWithRfp?.rfp.agency).toBe('Test Agency');
    });
  });

  describe('Document model', () => {
    it('creates a document linked to an RFP', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      const document = await prisma.document.create({
        data: {
          rfpId: rfp.id,
          filename: 'test-rfp.pdf',
          filepath: '/uploads/test-rfp.pdf',
          mimeType: 'application/pdf',
        },
      });

      expect(document.id).toBeDefined();
      expect(document.rfpId).toBe(rfp.id);
      expect(document.filename).toBe('test-rfp.pdf');
      expect(document.filepath).toBe('/uploads/test-rfp.pdf');
      expect(document.mimeType).toBe('application/pdf');
      expect(document.uploadedAt).toBeInstanceOf(Date);
    });

    it('retrieves document with related RFP', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      await prisma.document.create({
        data: {
          rfpId: rfp.id,
          filename: 'test-rfp.pdf',
          filepath: '/uploads/test-rfp.pdf',
          mimeType: 'application/pdf',
        },
      });

      const documentWithRfp = await prisma.document.findFirst({
        include: {
          rfp: true,
        },
      });

      expect(documentWithRfp?.rfp.name).toBe('Test RFP');
    });
  });

  describe('Relationships', () => {
    it('retrieves RFP with all deadlines and documents', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15'),
          label: 'Deadline 1',
        },
      });

      await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-20'),
          label: 'Deadline 2',
        },
      });

      await prisma.document.create({
        data: {
          rfpId: rfp.id,
          filename: 'doc1.pdf',
          filepath: '/uploads/doc1.pdf',
          mimeType: 'application/pdf',
        },
      });

      const rfpWithRelations = await prisma.rfp.findUnique({
        where: { id: rfp.id },
        include: {
          deadlines: true,
          documents: true,
        },
      });

      expect(rfpWithRelations?.deadlines).toHaveLength(2);
      expect(rfpWithRelations?.documents).toHaveLength(1);
    });

    it('deletes cascade: deleting RFP removes deadlines and documents', async () => {
      const rfp = await prisma.rfp.create({
        data: {
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        },
      });

      await prisma.deadline.create({
        data: {
          rfpId: rfp.id,
          date: new Date('2026-03-15'),
          label: 'Deadline 1',
        },
      });

      await prisma.document.create({
        data: {
          rfpId: rfp.id,
          filename: 'doc1.pdf',
          filepath: '/uploads/doc1.pdf',
          mimeType: 'application/pdf',
        },
      });

      await prisma.rfp.delete({
        where: { id: rfp.id },
      });

      const deadlines = await prisma.deadline.findMany({
        where: { rfpId: rfp.id },
      });

      const documents = await prisma.document.findMany({
        where: { rfpId: rfp.id },
      });

      expect(deadlines).toHaveLength(0);
      expect(documents).toHaveLength(0);
    });
  });
});
