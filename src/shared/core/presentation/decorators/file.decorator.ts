import { applyDecorators, BadRequestException, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

export interface FileOptions {
    maxFileSize?: number;
    mimeTypes?: string[];
}

export const UseFile = (fileName: string, options: FileOptions = { maxFileSize: 50 * 1024 * 1024, mimeTypes: ['application/pdf'] }) => {
    return applyDecorators(
        UseInterceptors(FileInterceptor(fileName, {
            limits: {
                fileSize: options.maxFileSize,
            },
            fileFilter: (_, file, callback) => {
                if (options.mimeTypes?.includes(file.mimetype)) {
                  callback(null, true);
                } else {
                  callback(new BadRequestException(`Only ${options.mimeTypes?.join(', ')} files are allowed`), false);
                }
            },
        })),
    );
}