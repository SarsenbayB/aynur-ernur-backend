import ImageModel from '../models/Image.js'

export const createImage = async (req, res) => {
    try {
        const doc = new ImageModel({
            imageUrl: req.body.imageUrl,
            user: req.userId,
        });

        const image = await doc.save();

        res.json(image);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось создать изображение',
        });
    }
};

export const getAllImage = async (req, res) => {
    try {
        const images = await ImageModel.find().sort({ createdAt: -1 }).exec();
        res.json(images);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Не удалось получить изображения',
        });
    }
};

export const removeImage = async (req, res) => {
    try {
        const imageId = req.params.id;

        const doc = await ImageModel.findOneAndDelete({ _id: imageId });

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