import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import { ApiError } from '../utils/apiError';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const allowedExtensions = new Set(['.pdf', '.docx']);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isMimeValid = allowedMimeTypes.has(mimeType);
  const isExtValid = allowedExtensions.has(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(
      ApiError.unsupportedMediaType(
        'Only PDF and DOCX files are allowed. Please upload a valid .pdf or .docx resume.',
        'UNSUPPORTED_MEDIA_TYPE'
      )
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

export const uploadSingleResume = upload.single('file');

export default uploadSingleResume;
