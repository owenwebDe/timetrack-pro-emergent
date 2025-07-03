from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from ..models.project import Project, ProjectCreate, ProjectUpdate, Task, TaskCreate, TaskUpdate, ProjectStatus
from ..models.user import User
from ..auth.dependencies import get_current_user, require_admin_or_manager
from ..database.mongodb import DatabaseOperations
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=Project)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_admin_or_manager)
):
    """Create a new project"""
    try:
        project = Project(
            **project_data.dict(),
            created_by=current_user.id
        )
        
        await DatabaseOperations.create_document("projects", project.dict())
        
        return project
        
    except Exception as e:
        logger.error(f"Create project error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

@router.get("/", response_model=List[Project])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[ProjectStatus] = None,
    current_user: User = Depends(get_current_user)
):
    """Get projects"""
    try:
        query = {}
        
        # If not admin/manager, only show projects user is involved in
        if current_user.role not in ["admin", "manager"]:
            query["$or"] = [
                {"created_by": current_user.id},
                {"team_members": current_user.id}
            ]
        
        if status:
            query["status"] = status
        
        projects_data = await DatabaseOperations.get_documents(
            "projects",
            query,
            sort=[("created_at", -1)],
            skip=skip,
            limit=limit
        )
        
        return [Project(**project) for project in projects_data]
        
    except Exception as e:
        logger.error(f"Get projects error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get projects"
        )

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project by ID"""
    try:
        project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        if not project_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = Project(**project_data)
        
        # Check access rights
        if (current_user.role not in ["admin", "manager"] and 
            project.created_by != current_user.id and 
            current_user.id not in project.team_members):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project"
        )

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update project"""
    try:
        project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        if not project_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = Project(**project_data)
        
        # Check permissions
        if (current_user.role not in ["admin", "manager"] and 
            project.created_by != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        update_data = project_update.dict(exclude_unset=True)
        
        if update_data:
            await DatabaseOperations.update_document(
                "projects",
                {"id": project_id},
                update_data
            )
        
        # Get updated project
        updated_project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        return Project(**updated_project_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update project error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(require_admin_or_manager)
):
    """Delete project"""
    try:
        project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        if not project_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Delete related tasks
        await DatabaseOperations.delete_document("tasks", {"project_id": project_id})
        
        # Delete project
        await DatabaseOperations.delete_document("projects", {"id": project_id})
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete project error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )

# Task endpoints
@router.post("/{project_id}/tasks", response_model=Task)
async def create_task(
    project_id: str,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new task in project"""
    try:
        # Verify project exists and user has access
        project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        if not project_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = Project(**project_data)
        if (current_user.role not in ["admin", "manager"] and 
            project.created_by != current_user.id and 
            current_user.id not in project.team_members):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        task = Task(
            **task_data.dict(),
            project_id=project_id,
            created_by=current_user.id
        )
        
        await DatabaseOperations.create_document("tasks", task.dict())
        
        return task
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create task error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )

@router.get("/{project_id}/tasks", response_model=List[Task])
async def get_project_tasks(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get tasks for a project"""
    try:
        # Verify project access
        project_data = await DatabaseOperations.get_document("projects", {"id": project_id})
        if not project_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        project = Project(**project_data)
        if (current_user.role not in ["admin", "manager"] and 
            project.created_by != current_user.id and 
            current_user.id not in project.team_members):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        tasks_data = await DatabaseOperations.get_documents(
            "tasks",
            {"project_id": project_id},
            sort=[("created_at", -1)]
        )
        
        return [Task(**task) for task in tasks_data]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project tasks error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project tasks"
        )

@router.get("/stats/dashboard")
async def get_project_stats(current_user: User = Depends(get_current_user)):
    """Get project statistics for dashboard"""
    try:
        # Projects by status
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}, "total_budget": {"$sum": "$budget"}, "total_spent": {"$sum": "$spent"}}}
        ]
        project_stats = await DatabaseOperations.aggregate("projects", pipeline)
        
        # Recent projects
        recent_projects = await DatabaseOperations.get_documents(
            "projects",
            {},
            sort=[("updated_at", -1)],
            limit=5
        )
        
        # Task statistics
        task_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        task_stats = await DatabaseOperations.aggregate("tasks", task_pipeline)
        
        return {
            "project_stats": {stat["_id"]: {"count": stat["count"], "budget": stat["total_budget"], "spent": stat["total_spent"]} for stat in project_stats},
            "recent_projects": [Project(**project) for project in recent_projects],
            "task_stats": {stat["_id"]: stat["count"] for stat in task_stats}
        }
        
    except Exception as e:
        logger.error(f"Get project stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get project statistics"
        )