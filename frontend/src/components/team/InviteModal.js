// frontend/src/components/team/InviteModal.js
import React, { useState } from "react";
import { Send, Clock } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FormField } from "../forms/FormField";
import { Input } from "../forms/Input";
import { Select } from "../forms/Select";
import { TextArea } from "../forms/TextArea";

export const InviteModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  user,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
    message: "",
    department: "",
    jobTitle: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      email: "",
      role: "user",
      message: "",
      department: "",
      jobTitle: "",
    });
    onClose();
  };

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "manager", label: "Manager" },
    ...(user?.role === "admin" ? [{ value: "admin", label: "Admin" }] : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email Address"
          required
          error={!formData.email ? "Email is required" : ""}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Enter email address"
            required
          />
        </FormField>

        <FormField label="Role" required>
          <Select
            value={formData.role}
            onChange={(e) => handleChange("role", e.target.value)}
            options={roleOptions}
          />
        </FormField>

        <FormField label="Job Title">
          <Input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => handleChange("jobTitle", e.target.value)}
            placeholder="e.g., Software Developer"
          />
        </FormField>

        <FormField label="Department">
          <Input
            type="text"
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="e.g., Engineering"
          />
        </FormField>

        <FormField label="Personal Message">
          <TextArea
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            rows={3}
            placeholder="Optional personal message to include in the invitation"
          />
        </FormField>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            <Clock className="inline h-4 w-4 mr-1" />
            Invitation will expire in 7 days
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.email}
            icon={loading ? undefined : Send}
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
