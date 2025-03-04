import TeamModel from '../models/Team.js';


// Добавить нового члена команды
export const createTeam = async (req, res) => {
    try {
        const doc = new TeamModel({
            name: req.body.name,
            role: req.body.role,
            imageUrl: req.body.imageUrl,
            user: req.userId,
        });

        const team = await doc.save();

        res.json(team);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось создать статью',
        });
    }
};

// Получить список всех членов команды
export const getTeamAll = async (req, res) => {
    try {
        const teams = await TeamModel.find().populate('user').exec();
        res.json(teams);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось получить статьи',
        });
    }
};


export const getOneTeam = async (req, res) => {
    try {
        const teamId = req.params.id;

        // Найти команду по ID
        const team = await TeamModel.findById(teamId);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        res.json(team);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch team' });
    }
};

export const update = async (req, res) => {
    try {
        const teamId = req.params.id;

        await TeamModel.updateOne(
            {
                _id: teamId,
            },
            {
                name: req.body.name,
                role: req.body.role,
                imageUrl: req.body.imageUrl,
                user: req.userId,
            },
        );

        res.json({
            success: true,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Не удалось обновить',
        });
    }
};

// Удалить члена команды
export const removeTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        const doc = await TeamModel.findOneAndDelete({ _id: teamId });

        if (!doc) {
            return res.status(404).json({ message: 'Участник команды не найден' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка удаления участника команды' });
    }
};

