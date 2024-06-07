const multer = require("multer");
const fs = require("fs");

const { req, res } = require("express");

const storageData = (name) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const path = `public/${name}`;
      try {
        fs.mkdirSync(path, { recursive: true });
        cb(null, path);
      } catch (err) {
        // Handle directory creation error
        cb(err.message, null);
      }
    },
    filename: (
      req,
      file,
      cb
    ) => {
      const name =
        typeof file.originalname === "string"
          ? file.originalname.replace(/[^a-zA-Z0-9.]/g, "_")
          : file.originalname;
      cb(null, Date.now() + "-" + name);
    },
  });
  const upload = multer({ storage });

  return upload;
};

module.exports =storageData;