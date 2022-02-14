import '../models/user.model.js';
import * as yup from 'yup';

export const phoneSchema = yup.string().matches(/^\+[0-9]{3}(\d+)\d{3}\d{2}\d{2}/g).required().max(12);