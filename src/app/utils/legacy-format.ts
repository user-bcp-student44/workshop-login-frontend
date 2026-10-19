import { Task } from '../models/tasks.models';

type TaskLabelInput = Pick<Task, 'priority' | 'owner'> | null | undefined;

export function formatTaskLabel(task: TaskLabelInput): string {
  if (!task) {
    return 'SIN-DATOS';
  }
  const priority = task.priority ? String(task.priority).toUpperCase() : 'NORMAL';
  const owner = task.owner ? String(task.owner).toUpperCase() : 'SIN-ASIGNAR';
  return priority + ' · ' + owner;
}
