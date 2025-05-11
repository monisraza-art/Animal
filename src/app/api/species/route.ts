import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { z } from 'zod'


interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  [key: string]: unknown
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

async function uploadImageToCloudinary(buffer: Buffer): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'species',
        resource_type: 'image',
      },
      (error: CloudinaryError | undefined, result: CloudinaryUploadResult | undefined) => {
        if (error) {
          reject(new Error(error.message))
        } else if (!result) {
          reject(new Error('No result from Cloudinary'))
        } else {
          resolve(result)
        }
      }
    )
    uploadStream.end(buffer)
  })
}

// Zod schemas for validation
const specieSchema = z.object({
  specieName: z.string().min(1, 'Species name is required'),
})

const updateSpecieSchema = z.object({
  specieName: z.string().min(1, 'Species name is required').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const specieName = formData.get('specieName') as string
    const imageFile = formData.get('image') as File | null

    // Validate input
    const validation = specieSchema.safeParse({ specieName })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Convert file to buffer for Cloudinary upload
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(buffer)

    // Create species and image records in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the species first
      const species = await prisma.species.create({
        data: {
          specieName: validation.data.specieName,
        },
      })

      // Then create the associated image
      const specieImage = await prisma.specieImage.create({
        data: {
          url: uploadResult.secure_url,
          alt: validation.data.specieName,
          publicId: uploadResult.public_id,
          speciesId: species.id,
        },
      })

      return { species, specieImage }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating species:', error)
    return NextResponse.json(
      { error: 'Failed to create species' },
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
        { error: 'Species ID is required' },
        { status: 400 }
      )
    }

    const speciesId = parseInt(id)
    if (isNaN(speciesId)) {
      return NextResponse.json(
        { error: 'Invalid species ID' },
        { status: 400 }
      )
    }

    // Find the species with its image
    const species = await prisma.species.findUnique({
      where: { id: speciesId },
      include: { image: true },
    })

    if (!species) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      )
    }

    // Delete image from Cloudinary if it exists
    if (species.image) {
      try {
        await cloudinary.uploader.destroy(species.image.publicId)
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete the species (image will be deleted due to onDelete: Cascade)
    await prisma.species.delete({
      where: { id: speciesId },
    })

    return NextResponse.json(
      { message: 'Species deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting species:', error)
    return NextResponse.json(
      { error: 'Failed to delete species' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.species.findMany({
      where: {
        specieName: { contains: search },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
      include: {
        image: true,
      },
    }),
    prisma.species.count({
      where: {
        specieName: { contains: search },
      },
    }),
  ]);

  return NextResponse.json({
    data: items,
    total,
    page,
    lastSubmittedAt: items.length > 0 ? items[items.length - 1].createdAt ?? null : null,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const specieName = formData.get('specieName') as string | null
    const imageFile = formData.get('image') as File | null

    if (!id) {
      return NextResponse.json(
        { error: 'Species ID is required' },
        { status: 400 }
      )
    }

    const speciesId = parseInt(id)
    if (isNaN(speciesId)) {
      return NextResponse.json(
        { error: 'Invalid species ID' },
        { status: 400 }
      )
    }

    // Validate input if specieName is provided
    if (specieName) {
      const validation = updateSpecieSchema.safeParse({ specieName })
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }
    }

    // Find the existing species with its image
    const existingSpecies = await prisma.species.findUnique({
      where: { id: speciesId },
      include: { image: true },
    })

    if (!existingSpecies) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      )
    }

    let newImageData = null
    let oldPublicId = null

    // Handle image update if new image is provided
    if (imageFile) {
      // Delete old image from Cloudinary if it exists
      if (existingSpecies.image) {
        oldPublicId = existingSpecies.image.publicId
        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error)
          // Continue with new image upload even if old image deletion fails
        }
      }

      // Upload new image to Cloudinary
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadResult = await uploadImageToCloudinary(buffer)

      newImageData = {
        url: uploadResult.secure_url,
        alt: specieName || existingSpecies.specieName,
        publicId: uploadResult.public_id,
      }
    }

    // Update species and image in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update the species
      const updatedSpecies = await prisma.species.update({
        where: { id: speciesId },
        data: {
          specieName: specieName || existingSpecies.specieName,
        },
      })

      // Update or create the image if new image was provided
      if (newImageData) {
        if (existingSpecies.image) {
          await prisma.specieImage.update({
            where: { speciesId },
            data: newImageData,
          })
        } else {
          await prisma.specieImage.create({
            data: {
              ...newImageData,
              speciesId,
            },
          })
        }
      } else if (specieName && existingSpecies.image) {
        // Update alt text if only specieName changed
        await prisma.specieImage.update({
          where: { speciesId },
          data: {
            alt: specieName,
          },
        })
      }

      return updatedSpecies
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error updating species:', error)
    return NextResponse.json(
      { error: 'Failed to update species' },
      { status: 500 }
    )
  }
}