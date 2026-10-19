import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionUser } from '../models/auth.models';
import { Task } from '../models/tasks.models';
import { SessionService } from '../services/session.service';
import { TasksService } from '../services/tasks.service';
import { formatTaskLabel } from '../utils/legacy-format';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completado',
  RESUELTO: 'Resuelto',
  COMPLETED: 'Completado'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  visibleTasks: Task[] = [];
  user: SessionUser = {};
  loading = true;
  error = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private tasksService: TasksService,
    private sessionService: SessionService
  ) {}

  statusLabel(status: string): string {
    return STATUS_LABELS[(status || '').toUpperCase()] || status;
  }

  private applyTasks(tasks: Task[]): void {
    const visibleTasks = tasks
      .filter((task) => task.status !== 'ARCHIVED')
      .map((task) => ({
        ...task,
        label: formatTaskLabel(task)
      }));

    visibleTasks.sort((leftTask, rightTask) => (leftTask.priority > rightTask.priority ? -1 : 1));

    this.zone.run(() => {
      this.tasks = tasks;
      this.visibleTasks = visibleTasks;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  private setLoadError(): void {
    this.zone.run(() => {
      this.error = 'No se pudo cargar el dashboard';
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  async ngOnInit(): Promise<void> {
    const token = this.sessionService.getToken();
    this.user = this.sessionService.getUser();
    if (!token) {
      await this.router.navigate(['/login']);
      return;
    }

    try {
      const tasks = await this.tasksService.getTasks(this.user.username ?? '', token);
      this.applyTasks(tasks);
    } catch (error) {
      this.setLoadError();
      console.error(error);
    }
  }

  async logout(): Promise<void> {
    this.sessionService.clearSession();
    await this.router.navigate(['/login']);
  }
}
