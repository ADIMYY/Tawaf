import express from 'express';
import { deleteExpiredVisaUsers } from '../Utils/visaExpirationCron.js';

const router = express.Router();

router.get('/api/cron/check-visa-expiration', async (req, res) => {
    try {
        await deleteExpiredVisaUsers();
        res.status(200).json({ message: 'Visa expiration check completed successfully' });
    } catch (error) {
        console.error('Error in visa expiration check:', error);
        res.status(500).json({ error: 'Failed to check visa expiration' });
    }
});

export default router; 