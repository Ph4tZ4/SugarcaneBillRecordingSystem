
import express from 'express';

const router = express.Router();

router.get('/check-bill/:billNumber', async (req, res) => {
    try {
        const { billNumber } = req.params;
        const scriptUrl = process.env.GOOGLE_SHEET_SCRIPT_URL;

        if (!scriptUrl) {
            res.status(500).json({ message: 'Google Sheet Script URL not configured' });
            return
        }

        // Action=checkBill is defined in our Apps Script
        const response = await fetch(`${scriptUrl}?action=checkBill&billNumber=${billNumber}`);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Error checking bill from sheet:', error);
        res.status(500).json({ message: 'Error connecting to sheet service' });
    }
});

export default router;
