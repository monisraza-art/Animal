import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const vendourTypeSchema = z.object({
  vendourType: z.string().min(1, "Vendour type is required"),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const sortBy = searchParams.get("sortBy") || "id"
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc"
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.vendourType.findMany({
      where: {
        vendourType: { contains: search },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.vendourType.count({
      where: {
        vendourType: { contains: search },
      },
    }),
  ])

  return NextResponse.json({
    data: items,
    total,
    page,
    lastSubmittedAt: items.length > 0 ? items[items.length - 1].createdAt ?? null : null,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = vendourTypeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const newVendourType = await prisma.vendourType.create({
      data: { vendourType: result.data.vendourType },
    })

    return NextResponse.json(newVendourType, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create vendour type" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { id, vendourType } = await req.json()

    if (!id || !vendourType) {
      return NextResponse.json(
        { error: "ID and vendourType are required" },
        { status: 400 }
      )
    }

    const updated = await prisma.vendourType.update({
      where: { id },
      data: { vendourType },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update vendour type" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get("id") || "", 10)
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.vendourType.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to delete vendour type" },
      { status: 500 }
    )
  }
}