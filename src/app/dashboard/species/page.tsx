'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react'
import TableSkeleton from '@/components/skeletons/TableSkeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Specie {
  id: number
  specieName: string
  image: { url: string; alt: string; publicId: string | null } | null
  createdAt: string
}

export default function SpeciesPage() {
  const [species, setSpecies] = useState<Specie[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'id' | 'specieName'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null)

  const [newSpeciesName, setNewSpeciesName] = useState('')
  const [newSpeciesImage, setNewSpeciesImage] = useState<File | null>(null)
  const [newSpeciesImagePreview, setNewSpeciesImagePreview] = useState<string | null>(null)

  const [editId, setEditId] = useState<number | null>(null)
  const [editSpeciesName, setEditSpeciesName] = useState('')
  const [editSpeciesImage, setEditSpeciesImage] = useState<File | null>(null)
  const [editSpeciesImagePreview, setEditSpeciesImagePreview] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const fetchSpecies = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/species', {
        params: { search, sortBy, sortOrder, page, limit },
      })
      setSpecies(data.data)
      setTotal(data.total)
      setLastCreatedAt(data.lastSubmittedAt)
    } catch (error) {
      console.log(error)
      toast.error('Failed to fetch species')
    }
  }, [search, sortBy, sortOrder, page, limit])

  useEffect(() => {
    fetchSpecies()
  }, [fetchSpecies])

 
  const handleCreate = async () => {
    if (!newSpeciesName.trim() || !newSpeciesImage) {
      return toast.error('Name and image are required')
    }

    setIsCreating(true)
    try {
      const formData = new FormData()
      formData.append('specieName', newSpeciesName)
      formData.append('image', newSpeciesImage)

      await axios.post('/api/species', formData)
      toast.success('Species created')
      setNewSpeciesName('')
      setNewSpeciesImage(null)
      setNewSpeciesImagePreview(null)
      fetchSpecies()
    } catch {
      toast.error('Failed to create species')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!editId) return

    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append('id', editId.toString())
      formData.append('specieName', editSpeciesName)
      if (editSpeciesImage) formData.append('image', editSpeciesImage)

      await axios.put('/api/species', formData)
      toast.success('Species updated')
      setOpen(false)
      fetchSpecies()
    } catch {
      toast.error('Failed to update species')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    setIsDeleting(id)
    try {
      await axios.delete('/api/species', { params: { id } })
      toast.error('Species deleted')
      fetchSpecies()
    } catch {
      toast.error('Failed to delete species')
    } finally {
      setIsDeleting(null)
    }
  }

  const toggleSort = (key: 'id' | 'specieName') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('asc')
    }
  }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-green-500">Species</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search species..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:ring-green-500"
            />
            <span>Show</span>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full overflow-visible">
          <div className="md:col-span-2 overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort('id')} className="cursor-pointer">
                    ID <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead onClick={() => toggleSort('specieName')} className="cursor-pointer">
                    Species Name <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {species.map((specie, idx) => (
                  <TableRow key={specie.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>
                      {specie.image && (
                        <Image
                          src={specie.image.url}
                          alt={specie.image.alt}
                          width={50}
                          height={50}
                          className="rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell>{specie.specieName}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(specie.id)
                          setEditSpeciesName(specie.specieName)
                          setEditSpeciesImagePreview(specie.image?.url || null)
                          setOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(specie.id)}
          disabled={isDeleting === specie.id}
        >
          {isDeleting === specie.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-between items-center text-sm">
              <p className="text-muted-foreground">Total entries: {total}</p>
              <span>
                {lastCreatedAt
                  ? `Last entry submitted ${formatDistanceToNow(
                      new Date(lastCreatedAt)
                    )} ago`
                  : 'No entries yet'}
              </span>
              <div className="flex gap-2">
                <Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Prev
                </Button>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? 'default' : 'outline'}
                    onClick={() => setPage(p)}
                    className={p === page ? 'bg-green-500 text-white' : ''}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-muted w-60 h-72 p-4 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold">Add Species</h2>
            <Input
              value={newSpeciesName}
              onChange={(e) => setNewSpeciesName(e.target.value)}
              placeholder="Species name"
              className="focus:ring-green-500"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setNewSpeciesImage(file)
                if (file) setNewSpeciesImagePreview(URL.createObjectURL(file))
              }}
            />
            {newSpeciesImagePreview && (
              <Image
                src={newSpeciesImagePreview}
                alt="Preview"
                width={100}
                height={100}
                className="rounded"
              />
            )}
            <Button
          className="w-full bg-green-500 hover:bg-green-600"
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add'
          )}
        </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Species</DialogTitle>
            </DialogHeader>
            <Input
              value={editSpeciesName}
              onChange={(e) => setEditSpeciesName(e.target.value)}
              className="focus:ring-green-500 mb-4"
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setEditSpeciesImage(file)
                if (file) setEditSpeciesImagePreview(URL.createObjectURL(file))
              }}
              className="mb-4"
            />
            {editSpeciesImagePreview && (
              <Image
                src={editSpeciesImagePreview}
                alt="Preview"
                width={100}
                height={100}
                className="rounded mb-4"
              />
            )}
            <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancel
          </Button>
              <Button 
            className="bg-green-500 hover:bg-green-600" 
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  )
}