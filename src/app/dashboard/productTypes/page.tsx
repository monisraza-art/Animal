// app/(admin)/product-type/page.tsx

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import TableSkeleton from "@/components/skeletons/TableSkeleton";

interface ProductType {
  id: number;
  type: string;
  createdAt: string;
}

export default function ProductTypePage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "type">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editType, setEditType] = useState("");
  const [open, setOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await axios.get("/api/product-type", {
      params: { search, sortBy, sortOrder, page, limit },
    });
    setProductTypes(res.data.data);
    setTotal(res.data.total);
    setLastCreatedAt(res.data.lastSubmittedAt);
  }, [search, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newType.trim()) return;
    await axios.post("/api/product-type", { type: newType });
    toast.success("Product type created");
    setNewType("");
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await axios.delete("/api/product-type", { params: { id } });
    toast.error("Product type deleted");
    fetchData();
  };

  const handleUpdate = async () => {
    if (editId === null || !editType.trim()) return;
    await axios.put("/api/product-type", { id: editId, type: editType });
    toast.success("Product type updated");
    setOpen(false);
    fetchData();
  };

  const toggleSort = (key: "id" | "type") => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };
  
  
  return (
    <Suspense fallback={<TableSkeleton />}>
      
    <div>
      <div className="p-6 md:w-6xl space-y-6">
        <h1 className="text-2xl font-bold text-center text-green-500">
          Product Type
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <
              Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:ring-green-500"
            />
            <span>Show </span>
            <Select
              value={String(limit)}
              onValueChange={(v) => setLimit(Number(v))}
            >
              <span>entries</span>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full overflow-visible">
          <div className="md:col-span-2 overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => toggleSort("id")}
                    className="cursor-pointer"
                  >
                    ID <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead
                    onClick={() => toggleSort("type")}
                    className="cursor-pointer"
                  >
                    Name <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTypes.map((pt, idx) => (
                  <TableRow key={pt.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>{pt.type}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(pt.id);
                          setEditType(pt.type);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(pt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-between items-center text-sm">
              <p className="text-sm text-muted-foreground">
                Total entries: {total}
              </p>

              <span>
                {lastCreatedAt
                  ? `Last entry submitted ${formatDistanceToNow(
                      new Date(lastCreatedAt)
                    )} ago`
                  : "No entries yet"}
              </span>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Prev
                  </Button>

                  {Array.from(
                    { length: Math.ceil(total / limit) },
                    (_, i) => i + 1
                  ).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === page ? "default" : "outline"}
                      onClick={() => setPage(p)}
                      className={
                        p === page
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : ""
                      }
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
          </div>

          <div className="bg-muted w-60 h-52 p-4 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold">Add Product Type</h2>
            <Input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Type name"
              className="focus:ring-green-500"
            />
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={handleCreate}
            >
              Add
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product Type</DialogTitle>
            </DialogHeader>
            <Input
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="focus:ring-green-500"
            />
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600"
                onClick={handleUpdate}
              >
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </Suspense>
  );
}
