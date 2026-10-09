import { Router, Request, Response } from 'express';
import { processAgentChat } from '../services/agentEngine';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Field "message" is required.' });
    }

    const response = await processAgentChat(message, history || []);
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[Chat Route Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

export default router;
