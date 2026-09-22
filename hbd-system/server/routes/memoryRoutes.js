const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All memory routes require authentication
router.use(requireAuth);

// GET /api/memories - list all memories sorted chronologically
router.get('/', async (req, res, next) => {
  try {
    const sort = req.query.sort === 'desc' ? 'desc' : 'asc';
    const memories = await store.getMemories(sort);
    return res.json({
      success: true,
      count: memories.length,
      data: memories
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/memories/on-this-day - flashback for today or specified month/day
router.get('/on-this-day', async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);
    const day = parseInt(req.query.day || now.getDate(), 10);

    const matches = await store.getMemoriesOnDate(month, day);
    return res.json({
      success: true,
      month,
      day,
      hasMatch: matches.length > 0,
      data: matches
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/memories/:id - get single memory
router.get('/:id', async (req, res, next) => {
  try {
    const memory = await store.getMemoryById(req.params.id);
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }
    return res.json({
      success: true,
      data: memory
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/memories - create new memory (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { date, title, story, location, photos, song } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Memory date is required (YYYY-MM-DD)'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Memory title is required'
      });
    }

    const created = await store.createMemory({
      date,
      title,
      story: story || '',
      location: location || '',
      photos: Array.isArray(photos) ? photos : [],
      song: song || null
    });

    return res.status(201).json({
      success: true,
      message: 'Memory created successfully',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/memories/:id - update existing memory (admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { date, title, story, location, photos, song } = req.body;
    const updated = await store.updateMemory(req.params.id, {
      date,
      title,
      story,
      location,
      photos,
      song
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    return res.json({
      success: true,
      message: 'Memory updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/memories/:id - delete memory (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await store.deleteMemory(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    return res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
