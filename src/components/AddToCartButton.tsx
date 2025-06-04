'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface AddToCartButtonProps {
  productId: number
  isActive: boolean
}

export default function AddToCartButton({ productId, isActive }: AddToCartButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleAddToCart = async () => {
    if (!session?.user) {
      toast.error('Please login to add items to your cart.')
      return
    }

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (res.ok) {
        toast.success('Product added to cart.')
        router.refresh() // Optional: to reflect state change
      } else {
        const err = await res.json()
        toast.error(err.message || 'Error adding to cart')
      }
    } catch (error) {
        console.error('Error adding to cart:', error)
      toast.error('Something went wrong.')
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={!isActive}
      className="flex-1 bg-white border border-green-500 text-green-500 hover:bg-green-50 py-3 px-6 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Add to Cart
    </button>
  )
}
