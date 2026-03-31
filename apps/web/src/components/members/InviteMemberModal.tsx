"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Modal, Input, Select, Button } from "@/components/ui";
import { useSendInvitation } from "@/hooks/useInvitations";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validators";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
}

export function InviteMemberModal({ open, onClose, slug }: InviteMemberModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: "MEMBER" },
  });

  const invite = useSendInvitation(slug);

  const onSubmit = async (data: InviteMemberInput) => {
    try {
      await invite.mutateAsync(data);
      reset();
      onClose();
    } catch {
      // error handled by mutation, keep modal open
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite member"
      description="Send an invitation by email."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="colleague@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Select
          label="Role"
          options={[
            { value: "ADMIN", label: "Admin" },
            { value: "MEMBER", label: "Member" },
            { value: "VIEWER", label: "Viewer" },
          ]}
          error={errors.role?.message}
          {...register("role")}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={invite.isPending}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
