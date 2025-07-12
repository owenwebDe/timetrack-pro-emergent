// frontend/src/components/team/BulkInviteModal.js
import React, { useState } from "react";
import { Plus, Send, Trash2, AlertCircle } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FormField } from "../forms/FormField";
import { Input } from "../forms/Input";
import { Select } from "../forms/Select";
import { TextArea } from "../forms/TextArea";

export const BulkInviteModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  user,
}) => {
  const [formData, setFormData] = useState({
    invitations: [{ email: "", role: "user" }],
    defaultMessage: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const validInvitations = formData.invitations.filter((inv) =>
      inv.email.trim()
    );

    if (validInvitations.length === 0) {
      alert("Please add at least one valid email address");
      return;
    }

    if (onSubmit) {
      onSubmit({
        invitations: validInvitations,
        defaultMessage: formData.defaultMessage,
      });
    }
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      invitations: [{ email: "", role: "user" }],
      defaultMessage: "",
    });
    onClose();
  };

  const addInviteRow = () => {
    setFormData((prev) => ({
      ...prev,
      invitations: [...prev.invitations, { email: "", role: "user" }],
    }));
  };

  const removeInviteRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      invitations: prev.invitations.filter((_, i) => i !== index),
    }));
  };

  const updateInviteRow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      invitations: prev.invitations.map((inv, i) =>
        i === index ? { ...inv, [field]: value } : inv
      ),
    }));
  };

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "manager", label: "Manager" },
    ...(user?.role === "admin" ? [{ value: "admin", label: "Admin" }] : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Invite Team Members"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Default Message">
          <TextArea
            value={formData.defaultMessage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                defaultMessage: e.target.value,
              }))
            }
            rows={2}
            placeholder="Optional message for all invitations"
          />
        </FormField>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Team Members
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addInviteRow}
              icon={Plus}
            >
              Add Row
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {formData.invitations.map((invitation, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  type="email"
                  value={invitation.email}
                  onChange={(e) =>
                    updateInviteRow(index, "email", e.target.value)
                  }
                  placeholder="Email address"
                  className="flex-1"
                />
                <Select
                  value={invitation.role}
                  onChange={(e) =>
                    updateInviteRow(index, "role", e.target.value)
                  }
                  options={roleOptions}
                  className="min-w-[120px]"
                />
                {formData.invitations.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeInviteRow(index)}
                    icon={Trash2}
                    className="px-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            All invitations will expire in 7 days. Only valid email addresses
            will be processed.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={formData.invitations.every((inv) => !inv.email.trim())}
            icon={loading ? undefined : Send}
          >
            {loading ? "Sending..." : "Send Invitations"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
