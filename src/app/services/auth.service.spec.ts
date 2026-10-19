import { describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from './auth.service';

vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('AuthService', () => {
  it('calls login endpoint with expected payload and returns response data', async () => {
    const service = new AuthService();
    const payload = {
      username: 'student',
      password: 'Workshop123!',
      client: 'angular-workshop' as const
    };
    const expectedData = {
      token: 'token-123',
      user: { username: 'student' }
    };

    (axios.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: expectedData });

    const result = await service.login(payload);

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/auth/login',
      payload,
      { timeout: 5000 }
    );
    expect(result).toEqual(expectedData);
  });
});
