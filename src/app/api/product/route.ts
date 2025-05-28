import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { z } from 'zod'

interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  [key: string]: string | number | boolean
}

interface CloudinaryError {
  message: string
  [key: string]: unknown
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
async function uploadFileToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw' = 'image',
  originalFileName?: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const baseFileName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : `file-${Date.now()}`

    const extension = originalFileName?.split('.').pop() || 'pdf'
    const publicId = `${baseFileName}-${Date.now()}` // unique!

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        publicId,
        use_filename: true,
        unique_filename: false,
        format: extension,
      },
      (error, result) => {
        if (error) reject(new Error(error.message))
        else if (!result) reject(new Error('No result from Cloudinary'))
        else resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}

// Zod schemas
const productSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  genericName: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),
  subsubCategory: z.string().min(1, 'Sub-sub-category is required'),
  productType: z.string().min(1, 'Product type is required'),
  companyId: z.number().min(1, 'Company ID is required'),
  companyPrice: z.number().optional(),
  dealerPrice: z.number().optional(),
  customerPrice: z.number().min(0, 'Customer price must be positive'),
  packingUnit: z.string().min(1, 'Packing unit is required'),
  partnerId: z.number().min(1, 'Partner ID is required'),
  description: z.string().optional(),
  dosage: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

const updateProductSchema = productSchema.partial()

// Helper function for file uploads
async function handleFileUpload(file: File | null, type: 'image' | 'pdf') {
  if (!file) return null

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return uploadFileToCloudinary(
    buffer,
    `products/${type}s`,
    type === 'pdf' ? 'raw' : 'image',
    file.name
  )
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract and validate product data
    const productData = {
      productName: formData.get('productName') as string,
      genericName: formData.get('genericName') as string | null,
      category: formData.get('category') as string,
      subCategory: formData.get('subCategory') as string,
      subsubCategory: formData.get('subsubCategory') as string,
      productType: formData.get('productType') as string,
      companyId: Number(formData.get('companyId')),
      companyPrice: formData.get('companyPrice') ? Number(formData.get('companyPrice')) : undefined,
      dealerPrice: formData.get('dealerPrice') ? Number(formData.get('dealerPrice')) : undefined,
      customerPrice: Number(formData.get('customerPrice')),
      packingUnit: formData.get('packingUnit') as string,
      partnerId: Number(formData.get('partnerId')),
      description: formData.get('description') as string | null,
      dosage: formData.get('dosage') as string | null,
      isFeatured: formData.get('isFeatured') === 'true',
      isActive: formData.get('isActive') === 'true',
    }

    const validation = productSchema.safeParse(productData)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Handle file uploads
    const [imageResult, pdfResult] = await Promise.all([
      handleFileUpload(formData.get('image') as File | null, 'image'),
      handleFileUpload(formData.get('pdf') as File | null, 'pdf')
    ])

    // Create product with relations
    const product = await prisma.$transaction(async (tx) => {
      // 1. Create base product
      const product = await tx.product.create({
        data: validation.data
      })

      // 2. Create image if exists
      if (imageResult) {
        await tx.productImage.create({
          data: {
            url: imageResult.secure_url,
            alt: validation.data.productName,
            publicId: imageResult.public_id,
            productId: product.id
          }
        })
      }

      // 3. Create PDF if exists
      if (pdfResult) {
        await tx.productPdf.create({
          data: {
            url: pdfResult.secure_url,
            publicId: pdfResult.public_id,
            productId: product.id
          }
        })
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { image: true, pdf: true }
      })
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Find product with relations
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { image: true, pdf: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete files from Cloudinary
    await Promise.all([
      product.image?.publicId ? cloudinary.uploader.destroy(product.image.publicId) : null,
      product.pdf?.publicId ? cloudinary.uploader.destroy(product.pdf.publicId, { resource_type: 'raw' }) : null
    ])

    // Delete product (relations will cascade)
    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const sortBy = searchParams.get('sortBy') || 'id'
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { productName: { contains: search,  } },
          { genericName: { contains: search,  } }
        ]
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        company: true,
        partner: true,
        image: true,
        pdf: true
      }
    }),
    prisma.product.count({
      where: {
        OR: [
          { productName: { contains: search,  } },
          { genericName: { contains: search, } }
        ]
      }
    })
  ])

  return NextResponse.json({
    data: items,
    total,
    page,
    lastSubmittedAt: items.length > 0 ? items[items.length - 1].createdAt ?? null : null,
  })
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Extract product data
    const productData = {
      productName: formData.get('productName') as string | null,
      genericName: formData.get('genericName') as string | null,
      category: formData.get('category') as string | null,
      subCategory: formData.get('subCategory') as string | null,
      subsubCategory: formData.get('subsubCategory') as string | null,
      productType: formData.get('productType') as string | null,
      companyId: formData.get('companyId') ? Number(formData.get('companyId')) : undefined,
      companyPrice: formData.get('companyPrice') ? Number(formData.get('companyPrice')) : undefined,
      dealerPrice: formData.get('dealerPrice') ? Number(formData.get('dealerPrice')) : undefined,
      customerPrice: formData.get('customerPrice') ? Number(formData.get('customerPrice')) : undefined,
      packingUnit: formData.get('packingUnit') as string | null,
      partnerId: formData.get('partnerId') ? Number(formData.get('partnerId')) : undefined,
      description: formData.get('description') as string | null,
      dosage: formData.get('dosage') as string | null,
      isFeatured: formData.get('isFeatured') ? formData.get('isFeatured') === 'true' : undefined,
      isActive: formData.get('isActive') ? formData.get('isActive') === 'true' : undefined,
    }

    // Validate input
    const validation = updateProductSchema.safeParse(productData)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Get existing product
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { image: true, pdf: true }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Handle file uploads
    const [imageResult, pdfResult] = await Promise.all([
      handleFileUpload(formData.get('image') as File | null, 'image'),
      handleFileUpload(formData.get('pdf') as File | null, 'pdf')
    ])

    // Update product with transactions
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update product data
       await tx.product.update({
        where: { id: productId },
        data: validation.data,
        include: { image: true, pdf: true }
      })

      // Handle image update
      if (imageResult) {
        // Delete old image
        if (existingProduct.image?.publicId) {
          await cloudinary.uploader.destroy(existingProduct.image.publicId)
        }

        await tx.productImage.upsert({
          where: { productId },
          create: {
            url: imageResult.secure_url,
            alt: productData.productName || existingProduct.productName,
            publicId: imageResult.public_id,
            productId
          },
          update: {
            url: imageResult.secure_url,
            alt: productData.productName || existingProduct.productName,
            publicId: imageResult.public_id
          }
        })
      }

      // Handle PDF update
      if (pdfResult) {
        // Delete old PDF
        if (existingProduct.pdf?.publicId) {
          await cloudinary.uploader.destroy(existingProduct.pdf.publicId, { resource_type: 'raw' })
        }

        await tx.productPdf.upsert({
          where: { productId },
          create: {
            url: pdfResult.secure_url,
            publicId: pdfResult.public_id,
            productId
          },
          update: {
            url: pdfResult.secure_url,
            publicId: pdfResult.public_id
          }
        })
      }

      return tx.product.findUnique({
        where: { id: productId },
        include: { image: true, pdf: true }
      })
    })

    return NextResponse.json(updatedProduct, { status: 200 })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}