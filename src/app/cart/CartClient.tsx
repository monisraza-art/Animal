'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProductImage {
  url: string
  alt: string
}

interface Product {
  id: number
  productName: string
  customerPrice: number
  image: ProductImage | null
}

interface CartItem {
  id: number
  quantity: number
  product: Product
}

interface CartClientProps {
  cartItems: CartItem[]
}

export default function CartClient({ cartItems }: CartClientProps) {
  const [cart, setCart] = useState<CartItem[]>(cartItems)

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return
    const res = await fetch('/api/cart/update', {
      method: 'POST',
      body: JSON.stringify({ id, quantity }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setCart(prev =>
        prev.map(item => item.id === id ? { ...item, quantity } : item)
      )
    }
  }

  const removeItem = async (id: number) => {
    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      setCart(prev => prev.filter(item => item.id !== id))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.product.customerPrice, 0)

  if (!cart.length) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg font-medium">Your cart is empty.</p>
        <Link href="/products">
          <Button className="mt-4 bg-green-500 hover:bg-green-600 text-white">
            Shop Now
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-green-600 mb-6">Your Shopping Cart</h1>

      <ul className="space-y-6">
        {cart.map(item => (
          <li key={item.id} className="flex flex-col sm:flex-row items-center sm:items-start bg-white shadow rounded-xl p-4 gap-4">
            <Image
  src={item.product.image?.url || '/placeholder.png'}
  alt={item.product.image?.alt || item.product.productName}
  width={100}
  height={100}
  className="rounded-md object-cover"
/>

            <div className="flex-1 w-full">
              <h2 className="text-lg font-semibold">{item.product.productName}</h2>
              <p className="text-sm text-gray-600">${item.product.customerPrice.toFixed(2)}</p>

              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm">Qty:</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  className="w-16 p-1 border rounded"
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                />
              </div>

              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-red-500 p-0 hover:underline text-sm h-auto"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-xl font-semibold">
          Subtotal: <span className="text-green-600">${subtotal.toFixed(2)}</span>
        </div>

        <div className="mt-4 sm:mt-0 flex gap-4">
          <Link href="/products">
            <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-100">
              Shop More
            </Button>
          </Link>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => alert('Checkout flow TBD')}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
