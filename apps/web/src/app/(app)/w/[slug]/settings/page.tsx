"use client";

import type { Role } from "@tenantforge/shared";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Input, Button, Modal } from "@/components/ui";
import { useTransferOwnership, useMembers } from "@/hooks/useMembers";
import { useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/useWorkspaces";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const role = currentWorkspace?.membership?.role as Role;
  const isOwner = role === "OWNER";

  // Edit workspace name
  const { register, handleSubmit } = useForm({
    defaultValues: { name: currentWorkspace?.name || "" },
  });
  const update = useUpdateWorkspace(slug);

  // Delete workspace
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const deleteWorkspace = useDeleteWorkspace(slug);

  // Transfer ownership
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferPassword, setTransferPassword] = useState("");
  const transfer = useTransferOwnership(slug);
  const { data: membersData } = useMembers(slug, { page: 1 });
  const members = membersData?.data || [];

  return (
    <div>
      <PageHeader title="Settings" description="Manage workspace configuration" />

      {/* General */}
      <Card className="mb-8">
        <h3 className="text-subtitle text-black mb-4">General</h3>
        <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
          <Input label="Workspace Name" {...register("name")} />
          <div>
            <label className="block text-small font-medium text-gray-900 mb-1.5">Slug</label>
            <p className="text-body text-gray-500">/{currentWorkspace?.slug}</p>
            <p className="text-xs text-gray-400 mt-1">Slugs cannot be changed after creation.</p>
          </div>
          <div className="pt-2">
            <Button type="submit" loading={update.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-red-200">
          <h3 className="text-subtitle text-red-600 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            {/* Transfer Ownership */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-small font-medium text-gray-900">Transfer Ownership</p>
                <p className="text-xs text-gray-500">
                  Transfer this workspace to another member. You will become an Admin.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowTransfer(true)}>
                Transfer
              </Button>
            </div>

            {/* Delete Workspace */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-small font-medium text-gray-900">Delete Workspace</p>
                <p className="text-xs text-gray-500">
                  Permanently delete this workspace and all its data. This cannot be undone.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteConfirm("");
          setDeletePassword("");
        }}
        title="Delete workspace"
        description={`Type "${currentWorkspace?.name}" to confirm. This action is irreversible.`}
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Workspace name"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={currentWorkspace?.name}
          />
          <Input
            label="Your password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDelete(false);
                setDeleteConfirm("");
                setDeletePassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirm !== currentWorkspace?.name}
              loading={deleteWorkspace.isPending}
              onClick={async () => {
                await deleteWorkspace.mutateAsync(deletePassword);
                router.replace("/dashboard");
              }}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        open={showTransfer}
        onClose={() => {
          setShowTransfer(false);
          setTransferTarget("");
          setTransferPassword("");
        }}
        title="Transfer ownership"
        description="Select a member to become the new owner."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-small font-medium text-gray-900 mb-1.5">New Owner</label>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-body cursor-pointer focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a member</option>
              {members
                .filter(
                  (m: Record<string, unknown>) =>
                    (m.user as Record<string, unknown>)?.id !== user?.id && m.role !== "OWNER"
                )
                .map((m: Record<string, unknown>) => (
                  <option
                    key={m.id as string}
                    value={(m.user as Record<string, unknown>)?.id as string}
                  >
                    {((m.user as Record<string, unknown>)?.name as string) ||
                      ((m.user as Record<string, unknown>)?.email as string)}{" "}
                    ({m.role as string})
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Your password"
            type="password"
            value={transferPassword}
            onChange={(e) => setTransferPassword(e.target.value)}
            placeholder="Confirm with your password"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowTransfer(false);
                setTransferTarget("");
                setTransferPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!transferTarget || !transferPassword}
              loading={transfer.isPending}
              onClick={async () => {
                await transfer.mutateAsync({
                  targetUserId: transferTarget,
                  password: transferPassword,
                });
                setShowTransfer(false);
                setTransferTarget("");
                setTransferPassword("");
              }}
            >
              Transfer Ownership
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
