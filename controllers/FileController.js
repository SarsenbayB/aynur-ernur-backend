import FileModel from '../models/File.js';
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import { promises as fsPromises } from 'fs';



export const createFile = async (req, res) => {
    try {
        // Проверяем наличие необходимых данных
        if (!req.body.title || !req.userId) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const doc = new FileModel({
            title: req.body.title,
            fileUrl: req.body.fileUrl,
            user: req.userId,
        });

        const file = await doc.save();
        res.json(file);
    } catch (err) {
        console.log('Error details:', err); // Более детальное логирование
        res.status(500).json({
            message: 'Failed to create file',
            error: err.message // Добавляем детали ошибки в ответ
        });
    }
};

export const getAllFiles = async (req, res) => {
    try {
        const files = await FileModel.find()
            .populate('user', 'fullName')
            .sort({ createdAt: -1 })
            .exec();

        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to fetch files',
        });
    }
};

export const getOneFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        const file = await FileModel.findOneAndUpdate(
            { _id: fileId },
            { $inc: { viewsCount: 1 } },
            { new: true }
        ).populate('user', 'fullName');

        if (!file) {
            return res.status(404).json({
                message: 'File not found',
            });
        }

        res.json(file);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to fetch file',
        });
    }
};

export const removeFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        const doc = await FileModel.findOneAndDelete({ _id: fileId });

        if (!doc) {
            return res.status(404).json({
                message: 'File not found',
            });
        }

        res.json({
            success: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to delete file',
        });
    }
};

export const updateFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        const doc = await FileModel.findOneAndUpdate(
            { _id: fileId },
            {
                title: req.body.title,
                fileUrl: req.body.fileUrl,
                user: req.userId,
            },
            { new: true }
        );

        if (!doc) {
            return res.status(404).json({
                message: 'File not found',
            });
        }

        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Failed to update file',
        });
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const download = async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(__dirname, '../uploads/files', filename);

        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        // Check if file exists using promises API
        try {
            await fsPromises.access(filePath);
        } catch (error) {
            return res.status(404).json({
                message: 'Файл табылмады',
                error: error.message
            });
        }
        // Create read stream using standard fs
        const fileStream = fs.createReadStream(filePath);

        // Handle stream errors
        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Файлды жүктеу кезінде қате пайда болды',
                    error: error.message
                });
            }
        });

        // Pipe the file to response
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            message: 'Файлды өңдеу кезінде қате пайда болды',
            error: error.message
        });
    }
};

// Block Files
export const blockFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        await FileModel.updateMany({ _id: fileId }, { status: 'Blocked' });

        res.status(200).json({
            message: 'Файл блокирован',
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Неверные данные для блокирование файла',
        });
    }
};

// Unblock Files
export const unBlockFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        await FileModel.updateMany({ _id: fileId }, { status: 'Active' });

        res.status(200).json({
            message: 'Файл разблокирован',
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Неверные данные для разблокирование файла',
        });
    }
};