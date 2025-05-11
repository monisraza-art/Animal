"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
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
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";

interface VendourType {
  id: number;
  vendourType: string;
  createdAt: string;
}

export default function VendourTypesPage() {
  const [vendourTypes, setVendourTypes] = useState<VendourType[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "vendourType">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null);

  const [newVendourType, setNewVendourType] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editVendourType, setEditVendourType] = useState("");
  const [open, setOpen] = useState(false);

  const fetchVendourTypes = useCallback(async () => {
    try {
      const res = await axios.get("/api/vendourType", {
        params: { search, sortBy, sortOrder, page, limit },
      });
      setVendourTypes(res.data.data);
      setTotal(res.data.total);
      setLastCreatedAt(res.data.lastSubmittedAt);
    } catch (error) {
        console.log(error)
      toast.error("Failed to fetch vendour types");
    }
  }, [search, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchVendourTypes();
  }, [fetchVendourTypes]);

  const handleCreate = async () => {
    if (!newVendourType.trim()) return;
    
    try {
      await axios.post("/api/vendourType", { vendourType: newVendourType });
      toast.success("Vendour type created");
      setNewVendourType("");
      fetchVendourTypes();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error("Vendour type must be unique");
      } else {
        toast.error("Failed to create vendour type");
      }
    }
  };

  const handleUpdate = async () => {
    if (editId === null || !editVendourType.trim()) return;
    
    try {
      await axios.put("/api/vendourType", { 
        id: editId, 
        vendourType: editVendourType 
      });
      toast.success("Vendour type updated");
      setOpen(false);
      fetchVendourTypes();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error("Vendour type must be unique");
      } else {
        toast.error("Failed to update vendour type");
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete("/api/vendourType", { params: { id } });
      toast.error("Vendour type deleted");
      fetchVendourTypes();
    } catch (error) {
        console.log(error)
      toast.error("Failed to delete vendour type");
    }
  };

  const toggleSort = (key: "id" | "vendourType") => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return (
    <Suspense fallback={<TableSkeleton />}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-green-500">Vendour Types</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search vendour type..."
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
                  <TableHead onClick={() => toggleSort("id")} className="cursor-pointer">
                    ID <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => toggleSort("vendourType")} className="cursor-pointer">
                    Vendour Type <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendourTypes.map((type, idx) => (
                  <TableRow key={type.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>{type.vendourType}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(type.id);
                          setEditVendourType(type.vendourType);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-between items-center text-sm">
              <p className="text-muted-foreground">Total entries: {total}</p>
              <span>
                {lastCreatedAt !== null
                  ? `Last entry submitted ${formatDistanceToNow(new Date(lastCreatedAt))} ago`
                  : "No entries yet"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Prev
                </Button>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? "default" : "outline"}
                    onClick={() => setPage(p)}
                    className={p === page ? "bg-green-500 text-white" : ""}
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

          <div className="bg-muted w-60 h-52 p-4 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold">Add Vendour Type</h2>
            <Input
              value={newVendourType}
              onChange={(e) => setNewVendourType(e.target.value)}
              placeholder="Vendour type"
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
              <DialogTitle>Edit Vendour Type</DialogTitle>
            </DialogHeader>
            <Input
              value={editVendourType}
              onChange={(e) => setEditVendourType(e.target.value)}
              className="focus:ring-green-500"
            />
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-green-500 hover:bg-green-600" onClick={handleUpdate}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}