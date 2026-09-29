import { Rating } from '../models/Rating.js';

// GET /api/ratings
export async function getAllRatings(req, res, next) {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 }).lean();
    res.json({ ratings });
  } catch (err) { next(err); }
}

// GET /api/ratings/:id
export async function getRating(req, res, next) {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ message: 'Rating not found' });
    res.json({ rating });
  } catch (err) { next(err); }
}

// POST /api/ratings
export async function createRating(req, res, next) {
  try {
    const { movieCode, rating, note, ratedBy } = req.body;

    // Basic validation as required by README/Tests
    if (!movieCode) return res.status(400).json({ message: 'movieCode is required' });

    const newRating = await Rating.create({
      movieCode,
      rating,
      note,
      ratedBy
    });

    res.status(201).json({ rating: newRating });
  } catch (err) {
    // Handle MongoDB duplicate key error for the compound index if necessary,
    // but the requirement says pass unexpected errors to next(err).
    next(err);
  }
}

// GET /api/ratings/summary?movieCode=MV101
export async function getRatingSummary(req, res, next) {
  try {
    const { movieCode } = req.query;
    if (!movieCode) {
      return res.status(400).json({ message: 'movieCode is required' });
    }

    const stats = await Rating.aggregate([
      { $match: { movieCode } },
      {
        $group: {
          _id: '$movieCode',
          averageRating: { $avg: '$rating' },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        movieCode,
        averageRating: 0,
        ratingCount: 0
      });
    }

    const result = stats[0];
    res.json({
      movieCode: result._id,
      averageRating: result.averageRating,
      ratingCount: result.ratingCount
    });
  } catch (err) { next(err); }
}
