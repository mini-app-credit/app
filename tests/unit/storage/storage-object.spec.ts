import { UUIDIdentifier } from 'src/shared';
import { StorageObject } from 'src/modules/storage/domain/entities/storage-object.entity';
import { StorageKey } from 'src/modules/storage/domain/value-objects/storage-key.vo';
import { MimeType } from 'src/modules/storage/domain/value-objects/mime-type.vo';

describe('StorageObject Entity', () => {
  const userId = UUIDIdentifier.generate();

  function createValidObject(overrides: Partial<Parameters<typeof StorageObject.create>[0]> = {}) {
    return StorageObject.create({
      userId,
      key: StorageKey.create('uploads/test.json'),
      size: 1024,
      mimeType: MimeType.create('application/json'),
      checksum: 'abc123',
      bucket: 'test-bucket',
      meta: { project_id: 'proj-1' },
      ...overrides,
    });
  }

  describe('Rule: Creation', () => {
    it('generates id and sets all props', () => {
      const obj = createValidObject();

      expect(obj.id).toBeDefined();
      expect(obj.userId).toBe(userId);
      expect(obj.key.value).toBe('uploads/test.json');
      expect(obj.size).toBe(1024);
      expect(obj.mimeType.value).toBe('application/json');
      expect(obj.checksum).toBe('abc123');
      expect(obj.bucket).toBe('test-bucket');
      expect(obj.meta).toEqual({ project_id: 'proj-1' });
    });
  });

  describe('Rule: Restore', () => {
    it('hydrates from persisted props', () => {
      const id = UUIDIdentifier.generate();
      const now = new Date();

      const obj = StorageObject.restore({
        id,
        userId,
        key: StorageKey.create('uploads/test.json'),
        size: 2048,
        mimeType: MimeType.create('application/pdf'),
        checksum: null,
        bucket: 'bucket',
        meta: {},
        createdAt: now,
        updatedAt: now,
      });

      expect(obj.id).toBe(id);
      expect(obj.size).toBe(2048);
    });
  });

  describe('Rule: Mutations', () => {
    it('updateChecksum changes checksum', () => {
      const obj = createValidObject();

      obj.updateChecksum('new-checksum');

      expect(obj.checksum).toBe('new-checksum');
    });

    it('updateMeta merges meta object', () => {
      const obj = createValidObject();

      obj.updateMeta({ user_id: 'user-1' });

      expect(obj.meta).toEqual({ project_id: 'proj-1', user_id: 'user-1' });
    });
  });
});
