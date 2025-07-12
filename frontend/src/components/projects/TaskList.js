// frontend/src/components/projects/TaskList.js - Task list display component
import React from "react";
import { TaskRow } from "./TaskRow";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { EmptyState } from "../common/EmptyState";

export const TaskList = ({
  tasks,
  projects,
  user,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignFirstTask,
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon="📋"
          title="No tasks found"
          description="Try adjusting your filters to see more tasks, or create your first task to get started."
          action={
            onAssignFirstTask && (
              <button
                onClick={onAssignFirstTask}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign First Task
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assignee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Est. Hours
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projects={projects}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
