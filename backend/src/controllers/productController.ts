import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Upload product image — stores locally; can be swapped to S3 by changing the save logic.
// Serve product image with guaranteed cross-origin headers (fixes ERR_BLOCKED_BY_RESPONSE.NotSameOrigin)
export async function serveProductImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || !product.imageUrl) throw new ApiError(404, 'Image not found');

    const filename = path.basename(product.imageUrl);
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) throw new ApiError(404, 'Image file not found on disk');

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ApiError(400, 'No image file provided');

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, 'Product not found');

    const imageUrl = `/uploads/${req.file.filename}`;
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl } });

    res.json({ imageUrl });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlertQty, location } = req.body;

    const product = await prisma.product.create({
      data: {
        name, sku, category, location,
        unitPrice,
        currentStock: currentStock || 0,
        minStockAlertQty: minStockAlertQty || 0,
      },
    });

    // If created with opening stock, log it as an initial IN movement.
    if (currentStock && currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity: currentStock,
          movementType: 'IN',
          reason: 'Opening stock',
          createdById: req.user!.id,
        },
      });
    }

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function listProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, category, lowStock, page = '1', pageSize = '20' } = req.query as Record<string, string>;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    let items: any[];
    let total: number;

    if (lowStock === 'true') {
      // Fetch all matching products and filter for low stock in-memory
      // (Prisma cannot compare two columns natively in WHERE)
      const allItems = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
      const filtered = allItems.filter((p) => p.currentStock <= p.minStockAlertQty);
      total = filtered.length;
      items = filtered.slice((pageNum - 1) * size, (pageNum - 1) * size + size);
    } else {
      [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: (pageNum - 1) * size,
          take: size,
        }),
        prisma.product.count({ where }),
      ]);
    }

    res.json({
      items,
      pagination: { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { createdBy: { select: { name: true } } },
        },
      },
    });
    if (!product) throw new ApiError(404, 'Product not found');
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, sku, category, unitPrice, minStockAlertQty, location } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, sku, category, unitPrice, minStockAlertQty, location },
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
}

// Manually adjust stock (e.g. stock take correction, damage, restock) — separate
// from the automatic reduction that happens on challan confirmation.
export async function adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { quantity, movementType, reason } = req.body;

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new ApiError(404, 'Product not found');

    if (movementType === 'OUT' && product.currentStock - quantity < 0) {
      throw new ApiError(400, `Insufficient stock. Available: ${product.currentStock}, requested: ${quantity}`);
    }

    const newStock = movementType === 'IN' ? product.currentStock + quantity : product.currentStock - quantity;

    const [, movement] = await prisma.$transaction([
      prisma.product.update({ where: { id: product.id }, data: { currentStock: newStock } }),
      prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity,
          movementType,
          reason,
          createdById: req.user!.id,
        },
      }),
    ]);

    res.status(201).json({ movement, currentStock: newStock });
  } catch (err) {
    next(err);
  }
}
