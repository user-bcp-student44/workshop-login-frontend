import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { TasksService } from './tasks.service';

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('TasksService', () => {
  it('requests tasks endpoint with bearer token and returns task list', async () => {
    const service = new TasksService();
    const expectedTasks = [
      { title: 'T1', description: 'D1', status: 'TODO', priority: 'HIGH', owner: 'student' }
    ];

    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: expectedTasks });

    const result = await service.getTasks('student', 'token-abc');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/tasks?owner=student',
      { headers: { Authorization: 'Bearer token-abc' } }
    );
    expect(result).toEqual(expectedTasks);
  });
});
