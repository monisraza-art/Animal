"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import axios, { AxiosError } from "axios";
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

interface Specialization {
  id: number;
  specialization: string;
  createdAt: string;
}

interface ApiError {
  error?: string;
}

export default function SpecializationsPage() {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "specialization">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null);

  const [newSpecialization, setNewSpecialization] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editSpecialization, setEditSpecialization] = useState("");
  const [open, setOpen] = useState(false);

  const fetchSpecializations = useCallback(async () => {
    try {
      const res = await axios.get("/api/specialization", {
        params: { search, sortBy, sortOrder, page, limit },
      });
      setSpecializations(res.data.data);
      setTotal(res.data.total);
      setLastCreatedAt(res.data.lastSubmittedAt);
    } catch (error: unknown) {
        console.log(error)
      toast.error("Failed to fetch specializations");
    }
  }, [search, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  const handleCreate = async () => {
    if (!newSpecialization.trim()) return;
    try {
      await axios.post("/api/specialization", { specialization: newSpecialization });
      toast.success("Specialization created");
      setNewSpecialization("");
      fetchSpecializations();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.status === 400) {
        toast.error("Specialization must be unique");
      } else {
        toast.error("Failed to create specialization");
      }
    }
  };

  const handleUpdate = async () => {
    if (editId === null || !editSpecialization.trim()) return;
    try {
      await axios.put("/api/specialization", { id: editId, specialization: editSpecialization });
      toast.success("Specialization updated");
      setOpen(false);
      fetchSpecializations();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.status === 400) {
        toast.error("Specialization must be unique");
      } else {
        toast.error("Failed to update specialization");
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete("/api/specialization", { params: { id } });
      toast.error("Specialization deleted");
      fetchSpecializations();
    } catch (error: unknown) {
        console.log(error)
      toast.error("Failed to delete specialization");
    }
  };

  const toggleSort = (key: "id" | "specialization") => {
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
        <h1 className="text-2xl font-bold text-center text-green-500">Specializations</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search specialization..."
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
                  <TableHead onClick={() => toggleSort("specialization")} className="cursor-pointer">
                    Specialization <ArrowUpDown className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specializations.map((spec, idx) => (
                  <TableRow key={spec.id}>
                    <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                    <TableCell>{spec.specialization}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(spec.id);
                          setEditSpecialization(spec.specialization);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(spec.id)}
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
            <h2 className="text-lg font-semibold">Add Specialization</h2>
            <Input
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="Specialization name"
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
              <DialogTitle>Edit Specialization</DialogTitle>
            </DialogHeader>
            <Input
              value={editSpecialization}
              onChange={(e) => setEditSpecialization(e.target.value)}
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