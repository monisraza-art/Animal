import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { v2 as cloudinary } from 'cloudinary'

// Strongly type Redis responses
type RedisChunk = string

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Validate all required fields exist
    const chunk = formData.get('chunk')
    const uploadId = formData.get('uploadId')
    const chunkIndex = formData.get('chunkIndex')
    const totalChunks = formData.get('totalChunks')
    const fileType = formData.get('fileType')
    const fileName = formData.get('fileName')

    if (!chunk || !uploadId || !chunkIndex || !totalChunks || !fileType || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert chunk to Buffer
    const chunkBuffer = Buffer.from(await (chunk as Blob).arrayBuffer())

    // Store chunk in Redis (explicitly typed)
    await redis.rpush(
      `uploads:${uploadId.toString()}`,
      chunkBuffer.toString('base64')
    )

    // Check if all chunks received (explicit number conversion)
    const receivedChunks = await redis.llen(`uploads:${uploadId.toString()}`)
    if (receivedChunks === Number(totalChunks)) {
      // Get all chunks with proper typing
      const base64Chunks = await redis.lrange(`uploads:${uploadId.toString()}`, 0, -1) as RedisChunk[]

      if (!base64Chunks || !Array.isArray(base64Chunks)) {
        throw new Error('Invalid chunks data from Redis')
      }

      // Convert chunks to Buffers with type safety
      const buffers = base64Chunks.map((chunk: string) => {
        if (typeof chunk !== 'string') {
          throw new Error('Invalid chunk format')
        }
        return Buffer.from(chunk, 'base64')
      })

      const fullBuffer = Buffer.concat(buffers)

      // Upload to Cloudinary with proper typing
      const cloudinaryResult = await cloudinary.uploader.upload(
        `data:application/octet-stream;base64,${fullBuffer.toString('base64')}`,
        {
          folder: `products/${fileType.toString()}s`,
          resource_type: fileType.toString() === 'pdf' ? 'raw' : 'image'
        }
      )

      // Cleanup
      await redis.del(`uploads:${uploadId.toString()}`)

      return NextResponse.json({
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id
      })
    }

    return NextResponse.json({ status: 'chunk-received' })
  } catch (error) {
    console.error('Chunk upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process chunk' },
      { status: 500 }
    )
  }
}