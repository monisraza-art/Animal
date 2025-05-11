import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const specializationSchema = z.object({
  specialization: z.string().min(1, "Specialization is required"),
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
    prisma.specialization.findMany({
      where: {
        specialization: { contains: search },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.specialization.count({
      where: {
        specialization: { contains: search },
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
    const result = specializationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const newSpecialization = await prisma.specialization.create({
      data: { specialization: result.data.specialization },
    })

    return NextResponse.json(newSpecialization, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create specialization" },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { id, specialization } = await req.json()

    if (!id || !specialization) {
      return NextResponse.json(
        { error: "ID and specialization are required" },
        { status: 400 },
      )
    }

    const updated = await prisma.specialization.update({
      where: { id },
      data: { specialization },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update specialization" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get("id") || "", 10)
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.specialization.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to delete specialization" },
      { status: 500 },
    )
  }
}