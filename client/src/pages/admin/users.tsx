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
import { Loader2, UserPlus, Trash2, AlertTriangle, Key, Edit, CheckCircle, XCircle, Shield, Lock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { queryClient } from "@/lib/queryClient";
import type { SelectUser } from "@db/schema";

const userRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const userNameSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
});

const userPasswordSchema = z.object({
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

const createUserSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  role: z.enum(["user", "admin"]),
});

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading, error } = useQuery<SelectUser[]>({
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
      toast({ title: "Benutzer erstellt" });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof userRoleSchema> }) => {
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
      toast({ title: "Benutzerrolle aktualisiert" });
      roleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof userNameSchema> }) => {
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
      toast({ title: "Benutzername aktualisiert" });
      usernameForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof userPasswordSchema> }) => {
      const response = await fetch(`/api/admin/users/${id}/password`, {
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
      toast({ title: "Passwort aktualisiert" });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: 'active' | 'approved' }) => {
      const response = await fetch(`/api/admin/users/${id}/toggle-${type}`, {
        method: "POST",
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
      toast({ title: "Benutzerstatus aktualisiert" });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Benutzer gelöscht" });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
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
          <h2 className="text-xl font-semibold">Fehler beim Laden der Benutzer</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
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
                      <FormLabel>Benutzername</FormLabel>
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
                      <FormLabel>Passwort</FormLabel>
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
                      <FormLabel>Rolle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wählen Sie eine Rolle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Benutzer</SelectItem>
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
                  Erstellen
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!users?.length ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <UserPlus className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Keine Benutzer gefunden</h2>
          <p className="text-muted-foreground">
            Erstellen Sie einen neuen Benutzer, um loszulegen.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Benutzername</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? "Administrator" : "Benutzer"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={user.is_approved ? "text-green-500" : "text-yellow-500"}>
                        {user.is_approved ? "Freigegeben" : "Wartend"}
                      </span>
                      <span className={user.is_active ? "text-green-500" : "text-red-500"}>
                        {user.is_active ? "Aktiv" : "Gesperrt"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "PP", { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {/* Rolle ändern */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Benutzerrolle ändern</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Benutzerrolle ändern</DialogTitle>
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
                                    <FormLabel>Rolle</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={user.role}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Wählen Sie eine Rolle" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="user">Benutzer</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full">
                                Speichern
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Benutzernamen ändern */}
                      <Dialog>
                        <DialogTrigger asChild>
                         <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Benutzernamen ändern</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Benutzernamen ändern</DialogTitle>
                          </DialogHeader>
                          <Form {...usernameForm}>
                            <form
                              onSubmit={usernameForm.handleSubmit((data) =>
                                updateUsernameMutation.mutate({ id: user.id, data })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={usernameForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Benutzername</FormLabel>
                                    <FormControl>
                                      <Input {...field} defaultValue={user.username} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full">
                                Speichern
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Passwort ändern */}
                      <Dialog>
                        <DialogTrigger asChild>
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Key className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Passwort zurücksetzen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Passwort ändern</DialogTitle>
                          </DialogHeader>
                          <Form {...passwordForm}>
                            <form
                              onSubmit={passwordForm.handleSubmit((data) =>
                                updatePasswordMutation.mutate({ id: user.id, data })
                              )}
                              className="space-y-4"
                            >
                              <FormField
                                control={passwordForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Neues Passwort</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full">
                                Speichern
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      {/* Benutzer sperren/entsperren */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserStatusMutation.mutate({ id: user.id, type: 'active' })}
                            >
                              {user.is_active ? (
                                <Lock className="h-4 w-4 text-red-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.is_active ? 'Benutzer sperren' : 'Benutzer entsperren'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Benutzer freigeben/zurückziehen */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserStatusMutation.mutate({ id: user.id, type: 'approved' })}
                            >
                              {user.is_approved ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.is_approved ? 'Freigabe zurückziehen' : 'Benutzer freigeben'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Benutzer löschen */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Benutzer löschen</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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