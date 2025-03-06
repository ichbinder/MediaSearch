import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  UserPlus,
  Trash2,
  AlertTriangle,
  Key,
  Edit,
  CheckCircle,
  XCircle,
  Shield,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import type { SelectUser } from "@db/schema";

const userRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const userNameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
});

const userPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["user", "admin"]),
});

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const createForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "user" as const,
    },
  });

  const roleForm = useForm({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      role: "user" as const,
    },
  });

  const usernameForm = useForm({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      username: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(userPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created" });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof userRoleSchema>;
    }) => {
      const response = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
      roleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof userNameSchema>;
    }) => {
      const response = await fetch(`/api/admin/users/${id}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Username updated" });
      usernameForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof userPasswordSchema>;
    }) => {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: data.password }),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Password updated" });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: number;
      type: "active" | "approved";
    }) => {
      const endpoint =
        type === "active"
          ? `/api/admin/users/${id}/toggle-active`
          : `/api/admin/users/${id}/toggle-approved`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "An error occurred");
        } else {
          const text = await response.text();
          throw new Error(text || "An error occurred");
        }
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Error loading users</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit((data) =>
                  createUserMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!users?.length ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <UserPlus className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No users found</h2>
          <p className="text-muted-foreground">
            Create a new user to get started.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? "Administrator" : "User"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          user.is_approved
                            ? "text-green-500"
                            : "text-yellow-500"
                        }
                      >
                        {user.is_approved ? "Approved" : "Pending"}
                      </span>
                      <span
                        className={
                          user.is_active ? "text-green-500" : "text-red-500"
                        }
                      >
                        {user.is_active ? "Active" : "Locked"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "PP", { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {/* Change role */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Change user role"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change User Role</DialogTitle>
                          </DialogHeader>
                          <Form {...roleForm}>
                            <form
                              onSubmit={roleForm.handleSubmit((data) =>
                                updateRoleMutation.mutate({ id: user.id, data })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={roleForm.control}
                                name="role"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="user">
                                          User
                                        </SelectItem>
                                        <SelectItem value="admin">
                                          Administrator
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={updateRoleMutation.isPending}
                              >
                                {updateRoleMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Change username */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Change username"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Username</DialogTitle>
                          </DialogHeader>
                          <Form {...usernameForm}>
                            <form
                              onSubmit={usernameForm.handleSubmit((data) =>
                                updateUsernameMutation.mutate({
                                  id: user.id,
                                  data,
                                })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={usernameForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={updateUsernameMutation.isPending}
                              >
                                {updateUsernameMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Reset password */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                          </DialogHeader>
                          <Form {...passwordForm}>
                            <form
                              onSubmit={passwordForm.handleSubmit((data) =>
                                updatePasswordMutation.mutate({
                                  id: user.id,
                                  data,
                                })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={passwordForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={updatePasswordMutation.isPending}
                              >
                                {updatePasswordMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Lock/unlock user */}
                      <Button
                        variant="outline"
                        size="sm"
                        title={user.is_active ? "Lock user" : "Unlock user"}
                        onClick={() =>
                          toggleUserStatusMutation.mutate({
                            id: user.id,
                            type: "active",
                          })
                        }
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {toggleUserStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.is_active ? (
                          <Lock className="h-4 w-4 text-red-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-green-500" />
                        )}
                      </Button>

                      {/* Approve/revoke user */}
                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          user.is_approved ? "Revoke approval" : "Approve user"
                        }
                        onClick={() =>
                          toggleUserStatusMutation.mutate({
                            id: user.id,
                            type: "approved",
                          })
                        }
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {toggleUserStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.is_approved ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>

                      {/* Delete user */}
                      <Button
                        variant="destructive"
                        size="sm"
                        title="Delete user"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        {deleteUserMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
