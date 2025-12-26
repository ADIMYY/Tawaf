import multer from 'multer';
import AppError from '../Utils/appError.js';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        // Pass a standard Error (multer doesn't understand AppError)
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max per file
    }
});

export const uploadMixImage = (fields) => {
    return upload.fields(fields);
};

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File too large. Max size is 5MB.', 400));
        }
        return next(new AppError('File upload error.', 400));
    }
    if (err.message === 'Only image files are allowed!') {
        return next(new AppError(err.message, 400));
    }
    next(err);
};