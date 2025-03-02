import multer from "multer";

import appError from "../Utils/appError.js";

const multerOptions = () => {
    //* Memory Storage engine
    const multerStorage = multer.memoryStorage();

    const multerFilter = function (req, file, cb) {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        } else {
            cb(new appError('only image files allowed', 400), false);
        }
    };

    const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
    return upload;
}

export const uploadSingleImage = (fileName) => multerOptions().single(fileName);