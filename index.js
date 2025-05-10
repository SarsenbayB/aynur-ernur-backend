import express from 'express';
import dotenv from "dotenv";
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import FileModel from './models/File.js';

import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

import { registerValidation, loginValidation, postCreateValidation, fileCreateValidation } from './validations.js';

import { handleValidationErrors, checkAuth } from './utils/index.js';

import { UserController, PostController, FileController, TeamController, ImageController } from './controllers/index.js';


// Загружаем переменные окружения
dotenv.config();

// Constants
const PORT = process.env.PORT || 9999;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const UPLOAD_DIR = path.join(__dirname, 'uploads');


if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'files'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'files'), { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, 'images'))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, 'images'), { recursive: true });
}

const dropTextIndex = async () => {
  try {
    await FileModel.collection.dropIndex("text_1");
    console.log("Индекс text_1 успешно удален");
  } catch (err) {
    if (err.code === 27) {
      console.log("Индекс text_1 не существует");
    } else {
      console.error("Ошибка при удалении индекса:", err);
    }
  }
};

mongoose
  .connect(
    `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.0ez2w6n.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log('DB ok');
    return dropTextIndex();
  })
  .catch((err) => console.log('DB error', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const imageStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'images'));
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'files'));
  },
  filename: (_, file, cb) => {
    // Ensure the filename is properly encoded
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // Remove any potentially problematic characters but keep Cyrillic
    const safeName = originalName.replace(/[^а-яА-ЯёЁa-zA-Z0-9.-]/g, '_');
    cb(null, safeName);
  },
});


const uploadImage = multer({ storage: imageStorage });
const uploadFile = multer({ storage: fileStorage });


app.use(express.json());
app.use(cors());
app.use('/api/uploads', express.static(UPLOAD_DIR));


app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/confirm/:token', UserController.confirmEmail);
app.post('/auth/forgot-password', UserController.forgotPassword);
app.post('/auth/reset-password/:token', UserController.resetPassword);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/api/upload/image', uploadImage.single('image'), (req, res) => {
  res.json({ url: `/api/uploads/images/${req.file.originalname}` });
});

app.post('/api/upload/file', uploadFile.single('file'), (req, res) => {
  const fileName = encodeURIComponent(req.file.filename);
  res.json({
    url: `/api/uploads/files/${fileName}`,
    originalName: req.file.filename
  });
});

app.get('/api/tags', PostController.getLastTags);

app.get('/api/posts', PostController.getAll);
app.get('/api/posts/tags', PostController.getLastTags);
app.get('/api/posts/:id', PostController.getOne);
app.post('/api/posts', checkAuth, postCreateValidation, PostController.create);
app.delete('/api/posts/:id', checkAuth, PostController.remove);
app.patch(
  '/api/posts/:id',
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.update,
);

app.get('/api/files', FileController.getAllFiles);
app.get('/api/files/:id', FileController.getOneFile);
app.post('/api/files', checkAuth, fileCreateValidation, handleValidationErrors, FileController.createFile);
app.delete('/api/files/:id', checkAuth, FileController.removeFile);
app.put("/api/files/block/:id", checkAuth, FileController.blockFile);
app.put("/api/files/unBlock/:id", checkAuth, FileController.unBlockFile);
app.patch('/api/files/:id', checkAuth, fileCreateValidation, handleValidationErrors, FileController.updateFile);
app.get('/api/download/:filename', FileController.download);


app.post('/api/team/add', checkAuth, TeamController.createTeam);
app.get('/api/team', TeamController.getTeamAll);
app.delete('/api/team/:id', checkAuth, TeamController.removeTeam);
app.get('/api/team/:id', TeamController.getOneTeam);
app.patch('/api/team/:id', checkAuth, TeamController.update);


app.post('/api/images/add', checkAuth, ImageController.createImage);
app.get('/api/images', ImageController.getAllImage);
app.delete('/api/images/:id', checkAuth, ImageController.removeImage);

app.use((err, res,) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так', error: err.message });
});

app.listen(PORT || 9999, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK');
});
