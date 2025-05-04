import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import UserModel from '../models/User.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465, // SSL-порт
  secure: true, // Использование SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    // Проверяем, есть ли уже зарегистрированный пользователь
    const existingUsers = await UserModel.find({});
    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ message: 'Тіркелуге болмайды. Аккаунт бар.' });
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);


    const confirmationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });


    const user = new UserModel({
      email,
      fullName,
      passwordHash: hash,
      confirmationToken,
      isAdmin: false,
    });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Подтверждение аккаунта',
      html: `<p>Для подтверждения аккаунта перейдите по <a href="${process.env.FRONTEND_URL}/confirm/${confirmationToken}">ссылке</a>.</p>`,
    });

    res.json({ message: 'Регистрация успешно завершена. Проверьте почту для подтверждения.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка регистрации.' });
  }
};



export const confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findOne({ email: decoded.email });
    if (!user || user.isConfirmed) {
      return res.status(400).json({ message: 'Неверный токен или аккаунт уже подтверждён.' });
    }

    user.isConfirmed = true;
    user.confirmationToken = null;
    await user.save();

    res.json({ message: 'Email подтверждён.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка подтверждения.' });
  }
};


export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

    if (!isValidPass) {
      return res.status(400).json({
        message: 'Неверный логин или пароль',
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    const { ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось авторизоваться',
    });
  }
};


// Сброс пароля
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.RESET_SECRET, { expiresIn: '1h' });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Сброс пароля',
      html: `<p>Сброс пароля: <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Сбросить</a></p>`,
    });

    res.json({ message: 'Ссылка для сброса пароля отправлена.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при сбросе пароля.' });
  }
};

// Установка нового пароля
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.RESET_SECRET);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    user.passwordHash = hash;
    await user.save();

    res.json({ message: 'Пароль обновлён.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления пароля.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const { ...userData } = user._doc;

    res.json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Нет доступа',
    });
  }
};
