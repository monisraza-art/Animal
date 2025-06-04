// app/product/[id]/page.tsx

import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddToCartClientWrapper from '@/components/AddToCartClientWrapper'



interface ProductPageProps {
  params: {
    id: string
  }
}

interface Product {
  id: number
  productName: string
  genericName: string | null
  category: string
  subCategory: string
  subsubCategory: string
  productType: string
  companyPrice: number | null
  dealerPrice: number | null
  customerPrice: number
  packingUnit: string
  description: string | null
  dosage: string | null
  isFeatured: boolean
  isActive: boolean
  image: { url: string; alt: string } | null
  pdf: { url: string } | null
  company: { companyName: string }
  partner: { partnerName: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/product/${params.id}`)

  if (!res.ok) return notFound()

  const { data }: { data: Product } = await res.json()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image Section */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {data.image ? (
              <Image
                src={data.image.url}
                alt={data.image.alt || data.productName}
                width={600}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            ) : (
              <div className="bg-gray-100 aspect-square flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="md:w-1/2">
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex gap-2">
              {data.isFeatured && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Featured
                </span>
              )}
              {!data.isActive && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900">{data.productName}</h1>
            
            {data.genericName && (
              <p className="text-gray-600">Generic: {data.genericName}</p>
            )}

            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-green-600">${data.customerPrice.toFixed(2)}</p>
              {data.dealerPrice && (
                <p className="text-sm text-gray-500 line-through">Dealer: ${data.dealerPrice.toFixed(2)}</p>
              )}
            </div>

            <div className="py-4 border-t border-b border-gray-200">
              <p className="text-gray-700">{data.description}</p>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-500">Category</p>
                <p>{data.category}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Sub Category</p>
                <p>{data.subCategory}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Product Type</p>
                <p>{data.productType}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Packing Unit</p>
                <p>{data.packingUnit}</p>
              </div>
            </div>

            {data.dosage && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">Dosage Information</h3>
                <p className="text-green-700 mt-1">{data.dosage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
             
            {data.isActive && (
  <AddToCartClientWrapper productId={data.id} isActive={data.isActive} />
)}

            </div>

            {/* Company & Partner Info */}
            <div className="pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-500">Manufacturer</p>
                <p>{data.company.companyName}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Supplier</p>
                <p>{data.partner.partnerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Section */}
   {data.pdf && (
  <div className="mt-12 bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Documents</h2>
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
     
      <div>
        <p className="font-medium">Product Information PDF</p>
        <a
          href={data.pdf.url}
          download={`${data.productName.replace(/\s+/g, '_')}_product_sheet.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 mt-1"
        >
          <span>Download PDF</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    </div>
  </div>
)}
      {/* Product Categories */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium text-gray-500">Category</p>
          <p className="mt-1">{data.category}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium text-gray-500">Sub Category</p>
          <p className="mt-1">{data.subCategory}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="font-medium text-gray-500">Sub-Sub Category</p>
          <p className="mt-1">{data.subsubCategory}</p>
        </div>
      </div>
    </div>
  )
}