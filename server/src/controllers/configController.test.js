import { vi } from 'vitest';
import { createRequire } from 'module';

const cjsRequire = createRequire(import.meta.url);
const controller = cjsRequire('./configController');

describe('configController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    next = vi.fn();
  });

  describe('getSoilTextures', () => {
    it('returns a list of soil textures', async () => {
      await controller.getSoilTextures(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ value: 'sandy' }),
          expect.objectContaining({ value: 'loamy' }),
        ]),
      });
    });

    it('returns 6 textures', async () => {
      await controller.getSoilTextures(req, res, next);

      const callArg = res.json.mock.calls[0][0];
      expect(callArg.data).toHaveLength(6);
    });

    it('passes error to next if res.json throws', async () => {
      res.json.mockImplementationOnce(() => { throw new Error('json error'); });

      await controller.getSoilTextures(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
