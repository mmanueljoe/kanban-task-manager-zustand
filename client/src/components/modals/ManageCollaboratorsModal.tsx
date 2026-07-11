import { useState } from "react";
import type { CollaboratorRole } from "@kanban/shared";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Dropdown } from "@components/ui/Dropdown";
import { Input } from "@components/ui/Input";
import iconCross from "@assets/icon-cross.svg";
import { useMe } from "@hooks/useAuthQueries";
import {
  useMembers,
  useInviteCollaborator,
  useChangeMemberRole,
  useRemoveMember,
  useTransferOwnership,
} from "@hooks/useCollaboratorQueries";
import { useUi } from "@/hooks/useUi";
import { ApiError } from "@/lib/api";

type ManageCollaboratorsModalProps = {
  open: boolean;
  onClose: () => void;
  boardId: string;
};

const ROLE_OPTIONS = [
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

export function ManageCollaboratorsModal({
  open,
  onClose,
  boardId,
}: ManageCollaboratorsModalProps) {
  const { data: me } = useMe();
  const { data: members = [], isPending } = useMembers(boardId);
  const invite = useInviteCollaborator(boardId);
  const changeRole = useChangeMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);
  const transfer = useTransferOwnership(boardId);
  const { showToast } = useUi();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("EDITOR");

  const owner = members.find((m) => m.role === "OWNER");
  const isOwner = Boolean(me && owner && me.id === owner.userId);

  const inviteError =
    invite.error instanceof ApiError ? invite.error.message : undefined;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Collaborator added" });
          setEmail("");
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Manage collaborators">
      <h2 className="app-modal-title">Board Members</h2>

      <div className="app-modal-section">
        {isPending ? (
          <p className="body-m">Loading members…</p>
        ) : (
          <div className="app-modal-subtasks-list">
            {members.map((member) => (
              <div key={member.userId} className="app-member-row">
                <div className="app-member-identity">
                  <span className="body-m app-member-name">{member.name}</span>
                  <span className="body-s app-member-email">
                    {member.email}
                  </span>
                </div>
                {member.role === "OWNER" ? (
                  <span className="app-member-owner-badge">Owner</span>
                ) : isOwner ? (
                  <div className="app-member-controls">
                    <Dropdown
                      options={ROLE_OPTIONS}
                      value={member.role}
                      onChange={(next) =>
                        changeRole.mutate({
                          userId: member.userId,
                          role: next as CollaboratorRole,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="app-link-button"
                      onClick={() => transfer.mutate(member.userId)}
                    >
                      Make owner
                    </button>
                    <button
                      type="button"
                      className="app-icon-button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() => removeMember.mutate(member.userId)}
                    >
                      <img src={iconCross} alt="" width={14} height={14} />
                    </button>
                  </div>
                ) : (
                  <span className="body-s app-member-role">
                    {member.role === "EDITOR" ? "Editor" : "Viewer"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && (
        <form onSubmit={handleInvite} className="app-modal-section">
          <label className="input-label app-modal-sublist-label">
            Invite a collaborator
          </label>
          <div className="app-member-invite-row">
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={inviteError}
              required
            />
            <Dropdown
              options={ROLE_OPTIONS}
              value={role}
              onChange={(next) => setRole(next as CollaboratorRole)}
            />
          </div>
          <div className="app-modal-actions">
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={invite.isPending}
            >
              {invite.isPending ? "Inviting…" : "Invite"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
