export type ObjectStorageConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

export interface ObjectStorageProvider {
  deleteObject(storageKey: string): Promise<void>;
  objectExists(storageKey: string): Promise<boolean>;
  listObjectKeys(prefix: string, maxKeys?: number): Promise<string[]>;
  checkAvailability(): Promise<boolean>;
}
