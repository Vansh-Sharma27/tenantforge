"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Modal, Input, Button } from "@/components/ui";
import { useCreateWorkspace } from "@/hooks/useWorkspaces";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/lib/validators";

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ open, onClose }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const create = useCreateWorkspace();

  const onSubmit = async (data: CreateWorkspaceInput) => {
    try {
      const result = await create.mutateAsync(data);
      reset();
      onClose();
      if (result?.slug) {
        router.push(`/w/${result.slug}`);
      }
    } catch {
      // error handled by mutation, keep modal open
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create workspace"
      description="A workspace is a shared space for your team."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Workspace name"
          placeholder="My Company"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Slug (optional)"
          placeholder="my-company"
          hint="URL-friendly identifier. Auto-generated if left empty."
          error={errors.slug?.message}
          {...register("slug")}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
