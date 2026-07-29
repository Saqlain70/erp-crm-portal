import { Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export async function createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      name, mobile, email, businessName, gstNumber,
      customerType, address, status, followUpDate, notes,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name, mobile, email, businessName, gstNumber,
        customerType, address, notes,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
    });

    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

export async function listCustomers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, customerType, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (customerType) where.customerType = customerType;

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      items,
      pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        followUps: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
        challans: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) throw new ApiError(404, 'Customer not found');
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      name, mobile, email, businessName, gstNumber,
      customerType, address, status, followUpDate, notes,
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name, mobile, email, businessName, gstNumber,
        customerType, address, status, notes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });

    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function addFollowUp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { note, followUpDate } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) throw new ApiError(404, 'Customer not found');

    const followUp = await prisma.followUp.create({
      data: {
        customerId: req.params.id,
        note,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdById: req.user!.id,
      },
    });

    // Keep the customer's followUpDate field in sync with the latest note, if provided.
    if (followUpDate) {
      await prisma.customer.update({
        where: { id: req.params.id },
        data: { followUpDate: new Date(followUpDate) },
      });
    }

    res.status(201).json(followUp);
  } catch (err) {
    next(err);
  }
}
