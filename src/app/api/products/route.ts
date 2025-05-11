// app/api/products/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, genericName, customerPrice, description } = body

    const product = await prisma.product.create({
      data: {
        name,
        genericName,
        customerPrice: parseFloat(customerPrice),
        description,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
