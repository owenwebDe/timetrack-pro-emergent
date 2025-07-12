// frontend/src/components/projects/CreateProjectModal.js - Project creation modal component
import React, { useState } from "react";
import { projectsAPI } from "../../api/client";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FormField } from "../forms/FormField";
import { Input } from "../forms/Input";
import { TextArea } from "../forms/TextArea";

export const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    budget: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!formData.client.trim()) {
      newErrors.client = "Client name is required";
    }

    if (!formData.budget || parseFloat(formData.budget) < 0) {
      newErrors.budget = "Budget must be a positive number";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) <= new Date(formData.startDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        name: formData.name.trim(),
        client: formData.client.trim(),
        budget: parseFloat(formData.budget),
        description: formData.description.trim() || "",
        status: "active",
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        members: [],
        tags: [],
        priority: "medium",
        currency: "USD",
        color: "#3B82F6",
        settings: {
          trackTime: true,
          trackActivity: true,
          screenshots: true,
          allowManualTime: true,
        },
      };

      const response = await projectsAPI.createProject(projectData);

      // Reset form
      setFormData({
        name: "",
        client: "",
        budget: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });

      onProjectCreated(response.data.project);
      alert(`Project "${formData.name}" created successfully!`);
    } catch (error) {
      console.error("Failed to create project:", error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err) => err.msg || err.message || err.toString())
            .join("\n");
          alert(`Validation Errors:\n${errorMessages}`);
        } else {
          const errorMessage =
            errorData.error || errorData.message || "Invalid project data";
          alert(`Error: ${errorMessage}`);
        }
      } else if (error.response?.status === 403) {
        alert("You don't have permission to create projects");
      } else {
        alert(`Failed to create project: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      client: "",
      budget: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Project Name" required error={errors.name}>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter project name"
            error={!!errors.name}
          />
        </FormField>

        <FormField label="Client Name" required error={errors.client}>
          <Input
            type="text"
            value={formData.client}
            onChange={(e) => handleInputChange("client", e.target.value)}
            placeholder="Enter client name"
            error={!!errors.client}
          />
        </FormField>

        <FormField label="Budget (USD)" required error={errors.budget}>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.budget}
            onChange={(e) => handleInputChange("budget", e.target.value)}
            placeholder="0.00"
            error={!!errors.budget}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" required error={errors.startDate}>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              error={!!errors.startDate}
            />
          </FormField>

          <FormField label="End Date (Optional)" error={errors.endDate}>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              min={formData.startDate}
              error={!!errors.endDate}
            />
          </FormField>
        </div>

        <FormField label="Description">
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter project description (optional)"
            rows={3}
          />
        </FormField>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
