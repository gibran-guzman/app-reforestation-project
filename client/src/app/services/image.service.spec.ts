import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateSize', () => {
    it('returns null for small file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(service.validateSize(file)).toBeNull();
    });

    it('returns error for oversized file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      expect(service.validateSize(file)).toContain('5 MB');
    });
  });
});
