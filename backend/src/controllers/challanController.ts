import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

// Generates a sequential, human-readable challan number like CH-2026-0001.
async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const last = await prisma.salesChallan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let nextSeq = 1;
  if (last) {
    const lastSeq = parseInt(last.challanNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

// Create a new challan (Draft by default). Product snapshot data (name/sku/price)
// is captured at creation time so later product edits don't rewrite history.
export async function createChallan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { customerId, items, status } = req.body as {
      customerId: string;
      items: ChallanItemInput[];
      status?: 'DRAFT' | 'CONFIRMED';
    };

    if (!items || items.length === 0) {
      throw new ApiError(400, 'A challan must include at least one product');
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new ApiError(404, 'Customer not found');

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== new Set(productIds).size) {
      throw new ApiError(404, 'One or more products were not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const challanNumber = await generateChallanNumber();
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    const wantsConfirm = status === 'CONFIRMED';

    // If confirming immediately, validate stock availability up front.
    if (wantsConfirm) {
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        if (item.quantity <= 0) {
          throw new ApiError(400, `Quantity for ${product.name} must be greater than zero`);
        }
        if (product.currentStock - item.quantity < 0) {
          throw new ApiError(
            400,
            `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${product.currentStock}, requested: ${item.quantity}`
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          status: wantsConfirm ? 'CONFIRMED' : 'DRAFT',
          createdById: req.user!.id,
          confirmedAt: wantsConfirm ? new Date() : null,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              const unitPrice = product.unitPrice;
              return {
                productId: product.id,
                productNameSnap: product.name,
                productSkuSnap: product.sku,
                unitPriceSnap: unitPrice,
                quantity: item.quantity,
                lineTotal: new Prisma.Decimal(unitPrice).mul(item.quantity),
              };
            }),
          },
        },
        include: { items: true, customer: true },
      });

      // Reduce stock + log movement only when confirmed.
      if (wantsConfirm) {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales challan ${challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return challan;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listChallans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, customerId, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [items, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
        include: { customer: { select: { name: true, mobile: true } }, items: true },
      }),
      prisma.salesChallan.count({ where }),
    ]);

    res.json({
      items,
      pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) },
    });
  } catch (err) {
    next(err);
  }
}

// Generates a PDF invoice for a confirmed challan.
export async function generateInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true, email: true } },
      },
    });
    if (!challan) throw new ApiError(404, 'Challan not found');
    if (challan.status !== 'CONFIRMED') {
      throw new ApiError(400, 'Invoice can only be generated for confirmed challans');
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${challan.challanNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Orbital Ops Portal', { align: 'center' });
    doc.text('123 Business Park, Industrial Area, City - 123456', { align: 'center' });
    doc.text('GST: 27ABCDE1234F1Z5 | Email: billing@orbitalops.com', { align: 'center' });
    doc.moveDown(1.5);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Invoice details
    doc.fontSize(11).font('Helvetica-Bold').text(`Challan #: `, { continued: true }).font('Helvetica').text(challan.challanNumber);
    doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(challan.createdAt.toLocaleDateString('en-IN'));
    doc.font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(challan.status);
    doc.moveDown(1);

    // Customer details
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${challan.customer.name}`);
    if (challan.customer.businessName) doc.text(`Business: ${challan.customer.businessName}`);
    doc.text(`Mobile: ${challan.customer.mobile}`);
    if (challan.customer.email) doc.text(`Email: ${challan.customer.email}`);
    if (challan.customer.gstNumber) doc.text(`GST: ${challan.customer.gstNumber}`);
    if (challan.customer.address) doc.text(`Address: ${challan.customer.address}`);
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Product', 50, tableTop, { width: 180 });
    doc.text('SKU', 230, tableTop, { width: 80 });
    doc.text('Price', 310, tableTop, { width: 70, align: 'right' });
    doc.text('Qty', 380, tableTop, { width: 50, align: 'right' });
    doc.text('Total', 430, tableTop, { width: 115, align: 'right' });
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.8);

    // Table rows
    let grandTotal = 0;
    for (const item of challan.items) {
      const y = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text(item.productNameSnap, 50, y, { width: 180 });
      doc.text(item.productSkuSnap, 230, y, { width: 80 });
      doc.text(`\u20B9${Number(item.unitPriceSnap).toFixed(2)}`, 310, y, { width: 70, align: 'right' });
      doc.text(String(item.quantity), 380, y, { width: 50, align: 'right' });
      doc.text(`\u20B9${Number(item.lineTotal).toFixed(2)}`, 430, y, { width: 115, align: 'right' });
      doc.moveDown(0.6);
      grandTotal += Number(item.lineTotal);
    }

    // Total row
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Grand Total: \u20B9${grandTotal.toFixed(2)}`, 300, doc.y, { width: 245, align: 'right' });

    // Footer
    doc.moveDown(3);
    doc.fontSize(9).font('Helvetica').fillColor('#888');
    doc.text('This is a computer-generated invoice.', { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

export async function getChallan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true, email: true } },
      },
    });
    if (!challan) throw new ApiError(404, 'Challan not found');
    res.json(challan);
  } catch (err) {
    next(err);
  }
}

// Confirms a Draft challan: re-validates stock at confirmation time (stock may
// have moved since the draft was created), reduces stock atomically, and never
// allows stock to go negative.
export async function confirmChallan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!challan) throw new ApiError(404, 'Challan not found');
    if (challan.status !== 'DRAFT') {
      throw new ApiError(400, `Only Draft challans can be confirmed. Current status: ${challan.status}`);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new ApiError(404, `Product ${item.productNameSnap} no longer exists`);
        if (product.currentStock - item.quantity < 0) {
          throw new ApiError(
            400,
            `Insufficient stock for "${product.name}". Available: ${product.currentStock}, requested: ${item.quantity}`
          );
        }
      }

      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales challan ${challan.challanNumber}`,
            createdById: req.user!.id,
          },
        });
      }

      await tx.salesChallan.update({
        where: { id: challan.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    });

    const updated = await prisma.salesChallan.findUnique({
      where: { id: challan.id },
      include: { items: true, customer: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Cancels a challan. If it was already Confirmed, stock is restored.
export async function cancelChallan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!challan) throw new ApiError(404, 'Challan not found');
    if (challan.status === 'CANCELLED') {
      throw new ApiError(400, 'Challan is already cancelled');
    }

    await prisma.$transaction(async (tx) => {
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Cancellation of challan ${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      await tx.salesChallan.update({
        where: { id: challan.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
    });

    const updated = await prisma.salesChallan.findUnique({ where: { id: challan.id }, include: { items: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
