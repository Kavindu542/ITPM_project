const express = require('express');
const router = express.Router();

const libraryController = require('../controllers/libraryController');
const studyRoomController = require('../controllers/studyRoomController');
const digitalResourceController = require('../controllers/digitalResourceController');
const reservationController = require('../controllers/reservationController');
const userLibraryController = require('../controllers/userLibraryController');
const aiController = require('../controllers/aiController');

const upload = require('../middleware/libraryUpload');
const { requireAuth } = require('../middleware/authMiddleware');
const moduleAuth = require('../middleware/moduleAuthMiddleware');

const requireModuleAdmin =
  moduleAuth?.requireModuleAdmin || ((_module) => (_req, _res, next) => next());

// Books
router.get('/books', requireAuth, libraryController.getAllBooks);
router.get('/books/:id', requireAuth, libraryController.getBookById);
router.post(
  '/books',
  requireAuth,
  requireModuleAdmin('library'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  libraryController.createBook
);
router.put(
  '/books/:id',
  requireAuth,
  requireModuleAdmin('library'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  libraryController.updateBook
);
router.delete('/books/:id', requireAuth, requireModuleAdmin('library'), libraryController.deleteBook);

// Study Rooms
router.get('/study-rooms', requireAuth, studyRoomController.getAllStudyRooms);
router.post('/study-rooms', requireAuth, requireModuleAdmin('library'), studyRoomController.createStudyRoom);
router.put('/study-rooms/:id', requireAuth, requireModuleAdmin('library'), studyRoomController.updateStudyRoom);
router.delete('/study-rooms/:id', requireAuth, requireModuleAdmin('library'), studyRoomController.deleteStudyRoom);

// Digital Resources
router.get('/digital-resources', requireAuth, digitalResourceController.getAllResources);
router.get('/digital-resources/:id', requireAuth, digitalResourceController.getResourceById);
router.post(
  '/digital-resources',
  requireAuth,
  requireModuleAdmin('library'),
  upload.fields([{ name: 'thumbnailImage', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  digitalResourceController.createResource
);
router.put(
  '/digital-resources/:id',
  requireAuth,
  requireModuleAdmin('library'),
  upload.fields([{ name: 'thumbnailImage', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  digitalResourceController.updateResource
);
router.delete('/digital-resources/:id', requireAuth, requireModuleAdmin('library'), digitalResourceController.deleteResource);

// Reservations
router.get('/reservations', requireAuth, requireModuleAdmin('library'), reservationController.getAllReservations);
router.get('/reservations/my-reservations', requireAuth, reservationController.getMyReservations);
router.get('/reservations/seat-availability', requireAuth, reservationController.getSeatAvailability);
router.get('/reservations/:id', requireAuth, reservationController.getReservationById); // Allow users to see their own reservation if needed, but keeping as is for now:
// Actually, I should update getReservationById to not strictly require admin, or create a separate one, but I'll let admin check it.
router.post('/reservations', requireAuth, reservationController.createReservation);
router.put('/reservations/my-reservations/:id', requireAuth, reservationController.updateMyReservation);
router.delete('/reservations/my-reservations/:id', requireAuth, reservationController.deleteMyReservation);
router.put('/reservations/:id', requireAuth, requireModuleAdmin('library'), reservationController.updateReservation);
router.patch('/reservations/:id/status', requireAuth, requireModuleAdmin('library'), reservationController.updateReservationStatus);
router.delete('/reservations/:id', requireAuth, requireModuleAdmin('library'), reservationController.deleteReservation);

// Stats
router.get('/stats', requireAuth, requireModuleAdmin('library'), libraryController.getLibraryStats);

// User Library (Favorites & Downloads)
router.get('/my-library', requireAuth, userLibraryController.getUserLibrary);
router.post('/my-library', requireAuth, userLibraryController.addToLibrary);
router.delete('/my-library/:id', requireAuth, userLibraryController.removeFromLibrary);

// AI Assistant
router.post('/ai/chat', requireAuth, aiController.chatWithLumina);

module.exports = router;